import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import { Labels } from "../StaticRoutes";

import AddStaticRouteForm from "./AddStaticRouteForm";

import { actions as staticRouteActions } from "@/app/store/staticroute";
import {
  rootState as rootStateFactory,
  staticRouteState as staticRouteStateFactory,
  subnet as subnetFactory,
  subnetState as subnetStateFactory,
  authState as authStateFactory,
  user as userFactory,
  userState as userStateFactory,
} from "testing/factories";
import { userEvent, render, screen, waitFor, within } from "testing/utils";

const mockStore = configureStore();

it("dispatches a correct action on add static route form submit", async () => {
  const subnet = subnetFactory({ id: 1, cidr: "172.16.1.0/24" });
  const destinationSubnet = subnetFactory({ id: 2, cidr: "223.16.1.0/24" });
  const state = rootStateFactory({
    user: userStateFactory({
      auth: authStateFactory({
        user: userFactory(),
      }),
      items: [userFactory(), userFactory(), userFactory()],
    }),
    staticroute: staticRouteStateFactory({
      loaded: true,
      items: [],
    }),
    subnet: subnetStateFactory({
      loaded: true,
      items: [subnet, destinationSubnet],
    }),
  });

  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[{ pathname: "/" }]}>
        <CompatRouter>
          <AddStaticRouteForm handleDismiss={jest.fn()} subnetId={subnet.id} />
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  await waitFor(() =>
    expect(
      screen.getByRole("form", { name: "Add static route" })
    ).toBeInTheDocument()
  );

  const addStaticRouteForm = screen.getByRole("form", {
    name: "Add static route",
  });

  const gatewayIp = "11.1.1.2";
  await userEvent.type(
    within(addStaticRouteForm).getByLabelText(Labels.GatewayIp),
    gatewayIp
  );
  await userEvent.clear(
    within(addStaticRouteForm).getByLabelText(Labels.Metric)
  );
  await userEvent.type(
    within(addStaticRouteForm).getByLabelText(Labels.Metric),
    "1"
  );
  await userEvent.selectOptions(
    within(addStaticRouteForm).getByLabelText(Labels.Destination),
    `${destinationSubnet.id}`
  );
  await userEvent.click(
    within(addStaticRouteForm).getByRole("button", {
      name: "Save",
    })
  );

  const expectedActions = [
    staticRouteActions.create({
      source: subnet.id,
      gateway_ip: gatewayIp,
      destination: destinationSubnet.id,
      metric: 1,
    }),
  ];
  const actualActions = store.getActions();
  await waitFor(() =>
    expect(
      actualActions.filter(
        (action) => action.type === staticRouteActions.create.type
      )
    ).toStrictEqual(expectedActions)
  );
});
