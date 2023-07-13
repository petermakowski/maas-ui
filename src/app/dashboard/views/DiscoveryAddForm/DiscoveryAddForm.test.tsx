import configureStore from "redux-mock-store";

import DiscoveryAddForm, {
  Labels as DiscoveryAddFormLabels,
} from "./DiscoveryAddForm";
import { Labels as FormFieldLabels } from "./DiscoveryAddFormFields/DiscoveryAddFormFields";
import { DeviceType } from "./types";

import { actions as deviceActions } from "app/store/device";
import { DeviceIpAssignment, DeviceMeta } from "app/store/device/types";
import type { Discovery } from "app/store/discovery/types";
import type { RootState } from "app/store/root/types";
import {
  NodeStatus,
  NodeStatusCode,
  TestStatusStatus,
} from "app/store/types/node";
import { callId, enableCallIdMocks } from "testing/callId-mock";
import {
  discovery as discoveryFactory,
  domain as domainFactory,
  device as deviceFactory,
  machine as machineFactory,
  testStatus as testStatusFactory,
  modelRef as modelRefFactory,
  discoveryState as discoveryStateFactory,
  deviceState as deviceStateFactory,
  domainState as domainStateFactory,
  machineState as machineStateFactory,
  subnetState as subnetStateFactory,
  vlanState as vlanStateFactory,
  rootState as rootStateFactory,
  machineStateList as machineStateListFactory,
  machineStateListGroup as machineStateListGroupFactory,
} from "testing/factories";
import { mockFormikFormSaved } from "testing/mockFormikFormSaved";
import {
  userEvent,
  screen,
  waitFor,
  within,
  renderWithBrowserRouter,
} from "testing/utils";
const mockStore = configureStore<RootState, {}>();

enableCallIdMocks();

