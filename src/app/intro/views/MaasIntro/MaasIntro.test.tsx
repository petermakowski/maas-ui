import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";
import configureStore from "redux-mock-store";

import { Labels as ConnectivityCardLabels } from "./ConnectivityCard/ConnectivityCard";
import MaasIntro, { Labels as MaasIntroLabels } from "./MaasIntro";
import { Labels as NameCardLabels } from "./NameCard/NameCard";

import { actions as configActions } from "@/app/store/config";
import { ConfigNames } from "@/app/store/config/types";
import { actions as repoActions } from "@/app/store/packagerepository";
import type { RootState } from "@/app/store/root/types";
import {
  authState as authStateFactory,
  config as configFactory,
  configState as configStateFactory,
  packageRepository as repoFactory,
  packageRepositoryState as repoStateFactory,
  rootState as rootStateFactory,
  user as userFactory,
  userState as userStateFactory,
} from "testing/factories";
import {
  renderWithBrowserRouter,
  renderWithMockStore,
  screen,
  userEvent,
} from "testing/utils";

const mockStore = configureStore<RootState, {}>();

describe("MaasIntro", () => {
  let state: RootState;
  const mainArchive = repoFactory({
    default: true,
    name: "main_archive",
    url: "http://www.mainarchive.com",
  });
  const portsArchive = repoFactory({
    default: true,
    name: "ports_archive",
    url: "http://www.portsarchive.com",
  });

  beforeEach(() => {
    state = rootStateFactory({
      config: configStateFactory({
        items: [
          configFactory({ name: ConfigNames.COMPLETED_INTRO, value: false }),
          configFactory({ name: ConfigNames.MAAS_NAME, value: "bionic-maas" }),
          configFactory({
            name: ConfigNames.HTTP_PROXY,
            value: "http://www.site.com",
          }),
          configFactory({ name: ConfigNames.UPSTREAM_DNS, value: "8.8.8.8" }),
        ],
      }),
      packagerepository: repoStateFactory({
        items: [mainArchive, portsArchive],
      }),
      user: userStateFactory({
        auth: authStateFactory({
          user: userFactory({ completed_intro: false, is_superuser: true }),
        }),
      }),
    });
  });

  it("displays a spinner when loading", () => {
    state.config.loading = true;
    state.user.auth.loading = true;
    renderWithBrowserRouter(<MaasIntro />, {
      route: "/intro",
      state,
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("can update just the config", async () => {
    const store = mockStore(state);
    renderWithMockStore(
      <MemoryRouter initialEntries={[{ pathname: "/intro", key: "testKey" }]}>
        <CompatRouter>
          <MaasIntro />
        </CompatRouter>
      </MemoryRouter>,
      { store }
    );
    const name = screen.getByRole("textbox", { name: NameCardLabels.Name });
    const proxy = screen.getByRole("textbox", {
      name: ConnectivityCardLabels.HttpProxy,
    });
    const upstream_dns = screen.getByRole("textbox", {
      name: ConnectivityCardLabels.UpstreamDns,
    });

    await userEvent.clear(name);
    await userEvent.clear(proxy);
    await userEvent.clear(upstream_dns);

    await userEvent.type(name, "my new maas");
    await userEvent.type(proxy, "http://www.newproxy.com");
    await userEvent.type(upstream_dns, "0.0.0.0");

    await userEvent.click(
      screen.getByRole("button", { name: MaasIntroLabels.SubmitLabel })
    );
    const updateConfigAction = configActions.update({
      http_proxy: "http://www.newproxy.com",
      maas_name: "my new maas",
      upstream_dns: "0.0.0.0",
    });
    const updateRepoAction = repoActions.update(mainArchive);
    expect(
      store
        .getActions()
        .find((action) => action.type === updateConfigAction.type)
    ).toStrictEqual(updateConfigAction);
    expect(
      store
        .getActions()
        .filter((action) => action.type === updateRepoAction.type).length
    ).toBe(0);
  });

  it("can dispatch actions to update the default package repository urls", async () => {
    const store = mockStore(state);
    renderWithMockStore(
      <MemoryRouter initialEntries={[{ pathname: "/intro", key: "testKey" }]}>
        <CompatRouter>
          <MaasIntro />
        </CompatRouter>
      </MemoryRouter>,
      { store }
    );
    const name = screen.getByRole("textbox", { name: NameCardLabels.Name });
    const proxy = screen.getByRole("textbox", {
      name: ConnectivityCardLabels.HttpProxy,
    });
    const upstreamDnsField = screen.getByRole("textbox", {
      name: ConnectivityCardLabels.UpstreamDns,
    });
    const mainArchiveField = screen.getByRole("textbox", {
      name: ConnectivityCardLabels.MainArchiveUrl,
    });
    const portsArchiveField = screen.getByRole("textbox", {
      name: ConnectivityCardLabels.PortsArchiveUrl,
    });

    await userEvent.clear(name);
    await userEvent.clear(proxy);
    await userEvent.clear(upstreamDnsField);
    await userEvent.clear(mainArchiveField);
    await userEvent.clear(portsArchiveField);

    await userEvent.type(name, "my new maas");
    await userEvent.type(proxy, "http://localhost:3000");
    await userEvent.type(upstreamDnsField, "0.0.0.0");
    await userEvent.type(mainArchiveField, "http://www.newmainarchive.com");
    await userEvent.type(portsArchiveField, "http://www.newportsarchive.com");

    await userEvent.click(
      screen.getByRole("button", { name: MaasIntroLabels.SubmitLabel })
    );

    const updateMainArchiveAction = repoActions.update({
      id: mainArchive.id,
      name: mainArchive.name,
      url: "http://www.newmainarchive.com",
    });
    const updatePortsArchiveAction = repoActions.update({
      id: portsArchive.id,
      name: portsArchive.name,
      url: "http://www.newportsarchive.com",
    });
    const updateRepoActions = store
      .getActions()
      .filter((action) => action.type === updateMainArchiveAction.type);

    expect(updateRepoActions.length).toBe(2);
    expect(updateRepoActions[0]).toStrictEqual(updateMainArchiveAction);
    expect(updateRepoActions[1]).toStrictEqual(updatePortsArchiveAction);
  });

  it("can skip the initial MAAS setup", async () => {
    const store = mockStore(state);
    renderWithMockStore(
      <MemoryRouter initialEntries={[{ pathname: "/intro", key: "testKey" }]}>
        <CompatRouter>
          <MaasIntro />
        </CompatRouter>
      </MemoryRouter>,
      { store }
    );
    expect(
      screen.queryByText(MaasIntroLabels.AreYouSure)
    ).not.toBeInTheDocument();

    // Open the skip confirmation.
    await userEvent.click(
      screen.getByRole("button", { name: MaasIntroLabels.SecondarySubmit })
    );

    expect(screen.getByText(MaasIntroLabels.AreYouSure)).toBeInTheDocument();

    // Confirm skipping MAAS setup.
    await userEvent.click(
      screen.getByRole("button", { name: MaasIntroLabels.SkipToUserSetup })
    );
    const expectedAction = configActions.update({
      completed_intro: true,
    });
    const actualAction = store
      .getActions()
      .find((action) => action.type === expectedAction.type);

    expect(actualAction).toStrictEqual(expectedAction);
  });
});
