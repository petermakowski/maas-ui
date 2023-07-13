import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import configureStore from "redux-mock-store";

import SubnetUsedIPs, { Labels } from "./SubnetUsedIPs";

import {
  rootState as rootStateFactory,
  subnetDetails as subnetFactory,
  subnetState as subnetStateFactory,
} from "testing/factories";
import { render, screen } from "testing/utils";

const mockStore = configureStore();

it("displays correct IP addresses", () => {
  const subnet = subnetFactory({
    ip_addresses: [
      {
        ip: "11.1.1.1",
        alloc_type: 4,
        created: "yesterday",
        updated: "today",
      },
      {
        ip: "11.1.1.2",
        alloc_type: 5,
        created: "yesterday",
        updated: "today",
      },
    ],
  });
  const state = rootStateFactory({
    subnet: subnetStateFactory({
      items: [subnet],
    }),
  });
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[{ pathname: "/" }]}>
        <SubnetUsedIPs subnetId={subnet.id} />
      </MemoryRouter>
    </Provider>
  );
  expect(
    screen.queryAllByRole("gridcell", {
      name: Labels.IpAddresses,
    })
  ).toHaveLength(2);
  expect(
    screen
      .getAllByRole("gridcell", {
        name: Labels.IpAddresses,
      })
      .find((td) => td.textContent === "11.1.1.1")
  ).toBeInTheDocument();
  expect(
    screen
      .getAllByRole("gridcell", {
        name: Labels.IpAddresses,
      })
      .find((td) => td.textContent === "11.1.1.2")
  ).toBeInTheDocument();
});

it("displays an empty message for a subnet", () => {
  const subnet = subnetFactory({
    ip_addresses: [],
  });
  const state = rootStateFactory({
    subnet: subnetStateFactory({
      items: [subnet],
    }),
  });
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[{ pathname: "/" }]}>
        <SubnetUsedIPs subnetId={subnet.id} />
      </MemoryRouter>
    </Provider>
  );
  expect(
    screen.getByText("No IP addresses for this subnet.")
  ).toBeInTheDocument();
});