describe("DiscoveryAddForm", () => {
  let state: RootState;
  let discovery: Discovery;

  beforeEach(() => {
    const machines = [
      machineFactory({
        actions: [],
        architecture: "amd64/generic",
        cpu_count: 4,
        cpu_test_status: testStatusFactory({
          status: TestStatusStatus.RUNNING,
        }),
        distro_series: "bionic",
        domain: modelRefFactory({
          name: "example",
        }),
        extra_macs: [],
        fqdn: "koala.example",
        hostname: "koala",
        ip_addresses: [],
        memory: 8,
        memory_test_status: testStatusFactory({
          status: TestStatusStatus.PASSED,
        }),
        network_test_status: testStatusFactory({
          status: TestStatusStatus.PASSED,
        }),
        osystem: "ubuntu",
        owner: "admin",
        permissions: ["edit", "delete"],
        physical_disk_count: 1,
        pool: modelRefFactory(),
        pxe_mac: "00:11:22:33:44:55",
        spaces: [],
        status: NodeStatus.DEPLOYED,
        status_code: NodeStatusCode.DEPLOYED,
        status_message: "",
        storage: 8,
        storage_test_status: testStatusFactory({
          status: TestStatusStatus.PASSED,
        }),
        testing_status: TestStatusStatus.PASSED,
        system_id: "abc123",
        zone: modelRefFactory(),
      }),
    ];
    discovery = discoveryFactory({
      ip: "1.2.3.4",
      mac_address: "aa:bb:cc",
      subnet: 9,
      vlan: 8,
    });
    state = rootStateFactory({
      device: deviceStateFactory({
        loaded: true,
        items: [deviceFactory({ system_id: "abc123", fqdn: "abc123.example" })],
      }),
      discovery: discoveryStateFactory({
        loaded: true,
        items: [discovery],
      }),
      domain: domainStateFactory({
        loaded: true,
        items: [domainFactory({ name: "local" })],
      }),
      machine: machineStateFactory({
        loaded: true,
        items: machines,
        lists: {
          [callId]: machineStateListFactory({
            loaded: true,
            groups: [
              machineStateListGroupFactory({
                items: [machines[0].system_id],
                name: "Deployed",
              }),
            ],
          }),
        },
      }),
      subnet: subnetStateFactory({ loaded: true }),
      vlan: vlanStateFactory({ loaded: true }),
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("fetches the necessary data on load", () => {
    const store = mockStore(state);
    renderWithBrowserRouter(
      <DiscoveryAddForm discovery={discovery} onClose={jest.fn()} />,
      { route: "/dashboard", store }
    );
    const expectedActions = [
      "device/fetch",
      "domain/fetch",
      "machine/fetch",
      "subnet/fetch",
      "vlan/fetch",
    ];
    expectedActions.forEach((expectedAction) => {
      expect(
        store.getActions().some((action) => action.type === expectedAction)
      );
    });
  });

  it("displays a spinner when data is loading", () => {
    state.device.loaded = false;
    state.domain.loaded = false;
    state.machine.loaded = false;
    state.subnet.loaded = false;
    state.vlan.loaded = false;
    const store = mockStore(state);
    renderWithBrowserRouter(
      <DiscoveryAddForm discovery={discovery} onClose={jest.fn()} />,
      { route: "/dashboard", store }
    );
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("maps name errors to hostname", async () => {
    // Render the form with default state.
    const { rerender } = renderWithBrowserRouter(
      <DiscoveryAddForm discovery={discovery} onClose={jest.fn()} />,
      { route: "/dashboard", state }
    );
    const error = "Name is invalid";
    // Change the device state to included the errors (as if it has changed via an API response).
    state.device.errors = { name: error };
    // Rerender the form to simulate the state change.
    rerender(<DiscoveryAddForm discovery={discovery} onClose={jest.fn()} />);
    expect(
      screen.getByRole("textbox", {
        name: `${FormFieldLabels.Hostname}`,
      })
      // react-components uses aria-errormessage to link the errors to the inputs so we can use the toHaveErrorMessage helper here.
    ).toHaveErrorMessage(`Error: ${error}`);
  });

  it("can dispatch to create a device", async () => {
    const store = mockStore(state);
    renderWithBrowserRouter(
      <DiscoveryAddForm discovery={discovery} onClose={jest.fn()} />,
      { route: "/dashboard", store }
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: FormFieldLabels.Domain }),
      "local"
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: "Select parent (optional) - open list",
      })
    );
    await userEvent.click(
      within(screen.getByRole("listbox")).getByText("abc123")
    );

    await userEvent.clear(
      screen.getByRole("textbox", {
        name: `${FormFieldLabels.Hostname}`,
      })
    );

    await userEvent.type(
      screen.getByRole("textbox", {
        name: `${FormFieldLabels.Hostname}`,
      }),
      "koala"
    );

    await userEvent.click(
      screen.getByRole("button", { name: DiscoveryAddFormLabels.SubmitLabel })
    );

    expect(
      store.getActions().find((action) => action.type === "device/create")
    ).toStrictEqual(
      deviceActions.create({
        domain: { name: "local" },
        extra_macs: [],
        hostname: "koala",
        interfaces: [
          {
            ip_address: "1.2.3.4",
            ip_assignment: DeviceIpAssignment.DYNAMIC,
            mac: "aa:bb:cc",
            subnet: 9,
          },
        ],
        parent: "abc123",
        primary_mac: "aa:bb:cc",
      })
    );
  });

  it("can dispatch to create a device interface", async () => {
    const store = mockStore(state);
    renderWithBrowserRouter(
      <DiscoveryAddForm discovery={discovery} onClose={jest.fn()} />,
      { route: "/dashboard", store }
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: FormFieldLabels.Type }),
      DeviceType.INTERFACE
    );

    await userEvent.clear(
      screen.getByRole("textbox", {
        name: `${FormFieldLabels.InterfaceName}`,
      })
    );

    await userEvent.type(
      screen.getByRole("textbox", {
        name: `${FormFieldLabels.InterfaceName}`,
      }),
      "koala"
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "IP assignment" }),
      DeviceIpAssignment.DYNAMIC
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: FormFieldLabels.DeviceName }),
      "abc123"
    );

    await userEvent.click(
      screen.getByRole("button", { name: DiscoveryAddFormLabels.SubmitLabel })
    );

    await waitFor(() =>
      expect(
        store
          .getActions()
          .find((action) => action.type === "device/createInterface")
      ).toStrictEqual(
        deviceActions.createInterface({
          [DeviceMeta.PK]: "abc123",
          ip_address: "1.2.3.4",
          ip_assignment: DeviceIpAssignment.DYNAMIC,
          mac_address: "aa:bb:cc",
          name: "koala",
          subnet: "9",
          vlan: 8,
        })
      )
    );
  });

  it("displays a success message when a hostname is provided", async () => {
    mockFormikFormSaved();
    const store = mockStore(state);
    renderWithBrowserRouter(
      <DiscoveryAddForm discovery={discovery} onClose={jest.fn()} />,
      { route: "/dashboard", store }
    );

    await userEvent.click(
      screen.getByRole("button", { name: DiscoveryAddFormLabels.SubmitLabel })
    );

    expect(
      store.getActions().find((action) => action.type === "message/add").payload
        .message
    ).toBe("discovery-hostname has been added.");
  });

  it("displays a success message for a device with no hostname", async () => {
    state.discovery.items[0].hostname = "";
    mockFormikFormSaved();
    const store = mockStore(state);
    renderWithBrowserRouter(
      <DiscoveryAddForm discovery={discovery} onClose={jest.fn()} />,
      { route: "/dashboard", store }
    );

    await userEvent.clear(
      screen.getByRole("textbox", {
        name: `${FormFieldLabels.Hostname}`,
      })
    );

    await userEvent.click(
      screen.getByRole("button", { name: DiscoveryAddFormLabels.SubmitLabel })
    );

    expect(
      store.getActions().find((action) => action.type === "message/add").payload
        .message
    ).toBe("A device has been added.");
  });

  it("displays a success message for an interface with no hostname", async () => {
    state.discovery.items[0].hostname = "";
    const store = mockStore(state);
    const { rerender } = renderWithBrowserRouter(
      <DiscoveryAddForm discovery={discovery} onClose={jest.fn()} />,
      { route: "/dashboard", store }
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: FormFieldLabels.Type }),
      DeviceType.INTERFACE
    );

    mockFormikFormSaved();
    rerender(<DiscoveryAddForm discovery={discovery} onClose={jest.fn()} />);

    await userEvent.click(
      screen.getByRole("button", { name: DiscoveryAddFormLabels.SubmitLabel })
    );

    expect(
      store.getActions().find((action) => action.type === "message/add").payload
        .message
    ).toBe("An interface has been added.");
  });
});
