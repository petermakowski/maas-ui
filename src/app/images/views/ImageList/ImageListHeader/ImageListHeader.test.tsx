import configureStore from "redux-mock-store";

import ImageListHeader, {
  Labels as ImageListHeaderLabels,
} from "./ImageListHeader";

import { actions as configActions } from "@/app/store/config";
import { ConfigNames } from "@/app/store/config/types";
import type { RootState } from "@/app/store/root/types";
import {
  bootResourceState as bootResourceStateFactory,
  bootResourceStatuses as bootResourceStatusesFactory,
  config as configFactory,
  configState as configStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { renderWithBrowserRouter, screen, userEvent } from "testing/utils";

const mockStore = configureStore<RootState, {}>();

describe("ImageListHeader", () => {
  it("sets the subtitle loading state when polling", () => {
    const state = rootStateFactory({
      bootresource: bootResourceStateFactory({
        statuses: bootResourceStatusesFactory({
          polling: true,
        }),
      }),
    });
    renderWithBrowserRouter(<ImageListHeader />, {
      route: "/images",
      state,
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("does not show sync toggle if config has not loaded yet", () => {
    const state = rootStateFactory({
      bootresource: bootResourceStateFactory({
        statuses: bootResourceStatusesFactory({
          polling: true,
        }),
      }),
      config: configStateFactory({
        loaded: false,
      }),
    });
    renderWithBrowserRouter(<ImageListHeader />, {
      route: "/images",
      state,
    });

    expect(
      screen.queryByRole("checkbox", {
        name: new RegExp(ImageListHeaderLabels.AutoSyncImages),
      })
    ).not.toBeInTheDocument();
  });

  it("dispatches an action to update config when changing the auto sync switch", async () => {
    const state = rootStateFactory({
      config: configStateFactory({
        items: [
          configFactory({
            name: ConfigNames.BOOT_IMAGES_AUTO_IMPORT,
            value: true,
          }),
        ],
        loaded: true,
      }),
    });
    const store = mockStore(state);
    renderWithBrowserRouter(<ImageListHeader />, { route: "/images", store });

    await userEvent.click(
      screen.getByRole("checkbox", {
        name: new RegExp(ImageListHeaderLabels.AutoSyncImages),
      })
    );

    const actualActions = store.getActions();
    const expectedAction = configActions.update({
      boot_images_auto_import: false,
    });
    expect(
      actualActions.find(
        (actualAction) => actualAction.type === expectedAction.type
      )
    ).toStrictEqual(expectedAction);
  });

  it("can show the rack import status", () => {
    const state = rootStateFactory({
      bootresource: bootResourceStateFactory({
        rackImportRunning: true,
      }),
    });
    renderWithBrowserRouter(<ImageListHeader />, {
      route: "/images",
      state,
    });

    expect(
      screen.getByText(ImageListHeaderLabels.RackControllersImporting)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(ImageListHeaderLabels.RegionControllerImporting)
    ).not.toBeInTheDocument();
  });

  it("can show the region import status", () => {
    const state = rootStateFactory({
      bootresource: bootResourceStateFactory({
        regionImportRunning: true,
      }),
    });
    renderWithBrowserRouter(<ImageListHeader />, {
      route: "/images",
      state,
    });

    expect(
      screen.getByText(ImageListHeaderLabels.RegionControllerImporting)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(ImageListHeaderLabels.RackControllersImporting)
    ).not.toBeInTheDocument();
  });
});
