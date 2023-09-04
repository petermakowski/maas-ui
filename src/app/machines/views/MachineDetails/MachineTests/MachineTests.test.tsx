import * as reactComponentHooks from "@canonical/react-components/dist/hooks";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter, Route, Routes } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import MachineTests from ".";

import { HardwareType } from "@/app/base/enum";
import type { RootState } from "@/app/store/root/types";
import {
  ScriptResultType,
  ScriptResultParamType,
} from "@/app/store/scriptresult/types";
import { TestStatusStatus } from "@/app/store/types/node";
import {
  machineState as machineStateFactory,
  machineDetails as machineDetailsFactory,
  scriptResult as scriptResultFactory,
  scriptResultState as scriptResultStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { renderWithMockStore, screen } from "testing/utils";

jest.mock("@canonical/react-components/dist/hooks", () => {
  const hooks = jest.requireActual("@canonical/react-components/dist/hooks");
  return {
    ...hooks,
    usePrevious: jest.fn(),
  };
});

const mockStore = configureStore<RootState>();

describe("MachineTests", () => {
  let state: RootState;
  beforeEach(() => {
    state = rootStateFactory({
      machine: machineStateFactory({
        loaded: true,
        items: [
          machineDetailsFactory({
            locked: false,
            permissions: ["edit"],
            system_id: "abc123",
            testing_status: TestStatusStatus.RUNNING,
          }),
        ],
      }),
      scriptresult: scriptResultStateFactory({
        loaded: true,
      }),
    });
  });

  it("renders headings for each hardware type", () => {
    state.nodescriptresult.items = { abc123: [1, 2, 3] };
    state.scriptresult.items = [
      scriptResultFactory({
        id: 1,
        result_type: ScriptResultType.TESTING,
        hardware_type: HardwareType.CPU,
      }),
      scriptResultFactory({
        id: 2,
        result_type: ScriptResultType.TESTING,
        hardware_type: HardwareType.Network,
      }),
      scriptResultFactory({
        id: 3,
        result_type: ScriptResultType.TESTING,
        hardware_type: HardwareType.Node,
      }),
    ];
    const store = mockStore(state);

    renderWithMockStore(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <Routes>
              <Route element={<MachineTests />} path="/machine/:id" />
            </Routes>
          </CompatRouter>
        </MemoryRouter>
      </Provider>,
      { store }
    );

    expect(screen.getAllByTestId("hardware-heading")[0]).toHaveTextContent(
      "CPU"
    );
    expect(screen.getAllByTestId("hardware-heading")[1]).toHaveTextContent(
      "Network"
    );
    expect(screen.getAllByTestId("hardware-heading")[2]).toHaveTextContent(
      "Other Results"
    );
  });

  it("renders headings for each block device", () => {
    state.nodescriptresult.items = { abc123: [1, 2] };
    state.scriptresult.items = [
      scriptResultFactory({
        id: 2,
        result_type: ScriptResultType.TESTING,
        hardware_type: HardwareType.Storage,
        physical_blockdevice: 2,
        parameters: {
          storage: {
            type: ScriptResultParamType.STORAGE,
            value: {
              id: 44,
              model: "QEMU HARDDISK",
              name: "sda",
              serial: "lxd_root",
              id_path: "/dev/disk/by-id/scsi-0QEMU_QEMU_HARDDISK_lxd_root",
              physical_blockdevice_id: 2,
            },
          },
        },
      }),
    ];
    const store = mockStore(state);

    renderWithMockStore(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <Routes>
              <Route element={<MachineTests />} path="/machine/:id" />
            </Routes>
          </CompatRouter>
        </MemoryRouter>
      </Provider>,
      { store }
    );
    expect(screen.getByTestId("storage-heading")).toHaveTextContent(
      "/dev/sda (model: QEMU HARDDISK, serial: lxd_root)"
    );
  });

  it("shows a heading for a block device without a model and serial", () => {
    state.nodescriptresult.items = { abc123: [1, 2] };
    state.scriptresult.items = [
      scriptResultFactory({
        id: 2,
        result_type: ScriptResultType.TESTING,
        hardware_type: HardwareType.Storage,
        physical_blockdevice: 2,
        parameters: {
          storage: {
            type: ScriptResultParamType.STORAGE,
            value: {
              id: 9,
              model: "",
              name: "sda",
              serial: "",
              id_path: "/dev/disk/by-id/scsi-0QEMU_QEMU_HARDDISK_lxd_root",
              physical_blockdevice_id: 2,
            },
          },
        },
      }),
    ];
    const store = mockStore(state);
    renderWithMockStore(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <Routes>
              <Route element={<MachineTests />} path="/machine/:id" />
            </Routes>
          </CompatRouter>
        </MemoryRouter>
      </Provider>,
      { store }
    );
    expect(screen.getByTestId("storage-heading")).toHaveTextContent("/dev/sda");
  });

  it("shows a heading for a network interface", () => {
    state.nodescriptresult.items = { abc123: [1, 2] };
    state.scriptresult.items = [
      scriptResultFactory({
        id: 2,
        result_type: ScriptResultType.TESTING,
        hardware_type: HardwareType.Network,
        parameters: {
          interface: {
            type: ScriptResultParamType.INTERFACE,
            value: {
              id: 856,
              mac_address: "52:54:00:57:e9:ac",
              name: "ens4",
              product: null,
              vendor: "Red Hat, Inc.",
            },
          },
        },
      }),
    ];
    const store = mockStore(state);
    renderWithMockStore(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <Routes>
              <Route element={<MachineTests />} path="/machine/:id" />
            </Routes>
          </CompatRouter>
        </MemoryRouter>
      </Provider>,
      { store }
    );
    expect(screen.getByTestId("hardware-device-heading")).toHaveTextContent(
      "ens4 (52:54:00:57:e9:ac)"
    );
  });

  it("fetches script results if they haven't been fetched", () => {
    state.nodescriptresult.items = { abc123: [] };
    state.scriptresult.items = [];
    const store = mockStore(state);
    renderWithMockStore(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <Routes>
              <Route element={<MachineTests />} path="/machine/:id" />
            </Routes>
          </CompatRouter>
        </MemoryRouter>
      </Provider>,
      { store }
    );
    expect(
      store
        .getActions()
        .some((action) => action.type === "scriptresult/getByNodeId")
    ).toBe(true);
  });

  it("fetches script results on mount if they have already been loaded", () => {
    state.nodescriptresult.items = { abc123: [] };
    state.scriptresult.items = [scriptResultFactory()];
    const store = mockStore(state);
    renderWithMockStore(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <Routes>
              <Route element={<MachineTests />} path="/machine/:id" />
            </Routes>
          </CompatRouter>
        </MemoryRouter>
      </Provider>,
      { store }
    );
    expect(
      store
        .getActions()
        .filter((action) => action.type === "scriptresult/getByNodeId").length
    ).toBe(1);
  });

  it("refetchs script results when the machine testing status changes", () => {
    // Mock the previous value to something different to the current machine.
    jest
      .spyOn(reactComponentHooks, "usePrevious")
      .mockImplementation(() => TestStatusStatus.PASSED);
    state.machine.items = [
      machineDetailsFactory({
        locked: false,
        permissions: ["edit"],
        system_id: "abc123",
        // This value is different to the value stored by usePrevious.
        testing_status: TestStatusStatus.PENDING,
      }),
    ];
    state.nodescriptresult.items = { abc123: [1] };
    // Add existing script results.
    state.scriptresult.items = [
      scriptResultFactory({
        id: 1,
        result_type: ScriptResultType.TESTING,
        hardware_type: HardwareType.CPU,
      }),
    ];
    const store = mockStore(state);
    renderWithMockStore(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <Routes>
              <Route element={<MachineTests />} path="/machine/:id" />
            </Routes>
          </CompatRouter>
        </MemoryRouter>
      </Provider>,
      { store }
    );
    expect(
      store
        .getActions()
        .filter((action) => action.type === "scriptresult/getByNodeId").length
    ).toBe(2);
  });
});
