import ManagedAllocationLabel from "./ManagedAllocationLabel";

import { render, screen, userEvent } from "testing/utils";

it("shows a tooltip", async () => {
  render(<ManagedAllocationLabel />);

  await userEvent.click(screen.getByRole("button"));

  expect(
    screen.getByRole("tooltip", {
      name: /MAAS allocates IP addresses from this subnet/,
    })
  ).toBeInTheDocument();
});
