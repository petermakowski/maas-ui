import configureStore from "redux-mock-store";

import CreateBcache from "./CreateBcache";

import { MIN_PARTITION_SIZE } from "@/app/store/machine/constants";
import { BcacheModes } from "@/app/store/machine/types";
import type { RootState } from "@/app/store/root/types";
import { DiskTypes } from "@/app/store/types/enum";
import {
  machineDetails as machineDetailsFactory,
  machineState as machineStateFactory,
  machineStatus as machineStatusFactory,
  machineStatuses as machineStatusesFactory,
  nodeDisk as diskFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { renderWithBrowserRouter, screen, userEvent } from "testing/utils";

const mockStore = configureStore<RootState>();

describe("CreateBcache", () => {
  it("sets the initial name correctly", () => {
    const cacheSet = diskFactory({ type: DiskTypes.CACHE_SET });
    const bcaches = [
      diskFactory({
        name: "bcache0",
        parent: {
          id: 0,
          type: DiskTypes.BCACHE,
          uuid: "bcache0",
        },
        type: DiskTypes.VIRTUAL,
      }),
      diskFactory({
        name: "bcache1",
        parent: {
          id: 1,
          type: DiskTypes.BCACHE,
          uuid: "bcache1",
        },
        type: DiskTypes.VIRTUAL,
      }),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: [
          machineDetailsFactory({
            disks: [cacheSet, ...bcaches],
            system_id: "abc123",
          }),
        ],
        statuses: machineStatusesFactory({
          abc123: machineStatusFactory(),
        }),
      }),
    });

    renderWithBrowserRouter(
      <CreateBcache
        closeExpanded={jest.fn()}
        storageDevice={diskFactory()}
        systemId="abc123"
      />,
      { state }
    );

    // Two bcaches already exist so the next one should be bcache2
    expect(screen.getByRole("textbox", { name: /name/i })).toHaveValue(
      "bcache2"
    );
  });

  it("correctly dispatches an action to create a bcache", async () => {
    const cacheSet = diskFactory({ type: DiskTypes.CACHE_SET });
    const backingDevice = diskFactory({
      available_size: MIN_PARTITION_SIZE + 1,
      type: DiskTypes.PHYSICAL,
    });
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: [
          machineDetailsFactory({
            disks: [backingDevice, cacheSet],
            system_id: "abc123",
            supported_filesystems: [{ key: "fat32", ui: "FAT32" }],
          }),
        ],
        statuses: machineStatusesFactory({
          abc123: machineStatusFactory(),
        }),
      }),
    });
    const store = mockStore(state);

    renderWithBrowserRouter(
      <CreateBcache
        closeExpanded={jest.fn()}
        storageDevice={backingDevice}
        systemId="abc123"
      />,
      { store }
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /cache set/i }),
      cacheSet.id.toString()
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /cache mode/i }),
      BcacheModes.WRITE_BACK
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /filesystem/i }),
      "fat32"
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: /mount options/i }),
      "noexec"
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: /mount point/i }),
      "/path"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /create bcache/i })
    );

    expect(
      store
        .getActions()
        .find((action) => action.type === "machine/createBcache")
    ).toStrictEqual({
      meta: {
        method: "create_bcache",
        model: "machine",
      },
      payload: {
        params: {
          block_id: backingDevice.id,
          cache_mode: BcacheModes.WRITE_BACK,
          cache_set: cacheSet.id,
          fstype: "fat32",
          mount_options: "noexec",
          mount_point: "/path",
          name: "bcache0",
          system_id: "abc123",
        },
      },
      type: "machine/createBcache",
    });
  });
});
