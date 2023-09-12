import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import VLANSummary from "./VLANSummary";

import urls from "@/app/base/urls";
import type { Controller } from "@/app/store/controller/types";
import type { Fabric } from "@/app/store/fabric/types";
import type { RootState } from "@/app/store/root/types";
import type { Space } from "@/app/store/space/types";
import type { VLAN } from "@/app/store/vlan/types";
import {
  authState as authStateFactory,
  controller as controllerFactory,
  controllerState as controllerStateFactory,
  fabric as fabricFactory,
  fabricState as fabricStateFactory,
  modelRef as modelRefFactory,
  rootState as rootStateFactory,
  space as spaceFactory,
  spaceState as spaceStateFactory,
  user as userFactory,
  userState as userStateFactory,
  vlan as vlanFactory,
  vlanState as vlanStateFactory,
} from "testing/factories";
import { render, screen, userEvent, within } from "testing/utils";

const mockStore = configureStore();

let controller: Controller;
let fabric: Fabric;
let space: Space;
let state: RootState;
let vlan: VLAN;

beforeEach(() => {
  fabric = fabricFactory({ id: 1, name: "fabric-1" });
  space = spaceFactory({ id: 22, name: "outer" });
  controller = controllerFactory({
    domain: modelRefFactory({ name: "domain" }),
    hostname: "controller-abc",
    system_id: "abc123",
  });
  vlan = vlanFactory({
    description: "I'm a little VLAN",
    fabric: fabric.id,
    mtu: 5432,
    name: "vlan-333",
    primary_rack: controller.system_id,
    space: space.id,
    vid: 1010,
  });
  state = rootStateFactory({
    controller: controllerStateFactory({ items: [controller] }),
    fabric: fabricStateFactory({ items: [fabric] }),
    space: spaceStateFactory({ items: [space] }),
    user: userStateFactory({
      auth: authStateFactory({ user: userFactory({ is_superuser: true }) }),
    }),
    vlan: vlanStateFactory({ items: [vlan] }),
  });
});

it("renders correct details", () => {
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <VLANSummary id={vlan.id} />
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  const vlanSummary = screen.getByRole("region", { name: "VLAN summary" });
  expect(
    within(vlanSummary).getByRole("link", { name: space.name })
  ).toHaveAttribute("href", urls.subnets.space.index({ id: space.id }));
  expect(
    within(vlanSummary).getByRole("link", { name: fabric.name })
  ).toHaveAttribute("href", urls.subnets.fabric.index({ id: fabric.id }));
  expect(
    within(vlanSummary).getByRole("link", { name: /controller-abc/i })
  ).toHaveAttribute(
    "href",
    urls.controllers.controller.index({ id: controller.system_id })
  );
});

it("can display the edit form", async () => {
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <VLANSummary id={vlan.id} />
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  const formName = "Edit VLAN";
  const button = screen.getByRole("button", { name: "Edit" });
  expect(button).toBeInTheDocument();
  expect(
    screen.queryByRole("form", { name: formName })
  ).not.toBeInTheDocument();
  await userEvent.click(button);
  expect(
    screen.queryByRole("button", { name: "Edit" })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("form", { name: formName })).toBeInTheDocument();
});
