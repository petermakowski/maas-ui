import type { HTMLProps, ReactNode } from "react";

import { Col } from "@canonical/react-components";
import classNames from "classnames";
import { useSelector } from "react-redux";
import { matchPath, useLocation } from "react-router-dom-v5-compat";

import AppSidePanel from "../AppSidePanel";
import NotificationList from "../NotificationList";
import SecondaryNavigation from "../SecondaryNavigation";

import type { AppSidePanelProps } from "app/base/components/AppSidePanel";
import { useThemeContext } from "app/base/theme-context";
import { preferencesNavItems } from "app/preferences/constants";
import { settingsNavItems } from "app/settings/constants";
import status from "app/store/status/selectors";

export type Props = {
  children?: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  sidePanelContent?: AppSidePanelProps["content"];
  sidePanelSize?: AppSidePanelProps["size"];
  sidePanelTitle?: AppSidePanelProps["title"];
} & HTMLProps<HTMLDivElement>;

const Page = ({
  children,
  header,
  sidebar,
  sidePanelContent,
  sidePanelTitle,
  ...props
}: Props): JSX.Element => {
  const { pathname } = useLocation();
  const authenticated = useSelector(status.authenticated);
  const connected = useSelector(status.connected);
  const hasSecondaryNav = isSettingsPage || isPreferencesPage;
  const isSecondaryNavVisible = hasSecondaryNav && authenticated && connected;
  const { theme } = useThemeContext();

  return (
    <>
      <main className="l-main">
        <SecondaryNavigation />
      </main>
      <AppSidePanel content={sidePanelContent} title={sidePanelTitle} />
    </>
  );
};

// TODO: move this to settings and preferences routers
const SecondaryNavigation = (): JSX.Element => {
  const connected = useSelector(status.connected);
  const hasSecondaryNav = isSettingsPage || isPreferencesPage;
  const isSecondaryNavVisible = hasSecondaryNav && authenticated && connected;

  const isSettingsPage = matchPath("settings/*", pathname);
  const isPreferencesPage = matchPath("account/prefs/*", pathname);

  return isSecondaryNavVisible ? (
    <div className={classNames("l-main__nav", `is-maas-${theme}--accent`)}>
      <SecondaryNavigation
        isOpen={!!isSecondaryNavVisible}
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
  ) : null;
};

const Main = ({ children }: React.PropsWithChildren) => {
  return <main className="l-main">{children}</main>;
};

const MainContent = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="l-main__content" id="main-content">
      <Col size={12}>
        <NotificationList />
        {children}
      </Col>
    </div>
  );
};

const MainHeader = ({ children }: React.PropsWithChildren) => {
  return (
    <header aria-label="main content" className="row">
      <Col size={12}>{children}</Col>
    </header>
  );
};

Main.Content = MainContent;
Main.Header = MainHeader;

export default Main;
