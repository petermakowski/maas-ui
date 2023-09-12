import configureStore from "redux-mock-store";

import MarkBrokenForm from "./MarkBrokenForm";

import type { RootState } from "@/app/store/root/types";
import { NodeActions } from "@/app/store/types/node";
import {
  machine as machineFactory,
  machineState as machineStateFactory,
  machineStatus as machineStatusFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { renderWithBrowserRouter, screen, userEvent } from "testing/utils";

const mockStore = configureStore<RootState>();

describe("MarkBrokenForm", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory({
      machine: machineStateFactory({
        items: [
          machineFactory({ system_id: "abc123" }),
          machineFactory({ system_id: "def456" }),
        ],
        statuses: {
          abc123: machineStatusFactory({ markingBroken: false }),
          def456: machineStatusFactory({ markingBroken: false }),
        },
      }),
    });
  });

  it("dispatches actions to mark given machines broken", async () => {
    const store = mockStore(state);
    renderWithBrowserRouter(
      <MarkBrokenForm
        clearSidePanelContent={jest.fn()}
        machines={state.machine.items}
        processingCount={0}
        viewingDetails={false}
      />,
      { route: "/machines", store }
    );

    const commentInput = screen.getByLabelText(
      "Add error description to 2 machines"
    );
    await userEvent.type(commentInput, "machine is on fire");

    const submitButton = screen.getByRole("button", {
      name: "Mark 2 machines broken",
    });
    await userEvent.click(submitButton);

    expect(
      store
        .getActions()
        .filter((action) => action.type === "machine/markBroken")
    ).toStrictEqual([
      {
        type: "machine/markBroken",
        meta: {
          model: "machine",
          method: "action",
        },
        payload: {
          params: {
            action: NodeActions.MARK_BROKEN,
            extra: {
              message: "machine is on fire",
            },
            system_id: "abc123",
          },
        },
      },
      {
        type: "machine/markBroken",
        meta: {
          model: "machine",
          method: "action",
        },
        payload: {
          params: {
            action: NodeActions.MARK_BROKEN,
            extra: {
              message: "machine is on fire",
            },
            system_id: "def456",
          },
        },
      },
    ]);
  });

  it("dispatches actions to mark selected machines broken without a message", async () => {
    const store = mockStore(state);
    renderWithBrowserRouter(
      <MarkBrokenForm
        clearSidePanelContent={jest.fn()}
        machines={[state.machine.items[0]]}
        processingCount={0}
        viewingDetails={false}
      />,
      { route: "/machines", store }
    );

    const submitButton = screen.getByRole("button", {
      name: "Mark machine broken",
    });
    await userEvent.click(submitButton);

    expect(
      store.getActions().find((action) => action.type === "machine/markBroken")
    ).toStrictEqual({
      type: "machine/markBroken",
      meta: {
        model: "machine",
        method: "action",
      },
      payload: {
        params: {
          action: NodeActions.MARK_BROKEN,
          extra: {
            message: "",
          },
          system_id: "abc123",
        },
      },
    });
  });
});
