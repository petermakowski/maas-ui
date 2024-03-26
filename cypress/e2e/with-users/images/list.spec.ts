import { generateMAASURL } from "../../utils";

context("Images list", () => {
  beforeEach(() => {
    cy.login();
    cy.visit(generateMAASURL("/images"));
  });

  it("renders the correct heading", () => {
    cy.get("[data-testid='main-toolbar-heading']").contains("Images");
  });

  it("changes source to custom and connects", () => {
    cy.waitForPageToLoad();
    cy.findByRole("button", { name: "Change source" }).click();
    cy.findByRole("radio", { name: "Custom" }).click({ force: true });
    cy.findByRole("textbox", { name: "URL" }).type(
      "http://images.maas.io/ephemeral-v3/candidate"
    );
    cy.findByRole("button", { name: "Connect" }).click();
    cy.waitForPageToLoad();
    cy.findByText("Showing images fetched from").should("be.visible");
  });
});
