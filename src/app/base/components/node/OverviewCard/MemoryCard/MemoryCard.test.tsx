import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";

import MemoryCard from "./MemoryCard";

import {
  controllerDetails as controllerDetailsFactory,
  machineDetails as machineDetailsFactory,
  testStatus as testStatusFactory,
} from "testing/factories";
import { produceMockStore } from "testing/utils";

it("does not render test info if node is a controller", () => {
  const controller = controllerDetailsFactory();
  const store = produceMockStore((stateDraft) => {
    stateDraft.controller.items = [controller];
  });

  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <MemoryCard node={controller} />
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  expect(screen.queryByText(/tests/i)).not.toBeInTheDocument();
});

it("renders test info if node is a machine", () => {
  const machine = machineDetailsFactory();
  const store = produceMockStore((stateDraft) => {
    stateDraft.machine.items = [machine];
  });

  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <MemoryCard node={machine} setSidePanelContent={jest.fn()} />
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  expect(screen.getByText(/tests/i)).toBeInTheDocument();
});

describe("node is a machine", () => {
  it("renders a link with a count of passed tests", () => {
    const machine = machineDetailsFactory();
    machine.memory_test_status = testStatusFactory({
      passed: 2,
    });
    const store = produceMockStore((stateDraft) => {
      stateDraft.machine.items = [machine];
    });

    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <MemoryCard node={machine} setSidePanelContent={jest.fn()} />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByRole("link", { name: /2/i })).toBeInTheDocument();
  });

  it("renders a link with a count of pending and running tests", () => {
    const machine = machineDetailsFactory();
    machine.memory_test_status = testStatusFactory({
      running: 1,
      pending: 2,
    });
    const store = produceMockStore((state) => {
      state.machine.items = [machine];
    });

    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <MemoryCard node={machine} setSidePanelContent={jest.fn()} />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByRole("link", { name: /3/i })).toBeInTheDocument();
  });

  it("renders a link with a count of failed tests", () => {
    const machine = machineDetailsFactory();
    machine.memory_test_status = testStatusFactory({
      failed: 5,
    });
    const store = produceMockStore((state) => {
      state.machine.items = [machine];
    });

    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <MemoryCard node={machine} setSidePanelContent={jest.fn()} />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByRole("link", { name: /5/i })).toBeInTheDocument();
  });

  it("renders a results link", () => {
    const machine = machineDetailsFactory();
    const store = produceMockStore((state) => {
      machine.memory_test_status = testStatusFactory({
        failed: 5,
      });
      state.machine.items = [machine];
    });

    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <MemoryCard node={machine} setSidePanelContent={jest.fn()} />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByRole("link", { name: /view results/i })
    ).toBeInTheDocument();
  });

  it("renders a test cpu link if no tests run", () => {
    const machine = machineDetailsFactory();
    machine.memory_test_status = testStatusFactory();
    const store = produceMockStore((state) => {
      state.machine.items = [machine];
    });

    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/machine/abc123", key: "testKey" }]}
        >
          <CompatRouter>
            <MemoryCard node={machine} setSidePanelContent={jest.fn()} />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByRole("button", { name: /test memory/i })
    ).toBeInTheDocument();
  });
});
