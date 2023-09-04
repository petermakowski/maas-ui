import configureStore from "redux-mock-store";

import MachineName from "./MachineName";

import type { RootState } from "@/app/store/root/types";
import {
  domain as domainFactory,
  domainState as domainStateFactory,
  generalState as generalStateFactory,
  machineDetails as machineDetailsFactory,
  machineState as machineStateFactory,
  powerType as powerTypeFactory,
  powerTypesState as powerTypesStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { renderWithBrowserRouter, screen, userEvent } from "testing/utils";

const mockStore = configureStore<RootState>();

describe("MachineName", () => {
  let state: RootState;
  const domain = domainFactory({ id: 99 });
  beforeEach(() => {
    state = rootStateFactory({
      domain: domainStateFactory({
        items: [domain],
      }),
      general: generalStateFactory({
        powerTypes: powerTypesStateFactory({
          data: [powerTypeFactory()],
        }),
      }),
      machine: machineStateFactory({
        loaded: true,
        items: [
          machineDetailsFactory({
            domain,
            locked: false,
            permissions: ["edit"],
            system_id: "abc123",
          }),
        ],
      }),
    });
  });

  it("can update a machine with the new name and domain", async () => {
    const store = mockStore(state);
    renderWithBrowserRouter(
      <MachineName editingName={true} id="abc123" setEditingName={jest.fn()} />,
      { route: "/machine/abc123", store }
    );

    await userEvent.clear(screen.getByRole("textbox", { name: "Hostname" }));
    await userEvent.type(
      screen.getByRole("textbox", { name: "Hostname" }),
      "new-lease"
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      store.getActions().find((action) => action.type === "machine/update")
    ).toStrictEqual({
      type: "machine/update",
      payload: {
        params: {
          domain: domain,
          extra_macs: [],
          hostname: "new-lease",
          pxe_mac: "de:ad:be:ef:aa:b1",
          system_id: "abc123",
        },
      },
      meta: {
        model: "machine",
        method: "update",
      },
    });
  });
});
