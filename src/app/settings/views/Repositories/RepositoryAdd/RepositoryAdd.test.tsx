import { MemoryRouter } from "react-router-dom";
import { CompatRouter, Route, Routes } from "react-router-dom-v5-compat";

import RepositoryAdd from "./RepositoryAdd";

import type { RootState } from "@/app/store/root/types";
import {
  componentsToDisableState as componentsToDisableStateFactory,
  generalState as generalStateFactory,
  knownArchitecturesState as knownArchitecturesStateFactory,
  packageRepository as packageRepositoryFactory,
  packageRepositoryState as packageRepositoryStateFactory,
  pocketsToDisableState as pocketsToDisableStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { renderWithMockStore, screen } from "testing/utils";

describe("RepositoryAdd", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory({
      general: generalStateFactory({
        componentsToDisable: componentsToDisableStateFactory({
          loaded: true,
        }),
        knownArchitectures: knownArchitecturesStateFactory({
          loaded: true,
        }),
        pocketsToDisable: pocketsToDisableStateFactory({
          loaded: true,
        }),
      }),
      packagerepository: packageRepositoryStateFactory({
        loaded: true,
        items: [packageRepositoryFactory()],
      }),
    });
  });

  it("can display a repository add form with type ppa", () => {
    renderWithMockStore(
      <MemoryRouter
        initialEntries={[
          { pathname: "/settings/repositories/add/ppa", key: "testKey" },
        ]}
      >
        <CompatRouter>
          <Routes>
            <Route
              element={<RepositoryAdd />}
              path="/settings/repositories/add/:type"
            />
          </Routes>
        </CompatRouter>
      </MemoryRouter>,
      { state }
    );

    expect(screen.getByRole("form", { name: "Add PPA" })).toBeInTheDocument();
  });

  it("can display a repository add form with type repository", () => {
    renderWithMockStore(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/settings/repositories/add/repository",
            key: "testKey",
          },
        ]}
      >
        <CompatRouter>
          <Routes>
            <Route
              element={<RepositoryAdd />}
              path="/settings/repositories/add/:type"
            />
          </Routes>
        </CompatRouter>
      </MemoryRouter>,
      { state }
    );
    expect(
      screen.getByRole("form", { name: "Add repository" })
    ).toBeInTheDocument();
  });
});
