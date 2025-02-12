import { mount } from "enzyme";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import configureStore from "redux-mock-store";

import NodeNameFields from "./NodeNameFields";

import FormikForm from "app/base/components/FormikForm";
import type { RootState } from "app/store/root/types";
import {
  domainState as domainStateFactory,
  machineDetails as machineDetailsFactory,
  machineState as machineStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";

const mockStore = configureStore();

describe("NodeNameFields", () => {
  let state: RootState;
  beforeEach(() => {
    state = rootStateFactory({
      domain: domainStateFactory({
        loaded: true,
      }),
      machine: machineStateFactory({
        loaded: true,
        items: [
          machineDetailsFactory({
            locked: false,
            permissions: ["edit"],
            system_id: "abc123",
          }),
        ],
      }),
    });
  });

  it("displays a spinner when loading domains", () => {
    state.domain.loaded = false;
    const store = mockStore(state);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <FormikForm
            initialValues={{
              domain: "",
              hostname: "",
            }}
            onSubmit={jest.fn()}
          >
            <NodeNameFields />
          </FormikForm>
        </MemoryRouter>
      </Provider>
    );
    expect(wrapper.find("Spinner").exists()).toBe(true);
  });

  it("displays the fields", () => {
    const store = mockStore(state);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <FormikForm
            initialValues={{
              domain: "",
              hostname: "",
            }}
            onSubmit={jest.fn()}
          >
            <NodeNameFields />
          </FormikForm>
        </MemoryRouter>
      </Provider>
    );
    expect(wrapper.find("NodeNameFields")).toMatchSnapshot();
  });

  it("disables fields when saving", () => {
    const store = mockStore(state);
    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <FormikForm
            initialValues={{
              domain: "",
              hostname: "",
            }}
            onSubmit={jest.fn()}
          >
            <NodeNameFields saving />
          </FormikForm>
        </MemoryRouter>
      </Provider>
    );
    expect(
      wrapper.find("FormikField").everyWhere((n) => Boolean(n.prop("disabled")))
    ).toBe(true);
  });
});
