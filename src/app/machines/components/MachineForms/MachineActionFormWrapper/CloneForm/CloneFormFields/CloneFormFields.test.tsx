import { Formik } from "formik";
import configureStore from "redux-mock-store";

import CloneFormFields from "./CloneFormFields";

import { actions as machineActions } from "@/app/store/machine";
import type { RootState } from "@/app/store/root/types";
import { callId, enableCallIdMocks } from "testing/callId-mock";
import {
  fabricState as fabricStateFactory,
  machineDetails as machineDetailsFactory,
  machineState as machineStateFactory,
  machineStateList as machineStateListFactory,
  machineStateListGroup as machineStateListGroupFactory,
  rootState as rootStateFactory,
  subnetState as subnetStateFactory,
  vlanState as vlanStateFactory,
} from "testing/factories";
import { renderWithMockStore, screen, userEvent, waitFor } from "testing/utils";

const mockStore = configureStore<RootState>();

enableCallIdMocks();

describe("CloneFormFields", () => {
  let state: RootState;
  const machine = machineDetailsFactory({
    pod: { id: 11, name: "podrick" },
    system_id: "abc123",
  });
  beforeEach(() => {
    state = rootStateFactory({
      fabric: fabricStateFactory({ loaded: true }),

      machine: machineStateFactory({
        loaded: true,
        lists: {
          [callId]: machineStateListFactory({
            loaded: true,
            groups: [
              machineStateListGroupFactory({
                items: [machine.system_id],
              }),
            ],
          }),
        },
      }),
      subnet: subnetStateFactory({ loaded: true }),
      vlan: vlanStateFactory({ loaded: true }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("dispatches action to fetch data on load", async () => {
    const store = mockStore(state);
    renderWithMockStore(
      <Formik
        initialValues={{ interfaces: false, source: "", storage: false }}
        onSubmit={jest.fn()}
      >
        <CloneFormFields
          selectedMachine={null}
          setSelectedMachine={jest.fn()}
        />
      </Formik>,
      { store }
    );

    const expectedActions = [
      "fabric/fetch",
      "machine/fetch",
      "subnet/fetch",
      "vlan/fetch",
    ];

    await waitFor(() => {
      const actualActions = store.getActions();
      return expect(
        expectedActions.every((expected) =>
          actualActions.some((actual) => actual.type === expected)
        )
      ).toBe(true);
    });
  });

  it("dispatches action to get full machine details on machine click", async () => {
    const machine = machineDetailsFactory({ system_id: "abc123" });
    state.machine.items = [machine];
    const store = mockStore(state);
    renderWithMockStore(
      <Formik
        initialValues={{ interfaces: false, source: "", storage: false }}
        onSubmit={jest.fn()}
      >
        <CloneFormFields
          selectedMachine={null}
          setSelectedMachine={jest.fn()}
        />
      </Formik>,
      { store }
    );
    await userEvent.click(screen.getAllByTestId("machine-select-row")[0]);
    const expectedAction = machineActions.get(machine.system_id, callId);

    await waitFor(() => {
      const actualActions = store.getActions();
      return expect(
        actualActions.find((action) => action.type === expectedAction.type)
      ).toStrictEqual(expectedAction);
    });
  });

  it("applies different styling depending on clone selection state", async () => {
    const machine = machineDetailsFactory({ system_id: "abc123" });
    state.machine.items = [machine];
    renderWithMockStore(
      <Formik
        initialValues={{ interfaces: false, source: "", storage: false }}
        onSubmit={jest.fn()}
      >
        <CloneFormFields
          selectedMachine={machine}
          setSelectedMachine={jest.fn()}
        />
      </Formik>,
      { state }
    );
    let table = screen.getByRole("grid", { name: "Clone network" });
    // Table has unselected styling by default
    expect(table).toHaveClass("not-selected");

    // Check the checkbox for the table.
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Clone network configuration" })
    );

    await waitFor(() => {
      table = screen.getByRole("grid", { name: "Clone network" });
      expect(table).not.toHaveClass("not-selected");
    });
  });
});
