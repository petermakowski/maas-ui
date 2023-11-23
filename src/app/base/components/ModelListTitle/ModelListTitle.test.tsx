import { render, screen } from "@testing-library/react";

import { ModelListTitle, TestIds } from "./ModelListTitle";

it("renders the pluralized model name when count is null", () => {
  render(<ModelListTitle isLoading={false} model="machine" />);
  expect(screen.getByTestId(TestIds.Title)).toHaveTextContent("machines");
});

it("renders the singular model name when count is 1", () => {
  render(<ModelListTitle count={1} isLoading={false} model="machine" />);
  expect(screen.getByTestId(TestIds.Title)).toHaveTextContent("1 machine");
});

it("renders the pluralized model name with count when count is more than 1", () => {
  render(<ModelListTitle count={2} isLoading={false} model="machine" />);
  expect(screen.getByTestId(TestIds.Title)).toHaveTextContent("2 machines");
});

it("displays placeholder when loading", () => {
  render(<ModelListTitle isLoading={true} model="machine" />);
  expect(screen.getByTestId(/placeholder/i)).toBeInTheDocument();
});

it("keeps displaying previous data when loading", () => {
  render(<ModelListTitle count={1} isLoading={true} model="machine" />);
  expect(screen.queryByTestId(/placeholder/i)).not.toBeInTheDocument();
});

it("displays placeholder when loading and count is 0", () => {
  render(<ModelListTitle count={0} isLoading={true} model="machine" />);
  expect(screen.getByTestId(/placeholder/i)).toBeInTheDocument();
});
