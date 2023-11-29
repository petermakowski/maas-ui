import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter, Route, Routes } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import SubnetDetails from "./SubnetDetails";

import urls from "app/base/urls";
import { actions as staticRouteActions } from "app/store/staticroute";
import { actions as subnetActions } from "app/store/subnet";
import {
  subnetState as subnetStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { render, screen } from "testing/utils";

const mockStore = configureStore();

it("dispatches actions to fetch necessary data and set subnet as active on mount", () => {
  const state = rootStateFactory();
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[{ pathname: urls.subnets.subnet.index({ id: 1 }) }]}
      >
        <CompatRouter>
          <Routes>
            <Route
              element={<SubnetDetails />}
              path={urls.subnets.subnet.index(null)}
            />
          </Routes>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  const expectedActions = [
    subnetActions.get(1),
    subnetActions.setActive(1),
    staticRouteActions.fetch(),
  ];
  const actualActions = store.getActions();
  expectedActions.forEach((expectedAction) => {
    expect(
      actualActions.find(
        (actualAction) => actualAction.type === expectedAction.type
      )
    ).toStrictEqual(expectedAction);
  });
});

it("dispatches actions to unset active subnet and clean up on unmount", () => {
  const state = rootStateFactory();
  const store = mockStore(state);
  const { unmount } = render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[{ pathname: urls.subnets.subnet.index({ id: 1 }) }]}
      >
        <CompatRouter>
          <Routes>
            <Route
              element={<SubnetDetails />}
              path={urls.subnets.subnet.index(null)}
            />
          </Routes>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  unmount();

  const expectedActions = [
    subnetActions.setActive(null),
    subnetActions.cleanup(),
  ];
  const actualActions = store.getActions();
  expectedActions.forEach((expectedAction) => {
    expect(
      actualActions.find(
        (actualAction) =>
          actualAction.type === expectedAction.type &&
          // Check payload to differentiate "set" and "unset" active actions
          actualAction.payload?.params === expectedAction.payload?.params
      )
    ).toStrictEqual(expectedAction);
  });
});

it("displays a message if the subnet does not exist", () => {
  const state = rootStateFactory({
    subnet: subnetStateFactory({
      items: [],
      loading: false,
    }),
  });
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[{ pathname: urls.subnets.subnet.index({ id: 1 }) }]}
      >
        <CompatRouter>
          <Routes>
            <Route
              element={<SubnetDetails />}
              path={urls.subnets.subnet.index(null)}
            />
          </Routes>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  expect(screen.getByText("Subnet not found")).toBeInTheDocument();
});

it("shows a spinner if the subnet has not loaded yet", () => {
  const state = rootStateFactory({
    subnet: subnetStateFactory({
      items: [],
      loading: true,
    }),
  });
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[{ pathname: urls.subnets.subnet.index({ id: 1 }) }]}
      >
        <CompatRouter>
          <Routes>
            <Route
              element={<SubnetDetails />}
              path={urls.subnets.subnet.index(null)}
            />
          </Routes>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  expect(
    screen.getByTestId("main-toolbar-heading-spinner")
  ).toBeInTheDocument();
});
