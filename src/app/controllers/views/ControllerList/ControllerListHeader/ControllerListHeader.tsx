import { Button } from "@canonical/react-components";
import { useSelector } from "react-redux";

import ModelListSubtitle from "app/base/components/ModelListSubtitle";
import NodeActionMenu from "app/base/components/NodeActionMenu";
import SectionHeader from "app/base/components/SectionHeader";
import { useSendAnalytics } from "app/base/hooks";
import {
  useSidePanel,
  type SidePanelContextType,
} from "app/base/side-panel-context";
import type { SetSearchFilter } from "app/base/types";
import { ControllerHeaderViews } from "app/controllers/constants";
import controllerSelectors from "app/store/controller/selectors";
import { getNodeActionTitle } from "app/store/utils";

type Props = SidePanelContextType & {
  setSearchFilter: SetSearchFilter;
};

const ControllerListHeader = ({ setSearchFilter }: Props): JSX.Element => {
  const controllers = useSelector(controllerSelectors.all);
  const controllersLoaded = useSelector(controllerSelectors.loaded);
  const selectedControllers = useSelector(controllerSelectors.selected);
  const sendAnalytics = useSendAnalytics();

  // useSidePanelContent that can have a view and extras passed in
  // type could be inferred by the passed in view
  // this could potentially setup separate context for each side panel type
  const { setSidePanelContent } = useSidePanel("controller", {
    extras: { controllers: selectedControllers },
  });

  return (
    <SectionHeader
      buttons={[
        <Button
          data-testid="add-controller-button"
          disabled={selectedControllers.length > 0}
          onClick={() =>
            setSidePanelContent({ view: ControllerHeaderViews.ADD_CONTROLLER })
          }
        >
          Add rack controller
        </Button>,
        <NodeActionMenu
          filterActions
          hasSelection={selectedControllers.length > 0}
          nodeDisplay="controller"
          nodes={selectedControllers}
          onActionClick={(action) => {
            sendAnalytics(
              "Controller list action form",
              getNodeActionTitle(action),
              "Open"
            );
            const view = Object.values(ControllerHeaderViews).find(
              ([, actionName]) => actionName === action
            );
            if (view) {
              setSidePanelContent({
                view,
                extras: { controllers: selectedControllers },
              });
            }
          }}
          showCount
        />,
      ]}
      subtitle={
        <ModelListSubtitle
          available={controllers.length}
          filterSelected={() => setSearchFilter("in:(Selected)")}
          modelName="controller"
          selected={selectedControllers.length}
        />
      }
      subtitleLoading={!controllersLoaded}
      title="Controllers"
    />
  );
};

export default ControllerListHeader;
