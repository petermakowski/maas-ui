import { Label as TagsHeaderLabel } from "../components/TagsHeader/TagsHeader";

import { Label as TagDetailsLabel } from "./TagDetails/TagDetails";
import { Label as TagListLabel } from "./TagList/TagList";
import { Label as TagUpdateLabel } from "./TagUpdate/TagUpdate";
import Tags from "./Tags";

import urls from "@/app/base/urls";
import { Label as NotFoundLabel } from "@/app/base/views/NotFound/NotFound";
import type { RootState } from "@/app/store/root/types";
import {
  rootState as rootStateFactory,
  tag as tagFactory,
  tagState as tagStateFactory,
} from "testing/factories";
import { renderWithBrowserRouter, screen, within } from "testing/utils";

describe("Tags", () => {
  let scrollToSpy: jest.Mock;
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory({
      tag: tagStateFactory({
        loaded: true,
        items: [tagFactory({ id: 1 }), tagFactory()],
      }),
    });
    // Mock the scrollTo method as jsdom doesn't support this and will error.
    scrollToSpy = jest.fn();
    global.scrollTo = scrollToSpy;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  [
    {
      label: TagDetailsLabel.Title,
      path: urls.tags.tag.index({ id: 1 }),
    },
    {
      label: TagUpdateLabel.Form,
      path: urls.tags.tag.update({ id: 1 }),
    },
    {
      label: TagListLabel.Title,
      path: urls.tags.index,
      pattern: `${urls.tags.index}/*`,
    },
    {
      label: NotFoundLabel.Title,
      path: `${urls.tags.index}/not/a/path`,
      pattern: `${urls.tags.index}/*`,
    },
  ].forEach(({ label, path, pattern = `${urls.tags.tag.index(null)}/*` }) => {
    it(`Displays: ${label} at: ${path}`, () => {
      renderWithBrowserRouter(<Tags />, {
        routePattern: pattern,
        state,
        route: path,
      });
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  it("shows buttons when not displaying forms", () => {
    renderWithBrowserRouter(<Tags />, {
      routePattern: `${urls.tags.tag.index(null)}/*`,
      state,
      route: urls.tags.tag.index({ id: 1 }),
    });
    const header = screen.getByLabelText(TagsHeaderLabel.Header);
    const details = screen.getByLabelText(TagDetailsLabel.Title);
    expect(
      within(header).getByRole("button", { name: TagsHeaderLabel.CreateButton })
    ).toBeInTheDocument();
    expect(
      within(details).getByRole("button", {
        name: TagDetailsLabel.DeleteButton,
      })
    ).toBeInTheDocument();
    expect(
      within(details).getByRole("link", { name: TagDetailsLabel.EditButton })
    ).toBeInTheDocument();
  });
});
