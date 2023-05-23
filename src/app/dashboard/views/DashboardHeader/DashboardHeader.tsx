import { useEffect } from "react";

import { Button } from "@canonical/react-components";
import pluralize from "pluralize";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom-v5-compat";

import { DashboardSidePanelViews } from "../constants";

import ClearAllForm from "./ClearAllForm";

import { useSidePanel } from "app/base/app-context";
import SectionHeader from "app/base/components/SectionHeader";
import urls from "app/base/urls";
import { actions as discoveryActions } from "app/store/discovery";
import discoverySelectors from "app/store/discovery/selectors";

export enum Labels {
  ClearAll = "Clear all discoveries",
}

const DashboardHeader = (): JSX.Element => {
  const location = useLocation();
  const dispatch = useDispatch();
  const discoveries = useSelector(discoverySelectors.all);
  const { sidePanelContent, setSidePanelContent } = useSidePanel();

  useEffect(() => {
    dispatch(discoveryActions.fetch());
  }, [dispatch]);

  const buttons: JSX.Element[] = [
    <Button
      data-testid="clear-all"
      disabled={discoveries.length === 0}
      key="clear-all"
      onClick={() =>
        setSidePanelContent({
          view: DashboardSidePanelViews.CLEAR_ALL_DISCOVERIES,
        })
      }
    >
      {Labels.ClearAll}
    </Button>,
  ];
  let content: JSX.Element | null = null;

  if (
    sidePanelContent?.view === DashboardSidePanelViews.CLEAR_ALL_DISCOVERIES
  ) {
    content = (
      <ClearAllForm
        closeForm={() => {
          setSidePanelContent(null);
        }}
      />
    );
  }

  return (
    <SectionHeader
      buttons={buttons}
      sidePanelContent={content}
      sidePanelTitle={Labels.ClearAll}
      tabLinks={[
        {
          active: location.pathname === urls.dashboard.index,
          component: Link,
          label: pluralize("discovery", discoveries.length, true),
          to: urls.dashboard.index,
        },
        {
          active: location.pathname === urls.dashboard.configuration,
          component: Link,
          label: "Configuration",
          to: urls.dashboard.configuration,
        },
      ]}
      title="Network discovery"
    />
  );
};

export default DashboardHeader;
