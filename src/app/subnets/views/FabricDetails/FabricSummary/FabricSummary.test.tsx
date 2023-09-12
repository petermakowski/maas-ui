import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import FabricSummary from "./FabricSummary";

import {
  controller as controllerFactory,
  controllerState as controllerStateFactory,
  fabric as fabricFactory,
  fabricState as fabricStateFactory,
  modelRef as modelRefFactory,
  rootState as rootStateFactory,
  vlan as vlanFactory,
  vlanState as vlanStateFactory,
} from "testing/factories";
import { render, screen, userEvent, waitFor, within } from "testing/utils";

const mockStore = configureStore();

it("renders correct details", () => {
  const controller = controllerFactory({
    hostname: "bolla",
    system_id: "1234",
    domain: modelRefFactory({ name: "maas" }),
  });
  const state = rootStateFactory({
    vlan: vlanStateFactory({
      loaded: true,
      items: [vlanFactory({ fabric: 2, rack_sids: ["system-id"] })],
    }),
    controller: controllerStateFactory({
      loaded: true,
      items: [controller],
    }),
  });
  const store = mockStore(state);
  const fabric = fabricFactory({ id: 1, name: "test-fabric" });

  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <FabricSummary fabric={fabric} />
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  expect(
    screen.getByRole("heading", { name: "Fabric summary" })
  ).toBeInTheDocument();
  expect(screen.getByText("test-fabric")).toBeInTheDocument();
});

it("can open and close the Edit fabric summary form", async () => {
  const fabric = fabricFactory({
    name: "fabric-1",
    description: "fabric-1 description",
  });
  const state = rootStateFactory({
    fabric: fabricStateFactory({
      items: [fabric],
      loading: false,
    }),
  });
  const store = configureStore()(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <FabricSummary fabric={fabric} />
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  const fabricSummary = screen.getByRole("region", { name: "Fabric summary" });
  await userEvent.click(
    within(fabricSummary).getAllByRole("button", { name: "Edit" })[0]
  );
  await waitFor(() =>
    expect(
      screen.getByRole("form", { name: "Edit fabric summary" })
    ).toBeInTheDocument()
  );

  await userEvent.click(
    within(fabricSummary).getByRole("button", { name: "Cancel" })
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("form", { name: "Edit fabric summary" })
    ).not.toBeInTheDocument()
  );
});
