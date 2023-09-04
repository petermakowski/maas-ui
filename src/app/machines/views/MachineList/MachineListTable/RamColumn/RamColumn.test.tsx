import { RamColumn } from "./RamColumn";

import type { RootState } from "@/app/store/root/types";
import { TestStatusStatus } from "@/app/store/types/node";
import {
  machine as machineFactory,
  machineState as machineStateFactory,
  rootState as rootStateFactory,
  testStatus as testStatusFactory,
} from "testing/factories";
import { renderWithBrowserRouter, screen, userEvent } from "testing/utils";

describe("RamColumn", () => {
  let state: RootState;
  beforeEach(() => {
    state = rootStateFactory({
      machine: machineStateFactory({
        errors: {},
        loading: false,
        loaded: true,
        items: [
          machineFactory({
            system_id: "abc123",
            memory: 8,
            memory_test_status: testStatusFactory({
              status: 2,
            }),
          }),
        ],
      }),
    });
  });

  it("displays ram amount", () => {
    state.machine.items[0].memory = 16;

    renderWithBrowserRouter(<RamColumn systemId="abc123" />, {
      route: "/machines",
      state,
    });

    expect(screen.getByTestId("memory")).toHaveTextContent("16");
  });

  it("displays an error and tooltip if memory tests have failed", async () => {
    state.machine.items[0].memory = 16;
    state.machine.items[0].memory_test_status = testStatusFactory({
      status: TestStatusStatus.FAILED,
    });

    renderWithBrowserRouter(<RamColumn systemId="abc123" />, {
      route: "/machines",
      state,
    });

    await userEvent.click(screen.getByRole("button", { name: /error/i }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Machine has failed tests."
    );
    expect(screen.getByLabelText("error")).toHaveClass("p-icon--error");
  });
});
