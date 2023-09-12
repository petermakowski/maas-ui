import NonBreakingSpace from "./NonBreakingSpace";

import { getDefaultNormalizer, render, screen } from "testing/utils";

it("renders a non breaking space correctly", () => {
  render(
    <>
      1<NonBreakingSpace />2
    </>
  );
  expect(
    screen.getByText("1 2", {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    })
  ).toBeInTheDocument();
  expect(screen.getByText("1 2")).toBeInTheDocument();
});
