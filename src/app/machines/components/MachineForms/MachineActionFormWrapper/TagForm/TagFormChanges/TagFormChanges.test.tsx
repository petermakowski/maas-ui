import reduxToolkit from "@reduxjs/toolkit";
import { Formik } from "formik";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import TagFormChanges, { Label, RowType } from "./TagFormChanges";

import type { RootState } from "@/app/store/root/types";
import type { Tag } from "@/app/store/tag/types";
import {
  machine as machineFactory,
  machineState as machineStateFactory,
  tag as tagFactory,
  tagState as tagStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { tagStateListFactory } from "testing/factories/state";
import { userEvent, render, screen, waitFor, within } from "testing/utils";

const mockStore = configureStore();

let state: RootState;
let tags: Tag[];
const commonProps = {
  selectedCount: 0,
  toggleTagDetails: jest.fn(),
};

beforeEach(() => {
  jest.spyOn(reduxToolkit, "nanoid").mockReturnValue("mocked-nanoid");
  tags = [
    tagFactory({ id: 1, name: "tag1" }),
    tagFactory({ id: 2, name: "tag2" }),
  ];

  state = rootStateFactory({
    machine: machineStateFactory({
      items: [machineFactory({ tags: [1] }), machineFactory({ tags: [1, 2] })],
    }),
    tag: tagStateFactory({
      items: tags,
      lists: {
        "mocked-nanoid": tagStateListFactory({
          items: [
            tagFactory({ id: 1, name: "tag1" }),
            tagFactory({ id: 2, name: "tag2" }),
          ],
          loaded: true,
        }),
      },
    }),
  });
});

it("displays manual tags", () => {
  tags[0].definition = "";
  tags[1].definition = "";
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik
            initialValues={{ added: [], removed: [] }}
            onSubmit={jest.fn()}
          >
            <TagFormChanges {...commonProps} newTags={[]} tags={tags} />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  const labelCell = screen.getByRole("cell", { name: Label.Manual });
  expect(labelCell).toBeInTheDocument();
  expect(labelCell).toHaveAttribute("rowSpan", "2");
  expect(screen.getByRole("row", { name: "tag1" })).toHaveAttribute(
    "data-testid",
    RowType.Manual
  );
  expect(screen.getByRole("row", { name: "tag2" })).toHaveAttribute(
    "data-testid",
    RowType.Manual
  );
});

it("displays automatic tags", () => {
  tags[0].definition = "def1";
  tags[1].definition = "def2";
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik
            initialValues={{ added: [], removed: [] }}
            onSubmit={jest.fn()}
          >
            <TagFormChanges {...commonProps} newTags={[]} tags={tags} />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  const labelCell = screen.getByRole("cell", {
    name: new RegExp(Label.Automatic),
  });
  expect(labelCell).toBeInTheDocument();
  expect(labelCell).toHaveAttribute("rowSpan", "2");
  expect(screen.getByRole("row", { name: "tag1" })).toHaveAttribute(
    "data-testid",
    RowType.Auto
  );
  expect(screen.getByRole("row", { name: "tag2" })).toHaveAttribute(
    "data-testid",
    RowType.Auto
  );
});

it("displays added tags, with a 'NEW' prefix for newly created tags", () => {
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik
            initialValues={{ added: [tags[0].id, tags[1].id], removed: [] }}
            onSubmit={jest.fn()}
          >
            <TagFormChanges
              {...commonProps}
              newTags={[tags[1].id]}
              tags={tags}
            />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  const labelCell = screen.getByRole("cell", {
    name: new RegExp(Label.Added),
  });
  const existingTagRow = screen.getByRole("row", { name: "tag1" });
  const newTagRow = screen.getByRole("row", { name: "tag2" });
  expect(labelCell).toBeInTheDocument();
  expect(labelCell).toHaveAttribute("rowSpan", "2");
  expect(existingTagRow).toHaveAttribute("data-testid", RowType.Added);
  expect(within(existingTagRow).queryByText("New")).not.toBeInTheDocument();
  expect(newTagRow).toHaveAttribute("data-testid", RowType.Added);
  expect(within(newTagRow).getByText("NEW")).toBeInTheDocument();
});

it("discards added tags", async () => {
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik
            initialValues={{ added: [tags[0].id, tags[1].id], removed: [] }}
            onSubmit={jest.fn()}
          >
            <TagFormChanges {...commonProps} newTags={[]} tags={[]} />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  const row = screen.getByRole("row", { name: "tag1" });
  expect(row).toHaveAttribute("data-testid", RowType.Added);
  await userEvent.click(
    within(row).getByRole("button", { name: Label.Discard })
  );
  await waitFor(() => {
    expect(screen.queryByRole("row", { name: "tag1" })).not.toBeInTheDocument();
  });
});

it("displays a tag details modal when chips are clicked", async () => {
  const expectedTag = tags[0];
  expectedTag.name = "tag1";
  expectedTag.machine_count = 2;
  const store = mockStore(state);
  const handleToggleTagDetails = jest.fn();
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik
            initialValues={{ added: [], removed: [] }}
            onSubmit={jest.fn()}
          >
            <TagFormChanges
              newTags={[]}
              selectedCount={2}
              tags={tags}
              toggleTagDetails={handleToggleTagDetails}
            />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  await userEvent.click(
    screen.getByRole("button", { name: `${expectedTag.name} (2/2)` })
  );
  expect(handleToggleTagDetails).toHaveBeenCalledWith(expectedTag);
});

it("can remove manual tags", async () => {
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik
            initialValues={{ added: [], removed: [] }}
            onSubmit={jest.fn()}
          >
            <TagFormChanges {...commonProps} newTags={[]} tags={tags} />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  const tagName = "tag1";
  const manualRow = screen.getByRole("row", { name: tagName });
  expect(manualRow).toHaveAttribute("data-testid", RowType.Manual);
  await userEvent.click(
    within(manualRow).getByRole("button", { name: Label.Remove })
  );
  // Get the tag's new row.
  const updatedRow = screen.getByRole("row", { name: tagName });
  await waitFor(() =>
    expect(updatedRow).toHaveAttribute("data-testid", RowType.Removed)
  );
});

it("displays removed tags", () => {
  const tags = state.tag.items;
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik
            initialValues={{ added: [], removed: [tags[0].id, tags[1].id] }}
            onSubmit={jest.fn()}
          >
            <TagFormChanges {...commonProps} newTags={[]} tags={[]} />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  const labelCell = screen.getByRole("cell", {
    name: new RegExp(Label.Removed),
  });
  expect(labelCell).toBeInTheDocument();
  expect(labelCell).toHaveAttribute("rowSpan", "2");
  expect(screen.getByRole("row", { name: "tag1" })).toHaveAttribute(
    "data-testid",
    RowType.Removed
  );
  expect(screen.getByRole("row", { name: "tag2" })).toHaveAttribute(
    "data-testid",
    RowType.Removed
  );
});

it("discards removed tags", async () => {
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik
            initialValues={{ added: [], removed: [tags[0].id, tags[1].id] }}
            onSubmit={jest.fn()}
          >
            <TagFormChanges {...commonProps} newTags={[]} tags={tags} />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  const row = screen.getByRole("row", { name: "tag1" });
  expect(row).toHaveAttribute("data-testid", RowType.Removed);
  await userEvent.click(
    within(row).getByRole("button", { name: Label.Discard })
  );
  await waitFor(() => {
    expect(screen.queryByRole("row", { name: "tag1" })).toHaveAttribute(
      "data-testid",
      RowType.Manual
    );
  });
});

it("shows a message if no tags are assigned to the selected machines", () => {
  const state = rootStateFactory({
    machine: machineStateFactory({
      items: [machineFactory({ tags: [] }), machineFactory({ tags: [] })],
      loaded: true,
      loading: false,
    }),
    tag: tagStateFactory({
      items: [tagFactory(), tagFactory()],
      loaded: true,
      loading: false,
    }),
  });
  const store = mockStore(state);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik
            initialValues={{ added: [], removed: [] }}
            onSubmit={jest.fn()}
          >
            <TagFormChanges {...commonProps} newTags={[]} tags={tags} />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );

  expect(screen.getByText(Label.NoTags)).toBeInTheDocument();
});
