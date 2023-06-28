import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import configureStore from "redux-mock-store";

import LXDVMsTable from "./LXDVMsTable";

import { actions as machineActions } from "app/store/machine";
import { FetchSortDirection, FetchGroupKey } from "app/store/machine/types";
import { generateCallId } from "app/store/machine/utils/query";
import { rootState as rootStateFactory } from "testing/factories";
import { render, screen } from "testing/utils";

const mockStore = configureStore();

describe("LXDVMsTable", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches machines on load", () => {
    const state = rootStateFactory();
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/kvm/1/project", key: "testKey" }]}
        >
          <LXDVMsTable
            getResources={jest.fn()}
            pods={["pod1"]}
            searchFilter=""
            setSearchFilter={jest.fn()}
            setSidePanelContent={jest.fn()}
          />
        </MemoryRouter>
      </Provider>
    );

    const options = {
      filter: { pod: ["pod1"] },
      group_collapsed: undefined,
      group_key: null,
      page_number: 1,
      page_size: 10,
      sort_direction: FetchSortDirection.Descending,
      sort_key: FetchGroupKey.Hostname,
    };
    const expectedAction = machineActions.fetch(generateCallId(options), {
      filter: { pod: ["pod1"] },
      group_collapsed: undefined,
      group_key: null,
      page_number: 1,
      page_size: 10,
      sort_direction: FetchSortDirection.Descending,
      sort_key: FetchGroupKey.Hostname,
    });
    expect(
      store.getActions().find((action) => action.type === expectedAction.type)
    ).toStrictEqual(expectedAction);
  });

  it("clears machine selected state on unmount", async () => {
    const state = rootStateFactory();
    const store = mockStore(state);
    const { unmount } = render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/kvm/1/project", key: "testKey" }]}
        >
          <LXDVMsTable
            getResources={jest.fn()}
            pods={["pod1"]}
            searchFilter=""
            setSearchFilter={jest.fn()}
            setSidePanelContent={jest.fn()}
          />
        </MemoryRouter>
      </Provider>
    );

    unmount();

    const expectedAction = machineActions.setSelected(null);
    expect(
      store.getActions().find((action) => action.type === expectedAction.type)
    ).toStrictEqual(expectedAction);
  });

  it("shows an add VM button if function provided", () => {
    const state = rootStateFactory();
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/kvm/1/project", key: "testKey" }]}
        >
          <LXDVMsTable
            getResources={jest.fn()}
            onAddVMClick={jest.fn()}
            pods={["pod1"]}
            searchFilter=""
            setSearchFilter={jest.fn()}
            setSidePanelContent={jest.fn()}
          />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByRole("button", { name: "Add VM" })).toBeInTheDocument();
  });

  it("does not show an add VM button if no function provided", () => {
    const state = rootStateFactory();
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[{ pathname: "/kvm/1/project", key: "testKey" }]}
        >
          <LXDVMsTable
            getResources={jest.fn()}
            pods={["pod1"]}
            searchFilter=""
            setSearchFilter={jest.fn()}
            setSidePanelContent={jest.fn()}
          />
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.queryByRole("button", { name: "Add VM" })
    ).not.toBeInTheDocument();
  });
});
