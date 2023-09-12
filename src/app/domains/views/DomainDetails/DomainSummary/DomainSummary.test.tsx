import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import DomainSummary, { Labels as DomainSummaryLabels } from "./DomainSummary";

import { Labels as EditableSectionLabels } from "@/app/base/components/EditableSection";
import type { RootState } from "@/app/store/root/types";
import {
  authState as authStateFactory,
  domain as domainFactory,
  domainState as domainStateFactory,
  rootState as rootStateFactory,
  user as userFactory,
  userState as userStateFactory,
} from "testing/factories";
import {
  render,
  renderWithBrowserRouter,
  screen,
  userEvent,
} from "testing/utils";

const mockStore = configureStore();

describe("DomainSummary", () => {
  it("render nothing if domain doesn't exist", () => {
    const state = rootStateFactory();
    renderWithBrowserRouter(<DomainSummary id={1} />, {
      state,
    });

    expect(
      screen.queryByRole("heading", { name: DomainSummaryLabels.Title })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(DomainSummaryLabels.Summary)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: DomainSummaryLabels.FormLabel })
    ).not.toBeInTheDocument();
  });

  it("renders domain summary", () => {
    const state = rootStateFactory({
      domain: domainStateFactory({
        items: [domainFactory({ id: 1, name: "test" })],
      }),
    });

    renderWithBrowserRouter(<DomainSummary id={1} />, {
      state,
    });

    expect(
      screen.getByRole("heading", { name: DomainSummaryLabels.Title })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(DomainSummaryLabels.Summary)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: DomainSummaryLabels.FormLabel })
    ).not.toBeInTheDocument();
  });

  it("doesn't render Edit button when user is not admin", () => {
    const state = rootStateFactory({
      domain: domainStateFactory({
        items: [domainFactory({ id: 1, name: "test" })],
      }),
      user: userStateFactory({
        auth: authStateFactory({
          user: userFactory({ is_superuser: false }),
        }),
      }),
    });

    renderWithBrowserRouter(<DomainSummary id={1} />, {
      state,
    });

    expect(
      screen.queryByRole("button", { name: EditableSectionLabels.EditButton })
    ).not.toBeInTheDocument();
  });

  describe("when user is admin", () => {
    let state: RootState;

    beforeEach(() => {
      state = rootStateFactory({
        domain: domainStateFactory({
          items: [
            domainFactory({
              id: 1,
              name: "test",
            }),
          ],
        }),
        user: userStateFactory({
          auth: authStateFactory({
            user: userFactory({ is_superuser: true }),
          }),
        }),
      });
    });

    it("renders the Edit button", () => {
      renderWithBrowserRouter(<DomainSummary id={1} />, {
        state,
      });

      expect(
        screen.getAllByRole("button", {
          name: EditableSectionLabels.EditButton,
        })[0]
      ).toBeInTheDocument();
    });

    it("renders the form when Edit button is clicked", async () => {
      renderWithBrowserRouter(<DomainSummary id={1} />, {
        state,
      });

      await userEvent.click(
        screen.getAllByRole("button", {
          name: EditableSectionLabels.EditButton,
        })[0]
      );

      expect(
        screen.queryByLabelText(DomainSummaryLabels.Summary)
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("form", { name: DomainSummaryLabels.FormLabel })
      ).toBeInTheDocument();
    });

    it("closes the form when Cancel button is clicked", async () => {
      renderWithBrowserRouter(<DomainSummary id={1} />, {
        state,
      });

      await userEvent.click(
        screen.getAllByRole("button", {
          name: EditableSectionLabels.EditButton,
        })[0]
      );

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(
        screen.getByLabelText(DomainSummaryLabels.Summary)
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("form", { name: DomainSummaryLabels.FormLabel })
      ).not.toBeInTheDocument();
    });

    it("calls actions.update on save click", async () => {
      const store = mockStore(state);

      render(
        <Provider store={store}>
          <MemoryRouter>
            <CompatRouter>
              <DomainSummary id={1} />
            </CompatRouter>
          </MemoryRouter>
        </Provider>
      );

      await userEvent.click(
        screen.getAllByRole("button", {
          name: EditableSectionLabels.EditButton,
        })[0]
      );

      await userEvent.clear(
        screen.getByRole("textbox", { name: DomainSummaryLabels.Name })
      );

      await userEvent.type(
        screen.getByRole("textbox", { name: DomainSummaryLabels.Name }),
        "test"
      );

      await userEvent.type(
        screen.getByRole("spinbutton", { name: DomainSummaryLabels.Ttl }),
        "42"
      );

      await userEvent.click(
        screen.getByRole("button", { name: DomainSummaryLabels.SubmitLabel })
      );

      expect(
        store.getActions().find((action) => action.type === "domain/update")
      ).toStrictEqual({
        type: "domain/update",
        meta: {
          method: "update",
          model: "domain",
        },
        payload: {
          params: {
            id: 1,
            name: "test",
            ttl: 42,
            authoritative: false,
          },
        },
      });
    });
  });
});
