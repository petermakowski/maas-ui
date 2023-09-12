import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import DeleteDomainForm, {
  Labels as DeleteDomainFormLabels,
} from "./DeleteDomainForm";

import {
  domain as domainFactory,
  domainState as domainStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import {
  render,
  renderWithBrowserRouter,
  screen,
  userEvent,
} from "testing/utils";

const mockStore = configureStore();

describe("DeleteDomainForm", () => {
  it("calls closeForm on cancel click", async () => {
    const closeForm = jest.fn();
    const state = rootStateFactory({
      domain: domainStateFactory({
        items: [domainFactory({ id: 1, name: "domain-in-the-brain" })],
      }),
    });
    renderWithBrowserRouter(<DeleteDomainForm closeForm={closeForm} id={1} />, {
      state,
    });
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(closeForm).toHaveBeenCalled();
  });

  it("shows the correct text if the domain is deletable and dispatches the correct action when delete is clicked", async () => {
    const closeForm = jest.fn();
    const state = rootStateFactory({
      domain: domainStateFactory({
        items: [
          domainFactory({
            id: 1,
            name: "domain-in-the-brain",
            resource_count: 0,
          }),
        ],
      }),
    });
    const store = mockStore(state);
    render(
      <Provider store={store}>
        <MemoryRouter>
          <CompatRouter>
            <DeleteDomainForm closeForm={closeForm} id={1} />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByText(DeleteDomainFormLabels.AreYouSure)
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: DeleteDomainFormLabels.DeleteLabel })
    );

    expect(
      store.getActions().find((action) => action.type === "domain/delete")
    ).toStrictEqual({
      type: "domain/delete",
      meta: {
        method: "delete",
        model: "domain",
      },
      payload: {
        params: {
          id: 1,
        },
      },
    });
  });

  it("shows the correct text and disables the delete button if the domain has resource records", () => {
    const closeForm = jest.fn();
    const state = rootStateFactory({
      domain: domainStateFactory({
        items: [
          domainFactory({
            id: 1,
            name: "domain-in-the-brain",
            resource_count: 12,
          }),
        ],
      }),
    });

    renderWithBrowserRouter(<DeleteDomainForm closeForm={closeForm} id={1} />, {
      state,
    });

    expect(
      screen.getByText(DeleteDomainFormLabels.CannotDelete)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: DeleteDomainFormLabels.DeleteLabel })
    ).toBeDisabled();
  });
});
