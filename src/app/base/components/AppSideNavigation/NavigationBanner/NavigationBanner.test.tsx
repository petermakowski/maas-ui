import NavigationBanner from "./NavigationBanner";

import { renderWithBrowserRouter, screen } from "testing/utils";

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

it("displays a link to the homepage", () => {
  renderWithBrowserRouter(<NavigationBanner />, { route: "/" });

  expect(screen.getByRole("link", { name: /Homepage/ })).toBeInTheDocument();
});
