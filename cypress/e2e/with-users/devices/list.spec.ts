import { generateMAASURL, generateMac } from "../../utils";

context("Device listing", () => {
  beforeEach(() => {
    cy.login();
    cy.visit(generateMAASURL("/devices"));
  });

  it("renders the correct heading", () => {
    cy.get("[data-testid='main-toolbar-heading']").contains("Devices");
  });

  it("can add a tag to the device", () => {
    // can add a device
    cy.findByRole("button", { name: /Add device/ }).click();
    const mac = generateMac();
    cy.findByLabelText(/Device name/).type("cypress-device");
    cy.get("input[placeholder='00:00:00:00:00:00']").type(mac);
    cy.findByRole("button", { name: /Save device/ }).click();

    // can view device details on click of device details link
    cy.findByRole("link", { name: /cypress-device/ }).click();

    cy.findByRole("link", {
      name: /Configuration/,
    }).click();
    cy.findByRole("button", {
      name: /Edit/,
    }).click();
    cy.get("input[placeholder='Create or remove tags']").type("device-tag");

    cy.findByRole("button", {
      name: /Create tag "device-tag"/,
    }).click();

    cy.findByRole("button", {
      name: /Create and add to tag changes/,
    }).click();

    cy.findByRole("button", { name: /Save changes/ }).click();

    cy.findByRole("link", { name: /Summary/ }).click();
    cy.findByText(/device-tag/).should("exist");
  });
});
