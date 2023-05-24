import { useState } from "react";

import { useSelector } from "react-redux";
import { useLocation } from "react-router";
import { Link } from "react-router-dom-v5-compat";

import ControllerName from "./ControllerName";

import type { AppContextType } from "app/base/app-context";
import NodeActionMenu from "app/base/components/NodeActionMenu";
import SectionHeader from "app/base/components/SectionHeader";
import { useSendAnalytics } from "app/base/hooks";
import urls from "app/base/urls";
import ControllerHeaderForms from "app/controllers/components/ControllerHeaderForms";
import {
  ControllerDetailsTabLabels,
  ControllerHeaderViews,
} from "app/controllers/constants";
import { getHeaderTitle } from "app/controllers/utils";
import controllerSelectors from "app/store/controller/selectors";
import type { Controller } from "app/store/controller/types";
import { isControllerDetails } from "app/store/controller/utils";
import type { RootState } from "app/store/root/types";
import { getNodeActionTitle } from "app/store/utils";

type Props = AppContextType & {
  systemId: Controller["system_id"];
};

const ControllerDetailsHeader = ({
  systemId,
  sidePanelContent,
  setSidePanelContent,
}: Props): JSX.Element => {
  const controller = useSelector((state: RootState) =>
    controllerSelectors.getById(state, systemId)
  );
  const { pathname } = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const sendAnalytics = useSendAnalytics();
  console.log("ControllerDetailsHeader", sidePanelContent);

  if (!controller) {
    return <SectionHeader loading />;
  }

  return (
    <SectionHeader
      buttons={[
        <NodeActionMenu
          filterActions
          hasSelection={true}
          key="action-dropdown"
          nodeDisplay="controller"
          nodes={[controller]}
          onActionClick={(action) => {
            sendAnalytics(
              "Controller details action form",
              getNodeActionTitle(action),
              "Open"
            );
            const view = Object.values(ControllerHeaderViews).find(
              ([, actionName]) => actionName === action
            );
            if (view) {
              setSidePanelContent({ view });
            }
          }}
        />,
      ]}
      sidePanelContent={
        sidePanelContent ? (
          <ControllerHeaderForms
            controllers={[controller]}
            setSidePanelContent={setSidePanelContent}
            sidePanelContent={sidePanelContent}
            viewingDetails
          />
        ) : null
      }
      sidePanelTitle={getHeaderTitle("Controller", sidePanelContent)}
      subtitleLoading={!isControllerDetails(controller)}
      tabLinks={[
        {
          label: ControllerDetailsTabLabels.summary,
          url: urls.controllers.controller.summary({ id: systemId }),
        },
        {
          label: ControllerDetailsTabLabels.vlans,
          url: urls.controllers.controller.vlans({ id: systemId }),
        },
        {
          label: ControllerDetailsTabLabels.network,
          url: urls.controllers.controller.network({ id: systemId }),
        },
        {
          label: ControllerDetailsTabLabels.storage,
          url: urls.controllers.controller.storage({ id: systemId }),
        },
        {
          label: ControllerDetailsTabLabels.pciDevices,
          url: urls.controllers.controller.pciDevices({ id: systemId }),
        },
        {
          label: ControllerDetailsTabLabels.usbDevices,
          url: urls.controllers.controller.usbDevices({ id: systemId }),
        },
        {
          label: ControllerDetailsTabLabels.commissioning,
          url: urls.controllers.controller.commissioning.index({
            id: systemId,
          }),
        },
        {
          label: ControllerDetailsTabLabels.logs,
          url: urls.controllers.controller.logs.index({ id: systemId }),
        },
        {
          label: ControllerDetailsTabLabels.configuration,
          url: urls.controllers.controller.configuration({ id: systemId }),
        },
      ].map((link) => ({
        active: pathname.startsWith(link.url),
        component: Link,
        label: link.label,
        to: link.url,
      }))}
      title={
        <ControllerName
          id={controller.system_id}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      }
      titleElement={isEditing ? "div" : "h1"}
    />
  );
};

export default ControllerDetailsHeader;
