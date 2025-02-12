import { mount } from "enzyme";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import configureStore from "redux-mock-store";

import ActionFormWrapper from "./ActionFormWrapper";

import { actions as machineActions } from "app/store/machine";
import { NodeActions } from "app/store/types/node";
import {
  machine as machineFactory,
  rootState as rootStateFactory,
} from "testing/factories";

const mockStore = configureStore();

describe("ActionFormWrapper", () => {
  it("can set selected machines to those that can perform action", () => {
    const state = rootStateFactory();
    const machines = [
      machineFactory({ system_id: "abc123", actions: [NodeActions.ABORT] }),
      machineFactory({ system_id: "def456", actions: [] }),
    ];
    const store = mockStore(state);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machines", key: "testKey" }]}
        >
          <ActionFormWrapper
            action={NodeActions.ABORT}
            clearHeaderContent={jest.fn()}
            machines={machines}
            viewingDetails={false}
          />
        </MemoryRouter>
      </Provider>
    );

    wrapper.find('button[data-testid="on-update-selected"]').simulate("click");

    const expectedAction = machineActions.setSelected(["abc123"]);
    const actualActions = store.getActions();
    expect(
      actualActions.find((action) => action.type === expectedAction.type)
    ).toStrictEqual(expectedAction);
  });
});
