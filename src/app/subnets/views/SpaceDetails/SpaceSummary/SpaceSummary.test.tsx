import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import SpaceSummary from "./SpaceSummary";

import {
  rootState as rootStateFactory,
  space as spaceFactory,
  spaceState as spaceStateFactory,
} from "testing/factories";
import { render, screen, userEvent, waitFor, within } from "testing/utils";

const getRootState = () =>
  rootStateFactory({
    space: spaceStateFactory({
      items: [
        spaceFactory({
          name: "outer",
          description: "The cold, dark, emptiness of space.",
        }),
      ],
      loading: false,
    }),
  });

it("displays space name and description", () => {
  const space = spaceFactory({
    name: "outer",
    description: "The cold, dark, emptiness of space.",
  });
  render(<SpaceSummary space={space} />);
  const spaceSummary = screen.getByRole("region", { name: "Space summary" });

  expect(within(spaceSummary).getByText("outer")).toBeInTheDocument();
  expect(
    within(spaceSummary).getByText("The cold, dark, emptiness of space.")
  ).toBeInTheDocument();
});

it("can open and close the Edit space summary form", async () => {
  const space = spaceFactory({
    name: "outer",
    description: "The cold, dark, emptiness of space.",
  });
  const state = getRootState();
  state.space.items = [space];
  const store = configureStore()(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <SpaceSummary space={state.space.items[0]} />
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  const spaceSummary = screen.getByRole("region", { name: "Space summary" });
  await userEvent.click(
    within(spaceSummary).getAllByRole("button", { name: "Edit" })[0]
  );
  await waitFor(() =>
    expect(
      screen.getByRole("form", { name: "Edit space summary" })
    ).toBeInTheDocument()
  );

  await userEvent.click(
    within(spaceSummary).getByRole("button", { name: "Cancel" })
  );

  await waitFor(() =>
    expect(
      screen.queryByRole("form", { name: "Edit space summary" })
    ).not.toBeInTheDocument()
  );
});
