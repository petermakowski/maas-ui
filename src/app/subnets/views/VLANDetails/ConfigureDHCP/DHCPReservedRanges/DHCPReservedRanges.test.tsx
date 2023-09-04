import { Formik } from "formik";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import type { ConfigureDHCPValues } from "../ConfigureDHCP";
import { DHCPType } from "../ConfigureDHCP";

import DHCPReservedRanges, { Headers } from "./DHCPReservedRanges";

import urls from "@/app/base/urls";
import {
  ipRange as ipRangeFactory,
  ipRangeState as ipRangeStateFactory,
  rootState as rootStateFactory,
  subnet as subnetFactory,
  subnetState as subnetStateFactory,
  subnetStatistics as subnetStatisticsFactory,
  subnetStatisticsRange as subnetStatisticsRangeFactory,
  vlan as vlanFactory,
  vlanState as vlanStateFactory,
} from "testing/factories";
import { userEvent, render, screen, waitFor, within } from "testing/utils";

const mockStore = configureStore();
let initialValues: ConfigureDHCPValues;

beforeEach(() => {
  initialValues = {
    dhcpType: DHCPType.CONTROLLERS,
    enableDHCP: true,
    endIP: "",
    gatewayIP: "",
    primaryRack: "",
    relayVLAN: "",
    secondaryRack: "",
    startIP: "",
    subnet: "",
  };
});

it("does not render if DHCP is selected to be disabled", () => {
  initialValues.enableDHCP = false;
  const state = rootStateFactory();
  const store = mockStore(state);
  const { container } = render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik initialValues={initialValues} onSubmit={jest.fn()}>
            <DHCPReservedRanges id={1} />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  expect(container).toBeEmptyDOMElement();
});

it("renders a table of IP ranges if the VLAN has any defined", () => {
  const vlan = vlanFactory();
  const subnet = subnetFactory({ gateway_ip: "192.168.1.11", vlan: vlan.id });
  const ipRange = ipRangeFactory({
    start_ip: "192.168.1.1",
    end_ip: "192.168.1.10",
    subnet: subnet.id,
    vlan: vlan.id,
  });
  const state = rootStateFactory({
    iprange: ipRangeStateFactory({ items: [ipRange] }),
    subnet: subnetStateFactory({ items: [subnet] }),
    vlan: vlanStateFactory({ items: [vlan] }),
  });
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik initialValues={initialValues} onSubmit={jest.fn()}>
            <DHCPReservedRanges id={vlan.id} />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  expect(
    within(screen.getByRole("gridcell", { name: Headers.Subnet })).getByRole(
      "link"
    )
  ).toHaveAttribute("href", urls.subnets.subnet.index({ id: subnet.id }));
  expect(
    screen.getByRole("gridcell", { name: Headers.StartIP }).textContent
  ).toBe(ipRange.start_ip);
  expect(
    screen.getByRole("gridcell", { name: Headers.EndIP }).textContent
  ).toBe(ipRange.end_ip);
  expect(
    screen.getByRole("gridcell", { name: Headers.GatewayIP }).textContent
  ).toBe(subnet.gateway_ip);
});

it(`renders only a subnet select field if no IP ranges exist and no subnet is
    selected`, () => {
  const vlan = vlanFactory();
  const subnet = subnetFactory({ gateway_ip: "192.168.1.11", vlan: vlan.id });
  const state = rootStateFactory({
    iprange: ipRangeStateFactory({ items: [] }),
    subnet: subnetStateFactory({ items: [subnet], loaded: true }),
    vlan: vlanStateFactory({ items: [vlan] }),
  });
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik initialValues={initialValues} onSubmit={jest.fn()}>
            <DHCPReservedRanges id={vlan.id} />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  expect(
    within(screen.getByRole("gridcell", { name: Headers.Subnet })).getByRole(
      "combobox",
      { name: "Subnet" }
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole("gridcell", { name: Headers.StartIP })
  ).toBeEmptyDOMElement();
  expect(
    screen.getByRole("gridcell", { name: Headers.EndIP })
  ).toBeEmptyDOMElement();
  expect(
    screen.getByRole("gridcell", { name: Headers.GatewayIP })
  ).toBeEmptyDOMElement();
});

it(`renders a subnet select field and prepopulated fields for a reserved range
    if no IP ranges exist and a subnet is selected`, async () => {
  const vlan = vlanFactory();
  const subnet = subnetFactory({
    gateway_ip: "192.168.1.11",
    statistics: subnetStatisticsFactory({
      suggested_dynamic_range: subnetStatisticsRangeFactory({
        start: "192.168.1.1",
        end: "192.168.1.5",
      }),
    }),
    vlan: vlan.id,
  });
  const state = rootStateFactory({
    iprange: ipRangeStateFactory({ items: [] }),
    subnet: subnetStateFactory({ items: [subnet], loaded: true }),
    vlan: vlanStateFactory({ items: [vlan] }),
  });
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik initialValues={initialValues} onSubmit={jest.fn()}>
            <DHCPReservedRanges id={vlan.id} />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Subnet" }),
    subnet.id.toString()
  );

  await waitFor(() =>
    expect(
      within(screen.getByRole("gridcell", { name: Headers.Subnet })).getByRole(
        "combobox",
        { name: "Subnet" }
      )
    ).toBeInTheDocument()
  );
  expect(
    within(screen.getByRole("gridcell", { name: Headers.StartIP })).getByRole(
      "textbox",
      { name: Headers.StartIP }
    )
  ).toHaveAttribute("value", subnet.statistics.suggested_dynamic_range.start);
  expect(
    within(screen.getByRole("gridcell", { name: Headers.EndIP })).getByRole(
      "textbox",
      { name: Headers.EndIP }
    )
  ).toHaveAttribute("value", subnet.statistics.suggested_dynamic_range.end);
  expect(
    within(screen.getByRole("gridcell", { name: Headers.GatewayIP })).getByRole(
      "textbox",
      { name: Headers.GatewayIP }
    )
  ).toHaveAttribute("value", subnet.gateway_ip);
});
