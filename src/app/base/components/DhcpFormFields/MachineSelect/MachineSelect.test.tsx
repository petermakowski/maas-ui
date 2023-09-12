import { Formik } from "formik";

import MachineSelect, { Labels } from "./MachineSelect";

import { renderWithMockStore, screen, userEvent } from "testing/utils";

it("can open select box on click", async () => {
  renderWithMockStore(
    <Formik initialValues={{ machine: "" }} onSubmit={jest.fn()}>
      <MachineSelect name="machine" />
    </Formik>
  );

  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: new RegExp(Labels.ChooseMachine, "i") })
  );
  expect(screen.getByRole("listbox")).toBeInTheDocument();
});

it("sets focus on the input field on open", async () => {
  renderWithMockStore(
    <Formik initialValues={{ machine: "" }} onSubmit={jest.fn()}>
      <MachineSelect name="machine" />
    </Formik>
  );

  await userEvent.click(
    screen.getByRole("button", { name: new RegExp(Labels.ChooseMachine, "i") })
  );
  expect(
    screen.getByPlaceholderText("Search by hostname, system ID or tags")
  ).toHaveFocus();
});
