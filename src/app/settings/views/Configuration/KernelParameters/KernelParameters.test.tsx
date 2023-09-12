import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import { Labels as KPFormLabels } from "../KernelParametersForm/KernelParametersForm";

import KernelParameters, {
  Labels as KernelParametersLabels,
} from "./KernelParameters";

import { ConfigNames } from "@/app/store/config/types";
import type { RootState } from "@/app/store/root/types";
import {
  configState as configStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { render, screen } from "testing/utils";

const mockStore = configureStore();

describe("KernelParameters", () => {
  let initialState: RootState;

  beforeEach(() => {
    initialState = rootStateFactory({
      config: configStateFactory({
        items: [
          {
            name: ConfigNames.KERNEL_OPTS,
            value: "foo",
          },
        ],
      }),
    });
  });

  it("displays a spinner if config is loading", () => {
    const state = { ...initialState };
    state.config.loading = true;
    const store = mockStore(state);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <CompatRouter>
            <KernelParameters />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByText(KernelParametersLabels.Loading)
    ).toBeInTheDocument();
  });

  it("displays the KernelParameters form if config is loaded", () => {
    const state = { ...initialState };
    state.config.loaded = true;
    const store = mockStore(state);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <CompatRouter>
            <KernelParameters />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByRole("form", { name: KPFormLabels.FormLabel })
    ).toBeInTheDocument();
  });

  it("dispatches action to fetch config if not already loaded", () => {
    const state = { ...initialState };
    state.config.loaded = false;
    const store = mockStore(state);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <CompatRouter>
            <KernelParameters />
          </CompatRouter>
        </MemoryRouter>
      </Provider>
    );

    const fetchActions = store
      .getActions()
      .filter((action) => action.type.endsWith("fetch"));

    expect(fetchActions).toEqual([
      {
        type: "config/fetch",
        meta: {
          model: "config",
          method: "list",
        },
        payload: null,
      },
    ]);
  });
});
