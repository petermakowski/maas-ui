import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import MachinesHeader from "./MachinesHeader";

import type { RootState } from "app/store/root/types";
import { callId, enableCallIdMocks } from "testing/callId-mock";
import {
  machine as machineFactory,
  machineState as machineStateFactory,
  machineStateCount as machineStateCountFactory,
  machineStateCounts as machineStateCountsFactory,
  machineStatus as machineStatusFactory,
  rootState as rootStateFactory,
} from "testing/factories";

enableCallIdMocks();
const mockStore = configureStore();

describe("MachinesHeader", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory({
      machine: machineStateFactory({
        loaded: true,
        counts: machineStateCountsFactory({
          [callId]: machineStateCountFactory({
            count: 2,
            loaded: true,
            loading: false,
          }),
        }),
        items: [
          machineFactory({ system_id: "abc123" }),
          machineFactory({ system_id: "def456" }),
        ],
        statuses: {
          abc123: machineStatusFactory({}),
          def456: machineStatusFactory({}),
        },
      }),
    });
  });

  it("renders", () => {
    state.machine.loaded = true;
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machines", key: "testKey" }]}
        >
          <CompatRouter>
            <MachinesHeader machineCount={2} title="Machines" />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByTestId("main-toolbar-heading")).toHaveTextContent(
      "Machines"
    );
  });
});
