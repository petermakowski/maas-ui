import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Notification } from "@canonical/react-components";
import { usePrevious } from "@canonical/react-components/dist/hooks";
import * as Sentry from "@sentry/browser";
import classNames from "classnames";
import { useDispatch, useSelector } from "react-redux";
import { matchPath, useLocation } from "react-router-dom-v5-compat";

import packageInfo from "../../package.json";

import SidePanelRoutes from "./SidePanelRoutes";
import NavigationBanner from "./base/components/AppSideNavigation/NavigationBanner";
import AppSidePanel from "./base/components/AppSidePanel";
import SecondaryNavigation from "./base/components/SecondaryNavigation/SecondaryNavigation";
import ThemePreviewContext from "./base/theme-preview-context";
import { MAAS_UI_ID } from "./constants";
import { preferencesNavItems } from "./preferences/constants";
import { settingsNavItems } from "./settings/constants";
import { formatErrors } from "./utils";

import Routes from "app/Routes";
import AppSideNavigation from "app/base/components/AppSideNavigation";
import Footer from "app/base/components/Footer";
import Login from "app/base/components/Login";
import MainContentSection from "app/base/components/MainContentSection";
import SectionHeader from "app/base/components/SectionHeader";
import StatusBar from "app/base/components/StatusBar";
import FileContext, { fileContextStore } from "app/base/file-context";
import { actions as authActions } from "app/store/auth";
import authSelectors from "app/store/auth/selectors";
import { actions as configActions } from "app/store/config";
import configSelectors from "app/store/config/selectors";
import { actions as generalActions } from "app/store/general";
import { actions as statusActions } from "app/store/status";
import status from "app/store/status/selectors";

export enum VaultErrors {
  REQUEST_FAILED = "Vault request failed",
  CONNECTION_FAILED = "Vault connection failed",
}

export const App = (): JSX.Element => {
  const dispatch = useDispatch();
  const analyticsEnabled = useSelector(configSelectors.analyticsEnabled);
  const authenticated = useSelector(status.authenticated);
  const authenticating = useSelector(status.authenticating);
  const authenticationError = useSelector(status.authenticationError);
  const authLoading = useSelector(authSelectors.loading);
  const authLoaded = useSelector(authSelectors.loaded);
  const connected = useSelector(status.connected);
  const connecting = useSelector(status.connecting);
  const connectionError = useSelector(status.error);
  const maasTheme = useSelector(configSelectors.theme);
  const configLoading = useSelector(configSelectors.loading);
  const configErrors = useSelector(configSelectors.errors);
  const [theme, setTheme] = useState(maasTheme ? maasTheme : "default");
  const previousAuthenticated = usePrevious(authenticated, false);
  const { pathname } = useLocation();
  const isSettingsPage = matchPath("settings/*", pathname);
  const isPreferencesPage = matchPath("account/prefs/*", pathname);
  const isSideNavVisible = isSettingsPage || isPreferencesPage;

  useEffect(() => {
    dispatch(statusActions.checkAuthenticated());
  }, [dispatch]);

  useEffect(() => {
    // When a user logs out the redux store is reset so the authentication
    // info needs to be fetched again to know if external auth is being used.
    if (previousAuthenticated && !authenticated) {
      dispatch(statusActions.checkAuthenticated());
    }
  }, [authenticated, dispatch, previousAuthenticated]);

  useEffect(() => {
    if (authenticated) {
      // Connect the websocket before anything else in the app can be done.
      dispatch(statusActions.websocketConnect());
    }
  }, [dispatch, authenticated]);

  useEffect(() => {
    if (connected) {
      dispatch(authActions.fetch());
      dispatch(generalActions.fetchVersion());
      // Fetch the config at the top so we can access the MAAS name for the
      // window title.
      dispatch(configActions.fetch());
    }
  }, [dispatch, connected]);

  const isLoading =
    authLoading || connecting || authenticating || configLoading;
  const hasWebsocketError = !!connectionError || !connected;
  const hasAuthError = !authenticated && !connectionError;
  const hasVaultError =
    configErrors === VaultErrors.REQUEST_FAILED ||
    configErrors === VaultErrors.CONNECTION_FAILED;
  const isLoaded = connected && authLoaded && authenticated;

  let mainContent: ReactNode = null;
  if (isLoading) {
    mainContent = <MainContentSection header={<SectionHeader loading />} />;
  } else if (hasAuthError) {
    mainContent = (
      <MainContentSection>
        {authenticationError ? (
          authenticationError === "Session expired" ? (
            <Notification role="alert" severity="information">
              Your session has expired. Plese log in again to continue using
              MAAS.
            </Notification>
          ) : (
            <Notification role="alert" severity="negative" title="Error:">
              {formatErrors(authenticationError, "__all__")}
            </Notification>
          )
        ) : null}
        <Login />
      </MainContentSection>
    );
  } else if (hasWebsocketError || hasVaultError) {
    mainContent = (
      <MainContentSection header={<SectionHeader title="Failed to connect" />}>
        <Notification severity="negative" title="Error:">
          The server connection failed
          {hasVaultError || connectionError
            ? ` with the error "${
                hasVaultError ? configErrors : connectionError
              }"`
            : ""}
        </Notification>
      </MainContentSection>
    );
  } else if (isLoaded) {
    mainContent = (
      <FileContext.Provider value={fileContextStore}>
        <Routes />
      </FileContext.Provider>
    );
  }

  if (analyticsEnabled && process.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      release: packageInfo.version,
    });
  }

  return (
    <div className="l-application" id={MAAS_UI_ID}>
      <ThemePreviewContext.Provider value={{ theme, setTheme }}>
        {connected && authLoaded && authenticated ? (
          <AppSideNavigation />
        ) : (
          <header className="l-navigation-bar is-pinned">
            <div className="p-panel is-dark is-maas-default">
              <div className="p-panel__header">
                <NavigationBanner />
              </div>
            </div>
          </header>
        )}

        <main className="l-main">
          {isSideNavVisible ? (
            <div
              className={classNames("l-main__nav", {
                "is-open": isSideNavVisible,
              })}
            >
              <SecondaryNavigation
                isOpen={!!isSideNavVisible}
                items={
                  isSettingsPage
                    ? settingsNavItems
                    : isPreferencesPage
                    ? preferencesNavItems
                    : []
                }
                title={
                  isSettingsPage
                    ? "Settings"
                    : isPreferencesPage
                    ? "My preferences"
                    : ""
                }
              />
            </div>
          ) : null}
          <div className="l-main__content" id="main-content">
            {mainContent}
            <hr />
            <Footer />
          </div>
        </main>
        <SidePanelRoutes />
        <aside className="l-status">
          <StatusBar />
        </aside>
      </ThemePreviewContext.Provider>
    </div>
  );
};

export default App;
