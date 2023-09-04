import reduxToolkit from "@reduxjs/toolkit";
import { Formik } from "formik";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import { Label as TagFormChangesLabel } from "../TagFormChanges/TagFormChanges";

import TagFormFields, { Label } from "./TagFormFields";

import type { RootState } from "@/app/store/root/types";
import type { Tag, TagMeta } from "@/app/store/tag/types";
import {
  machine as machineFactory,
  machineState as machineStateFactory,
  rootState as rootStateFactory,
  tag as tagFactory,
  tagState as tagStateFactory,
} from "testing/factories";
import { tagStateListFactory } from "testing/factories/state";
import {
  userEvent,
  render,
  screen,
  waitFor,
  within,
  renderWithBrowserRouter,
} from "testing/utils";

const mockStore = configureStore();
let state: RootState;
let tags: Tag[];
const commonProps = {
  setSecondaryContent: jest.fn(),
  setNewTagName: jest.fn(),
  toggleTagDetails: jest.fn(),
};

beforeEach(() => {
  jest.spyOn(reduxToolkit, "nanoid").mockReturnValue("mocked-nanoid");
  tags = [
    tagFactory({ id: 1, name: "tag1" }),
    tagFactory({ id: 2, name: "tag2" }),
    tagFactory({ id: 3, name: "tag3" }),
  ];
  state = rootStateFactory({
    machine: machineStateFactory({
      items: [
        machineFactory({
          tags: [],
        }),
      ],
    }),
    tag: tagStateFactory({
      items: tags,
      lists: {
        "mocked-nanoid": tagStateListFactory({
          loaded: true,
          items: tags,
        }),
      },
    }),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("displays available tags in the dropdown", async () => {
  renderWithBrowserRouter(
    <Formik initialValues={{ added: [], removed: [] }} onSubmit={jest.fn()}>
      <TagFormFields
        {...commonProps}
        machines={[]}
        newTags={[]}
        selectedCount={state.machine.items.length}
        selectedMachines={{
          items: state.machine.items.map((item) => item.system_id),
        }}
        setNewTags={jest.fn()}
      />
    </Formik>,
    { state }
  );
  const changes = screen.getByRole("table", {
    name: TagFormChangesLabel.Table,
  });
  const tagRow = within(changes).getByRole("row", {
    name: "tag3",
  });
  // Set a tag to be removed.
  await userEvent.click(
    within(tagRow).getByRole("button", { name: TagFormChangesLabel.Remove })
  );
  // Open the tag selector dropdown.
  await userEvent.click(screen.getByRole("textbox", { name: Label.TagInput }));
  // Set a tag to be added.
  await userEvent.click(
    screen.getByRole("option", {
      name: "tag1",
    })
  );
  await userEvent.click(screen.getByRole("textbox", { name: Label.TagInput }));
  expect(screen.getAllByRole("option")).toHaveLength(1);
  await waitFor(() =>
    expect(screen.getByRole("option", { name: "tag2" })).toBeInTheDocument()
  );
});

it("displays the tags to be added", () => {
  renderWithBrowserRouter(
    <Formik
      initialValues={{ added: [tags[0].id, tags[2].id], removed: [] }}
      onSubmit={jest.fn()}
    >
      <TagFormFields
        {...commonProps}
        machines={[]}
        newTags={[]}
        selectedCount={state.machine.items.length}
        selectedMachines={{
          items: state.machine.items.map((item) => item.system_id),
        }}
        setNewTags={jest.fn()}
      />
    </Formik>,
    { state }
  );
  const changes = screen.getByRole("table", {
    name: TagFormChangesLabel.Table,
  });
  expect(
    within(changes).getByRole("button", { name: "tag1 (1/1)" })
  ).toBeInTheDocument();
  expect(
    within(changes).getByRole("button", { name: "tag3 (1/1)" })
  ).toBeInTheDocument();
});

it("updates the new tags after creating a tag", async () => {
  const machines = [machineFactory({ system_id: "abc123", tags: [1] })];
  const store = mockStore(state);
  const setNewTags = jest.fn();
  const Form = ({ tags }: { tags: Tag[TagMeta.PK][] }) => (
    <Provider store={store}>
      <MemoryRouter>
        <CompatRouter>
          <Formik
            initialValues={{ added: tags, removed: [] }}
            onSubmit={jest.fn()}
          >
            <TagFormFields
              {...commonProps}
              machines={state.machine.items}
              newTags={tags}
              selectedCount={state.machine.items.length}
              selectedMachines={{
                items: machines.map((item) => item.system_id),
              }}
              setNewTags={setNewTags}
              viewingDetails={false}
            />
          </Formik>
        </CompatRouter>
      </MemoryRouter>
    </Provider>
  );
  const { rerender } = render(<Form tags={[]} />);
  const changes = screen.getByRole("table", {
    name: TagFormChangesLabel.Table,
  });
  const newTag = tagFactory({ id: 8, name: "new-tag" });
  state.tag.saved = true;
  state.tag.items.push(newTag);
  expect(
    within(changes).queryByRole("button", { name: /new-tag/i })
  ).not.toBeInTheDocument();
  rerender(<Form tags={[newTag.id]} />);

  await waitFor(() =>
    expect(
      within(changes).getByRole("button", { name: /new-tag/i })
    ).toBeInTheDocument()
  );
});
