import SectionHeader from "./SectionHeader";

import { renderWithBrowserRouter, screen } from "testing/utils";

describe("SectionHeader", () => {
  it("can render title and subtitle", () => {
    renderWithBrowserRouter(
      <SectionHeader subtitle="Subtitle" title="Title" />
    );
    expect(screen.getByTestId("main-toolbar-heading")).toHaveTextContent(
      "Title"
    );
    expect(screen.getByTestId("section-header-subtitle")).toHaveTextContent(
      "Subtitle"
    );
  });

  it("displays the title as a h1 by default", () => {
    renderWithBrowserRouter(<SectionHeader title="Title" />);
    const title = screen.getByRole("heading", { level: 1, name: "Title" });
    expect(title).toBeInTheDocument();
    expect(title.classList.contains("p-heading--4")).toBe(true);
  });

  it("can change the title element", () => {
    renderWithBrowserRouter(<SectionHeader title="Title" titleElement="div" />);
    const title = screen.getByTestId("main-toolbar-heading");
    expect(title).toBeInTheDocument();
    expect(title.classList.contains("p-heading--4")).toBe(false);
  });

  it("shows a spinner instead of title if loading", () => {
    renderWithBrowserRouter(
      <SectionHeader loading subtitle="Subtitle" title="Title" />
    );
    expect(
      screen.getByTestId("main-toolbar-heading-spinner")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("main-toolbar-heading")
    ).not.toBeInTheDocument();
  });

  it("shows a spinner instead of subtitle if subtitle loading", () => {
    renderWithBrowserRouter(
      <SectionHeader subtitle="Subtitle" subtitleLoading title="Title" />
    );
    expect(screen.getByTestId("section-header-subtitle")).toHaveTextContent(
      "Loading"
    );
  });

  it("can render buttons", () => {
    const buttons = [
      <button key="button-1">Button 1</button>,
      <button key="button-2">Button 2</button>,
    ];
    renderWithBrowserRouter(<SectionHeader buttons={buttons} title="Title" />);
    expect(screen.getByTestId("section-header-buttons")).toBeInTheDocument();
  });

  it("can render tabs", () => {
    const tabLinks = [
      {
        active: true,
        label: "Tab 1",
        path: "/path1",
      },
      {
        active: false,
        label: "Tab 2",
        path: "/path2",
      },
    ];
    renderWithBrowserRouter(
      <SectionHeader tabLinks={tabLinks} title="Title" />
    );
    expect(screen.getByTestId("section-header-tabs")).toBeInTheDocument();
  });
});
