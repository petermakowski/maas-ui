import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import { Labels } from "./DhcpFormFields";

import DhcpForm from "app/base/components/DhcpForm";
import { getIpRangeDisplayName } from "app/store/iprange/utils";
import { generateCallId } from "app/store/machine/utils/query";
import type { RootState } from "app/store/root/types";
import {
  ipRange as ipRangeFactory,
  ipRangeState as ipRangeStateFactory,
  controllerState as controllerStateFactory,
  deviceState as deviceStateFactory,
  dhcpSnippet as dhcpSnippetFactory,
  dhcpSnippetState as dhcpSnippetStateFactory,
  machine as machineFactory,
  machineState as machineStateFactory,
  machineStateList as machineStateListFactory,
  machineStateListGroup as machineStateListGroupFactory,
  subnet as subnetFactory,
  subnetState as subnetStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { userEvent, render, screen, waitFor, within } from "testing/utils";

const mockStore = configureStore();
const machine = machineFactory();
const machines = [machine];
const ipRange = ipRangeFactory();

describe("DhcpFormFields", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory({
      controller: controllerStateFactory({ loaded: true }),
      device: deviceStateFactory({ loaded: true }),
      dhcpsnippet: dhcpSnippetStateFactory({
        items: [
          dhcpSnippetFactory({
            created: "Thu, 15 Aug. 2019 06:21:39",
            id: 1,
            name: "lease",
            updated: "Thu, 15 Aug. 2019 06:21:39",
            value: "lease 10",
          }),
          dhcpSnippetFactory({
            created: "Thu, 15 Aug. 2019 06:21:39",
            id: 2,
            name: "class",
            updated: "Thu, 15 Aug. 2019 06:21:39",
          }),
        ],
        loaded: true,
      }),
      machine: machineStateFactory({
        items: machines,
        lists: {
          [generateCallId()]: machineStateListFactory({
            loading: false,
            loaded: true,
            groups: [
              machineStateListGroupFactory({
                items: [machines[0].system_id],
                name: "Deployed",
              }),
            ],
          }),
        },
        loaded: true,
      }),
      subnet: subnetStateFactory({
        items: [
          subnetFactory({
            id: 1,
            name: "test.local",
          }),
        ],
        loaded: true,
      }),
      iprange: ipRangeStateFactory({
        items: [ipRange],
        loaded: true,
      }),
    });
  });

  it("shows a notification if editing and disabled", () => {
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[{ pathname: "/", key: "testKey" }]}>
          <CompatRouter>
            <DhcpForm
              analyticsCategory="settings"
              id={state.dhcpsnippet.items[0].id}
            />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(Labels.Disabled)).toBeInTheDocument();
  });

  it("shows a loader if the models have not loaded", async () => {
    state.subnet.loading = true;
    state.device.loading = true;
    state.controller.loading = true;
    state.machine.loading = true;
    state.subnet.loaded = false;
    state.device.loaded = false;
    state.controller.loaded = false;
    state.machine.loaded = false;
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[{ pathname: "/", key: "testKey" }]}>
          <CompatRouter>
            <DhcpForm analyticsCategory="settings" />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );
    const select = screen.getByRole("combobox", { name: Labels.Type });

    await userEvent.selectOptions(select, "subnet");

    expect(
      screen.getByRole("alert", { name: Labels.LoadingData })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: Labels.AppliesTo })
    ).not.toBeInTheDocument();
  });

  it("shows the entity options for a chosen type", async () => {
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[{ pathname: "/", key: "testKey" }]}>
          <CompatRouter>
            <DhcpForm analyticsCategory="settings" />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );
    const select = screen.getByRole("combobox", { name: Labels.Type });

    await userEvent.selectOptions(select, "subnet");

    expect(
      screen.queryByRole("alert", { name: Labels.LoadingData })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: Labels.AppliesTo })
    ).toBeInTheDocument();
  });

  it("allows to select an IP Range", async () => {
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[{ pathname: "/", key: "testKey" }]}>
          <CompatRouter>
            <DhcpForm analyticsCategory="settings" />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );
    const select = screen.getByRole("combobox", { name: Labels.Type });

    await userEvent.selectOptions(select, "iprange");

    expect(
      screen.queryByRole("alert", { name: Labels.LoadingData })
    ).not.toBeInTheDocument();
    await userEvent.selectOptions(
      screen.getByRole("combobox", {
        name: Labels.AppliesTo,
      }),
      getIpRangeDisplayName(ipRange)
    );
  });

  // TODO: fix this test
  it.skip("resets the entity if the type changes", async () => {
    const machine = state.machine.items[0];
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[{ pathname: "/", key: "testKey" }]}>
          <CompatRouter>
            <DhcpForm analyticsCategory="settings" />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );
    // Set an initial type.
    const typeSelect = screen.getByRole("combobox", { name: Labels.Type });
    await userEvent.selectOptions(typeSelect, "subnet");
    await userEvent.selectOptions(
      screen.getByRole("combobox", {
        name: Labels.AppliesTo,
      }),
      "test.local"
    );
    // Select a machine. Value should get set.
    await userEvent.selectOptions(typeSelect, "machine");
    await userEvent.click(
      screen.getByRole("button", { name: /Choose machine/ })
    );

    await waitFor(() => {
      expect(
        screen.queryByText(/No machines match the search criteria./)
      ).not.toBeInTheDocument();
    });
    await waitFor(() =>
      expect(screen.getByRole("grid")).toHaveAttribute("aria-busy", "false")
    );
    await userEvent.click(
      within(screen.getByRole("grid")).getByText(machine.hostname)
    );
    expect(
      screen.getByRole("button", { name: new RegExp(machine.hostname, "i") })
    ).toHaveAccessibleDescription(Labels.AppliesTo);
    // Change the type. The select value should be cleared.
    await userEvent.selectOptions(typeSelect, "subnet");
    expect(
      screen.getByRole("combobox", {
        name: Labels.AppliesTo,
      })
    ).toHaveValue("");
  });
});
