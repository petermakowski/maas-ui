import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import StorageCard from "./StorageCard";

import type { RootState } from "@/app/store/root/types";
import {
  controllerDetails as controllerDetailsFactory,
  controllerState as controllerStateFactory,
  machineDetails as machineDetailsFactory,
  machineState as machineStateFactory,
  rootState as rootStateFactory,
  testStatus as testStatusFactory,
} from "testing/factories";

const mockStore = configureStore();

let state: RootState;
beforeEach(() => {
  state = rootStateFactory({
    controller: controllerStateFactory({
      items: [],
    }),
    machine: machineStateFactory(),
  });
});

it("does not render test info if node is a controller", () => {
  const controller = controllerDetailsFactory();
  state.controller.items = [controller];

  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <StorageCard node={controller} />
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  expect(screen.queryByTestId("tests")).not.toBeInTheDocument();
});

it("renders test info if node is a machine", () => {
  const machine = machineDetailsFactory();
  state.machine.items = [machine];

  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <StorageCard node={machine} setSidePanelContent={jest.fn()} />
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  expect(screen.getByTestId("tests")).toBeInTheDocument();
});

describe("node is a machine", () => {
  it("renders a link with a count of passed tests", () => {
    const machine = machineDetailsFactory();
    machine.storage_test_status = testStatusFactory({
      passed: 2,
    });
    state.machine.items = [machine];

    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <StorageCard node={machine} setSidePanelContent={jest.fn()} />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/2/i)).toBeInTheDocument();
  });

  it("renders a link with a count of pending and running tests", () => {
    const machine = machineDetailsFactory();
    machine.storage_test_status = testStatusFactory({
      running: 1,
      pending: 2,
    });
    state.machine.items = [machine];

    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <StorageCard node={machine} setSidePanelContent={jest.fn()} />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/3/i)).toBeInTheDocument();
  });

  it("renders a link with a count of failed tests", () => {
    const machine = machineDetailsFactory();
    machine.storage_test_status = testStatusFactory({
      failed: 5,
    });
    state.machine.items = [machine];

    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <StorageCard node={machine} setSidePanelContent={jest.fn()} />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/5/i)).toBeInTheDocument();
  });

  it("renders a results link", () => {
    const machine = machineDetailsFactory();
    machine.storage_test_status = testStatusFactory({
      failed: 5,
    });
    state.machine.items = [machine];

    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <StorageCard node={machine} setSidePanelContent={jest.fn()} />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/view results/i)).toBeInTheDocument();
  });

  it("renders a test storage link if no tests run", () => {
    const machine = machineDetailsFactory();
    machine.storage_test_status = testStatusFactory();
    state.machine.items = [machine];

    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <StorageCard node={machine} setSidePanelContent={jest.fn()} />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/test storage/i)).toBeInTheDocument();
  });
});
