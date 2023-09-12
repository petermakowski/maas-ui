import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import DeviceConfiguration, { Label } from "./DeviceConfiguration";

import { Labels as EditableSectionLabels } from "@/app/base/components/EditableSection";
import { Label as DeviceConfigurationFieldsLabel } from "@/app/base/components/NodeConfigurationFields/NodeConfigurationFields";
import { Label as TagFieldLabel } from "@/app/base/components/TagField/TagField";
import { Label as ZoneSelectLabel } from "@/app/base/components/ZoneSelect/ZoneSelect";
import { actions as deviceActions } from "@/app/store/device";
import type { RootState } from "@/app/store/root/types";
import {
  deviceDetails as deviceDetailsFactory,
  deviceState as deviceStateFactory,
  rootState as rootStateFactory,
  tag as tagFactory,
  tagState as tagStateFactory,
  zone as zoneFactory,
  zoneGenericActions as zoneGenericActionsFactory,
  zoneState as zoneStateFactory,
} from "testing/factories";
import { render, screen, userEvent, waitFor } from "testing/utils";

const mockStore = configureStore();

describe("DeviceConfiguration", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory({
      device: deviceStateFactory({
        items: [deviceDetailsFactory({ system_id: "abc123" })],
        loaded: true,
      }),
      tag: tagStateFactory({
        items: [
          tagFactory({ id: 1, name: "tag1" }),
          tagFactory({ id: 2, name: "tag2" }),
        ],
      }),
      zone: zoneStateFactory({
        genericActions: zoneGenericActionsFactory({ fetch: "success" }),
        items: [zoneFactory({ name: "twilight" })],
      }),
    });
  });

  it("displays a spinner if the device has not loaded yet", () => {
    state.device.items = [];
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter>
          <CompatRouter>
            <DeviceConfiguration systemId="abc123" />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByTestId("loading-device")).toBeInTheDocument();
  });

  it("shows the device details by default", () => {
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter>
          <CompatRouter>
            <DeviceConfiguration systemId="abc123" />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByTestId("device-details")).toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: Label.Form })
    ).not.toBeInTheDocument();
  });

  it("can switch to showing the device configuration form", async () => {
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter>
          <CompatRouter>
            <DeviceConfiguration systemId="abc123" />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    await userEvent.click(
      screen.getAllByRole("button", {
        name: EditableSectionLabels.EditButton,
      })[0]
    );

    expect(screen.queryByTestId("device-details")).not.toBeInTheDocument();
    expect(screen.getByRole("form", { name: Label.Form })).toBeInTheDocument();
  });

  it("correctly dispatches an action to update a device", async () => {
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter>
          <CompatRouter>
            <DeviceConfiguration systemId="abc123" />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );
    await userEvent.click(
      screen.getAllByRole("button", {
        name: EditableSectionLabels.EditButton,
      })[0]
    );
    const deviceNote = screen.getByRole("textbox", {
      name: DeviceConfigurationFieldsLabel.Note,
    });
    await userEvent.clear(deviceNote);
    await userEvent.type(deviceNote, "it's a device");
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: ZoneSelectLabel.Zone }),
      "twilight"
    );
    // Open the tag selector dropdown.
    await userEvent.click(
      screen.getByRole("textbox", { name: TagFieldLabel.Input })
    );
    await userEvent.click(screen.getByRole("option", { name: "tag1" }));
    await userEvent.click(screen.getByRole("option", { name: "tag2" }));
    await userEvent.click(screen.getByRole("button", { name: Label.Submit }));
    const expectedAction = deviceActions.update({
      description: "it's a device",
      tags: [1, 2],
      system_id: "abc123",
      zone: { name: "twilight" },
    });
    const actualActions = store.getActions();
    await waitFor(() =>
      expect(
        actualActions.find((action) => action.type === expectedAction.type)
      ).toStrictEqual(expectedAction)
    );
  });
});
