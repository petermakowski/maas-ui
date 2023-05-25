/* eslint-disable react/no-multi-comp */
import type { ReactNode } from "react";

import { Col, Row, useOnEscapePressed } from "@canonical/react-components";
import classNames from "classnames";

import {
  SidePanelContextType,
  useSidePanel,
} from "app/base/side-panel-context";
import ControllerHeaderForms from "app/controllers/components/ControllerHeaderForms";
import { ControllerHeaderViews } from "app/controllers/constants";
import type { ControllerSidePanelContent } from "app/controllers/types";
import { getHeaderTitle as getControllerHeaderTitle } from "app/controllers/utils";
import MachineHeaderForms from "app/machines/components/MachineHeaderForms";
import {
  MachineActionHeaderViews,
  MachineHeaderViews,
} from "app/machines/constants";
import { getHeaderTitle as getMachineHeaderTitle } from "app/machines/utils";
type Props = {
  title?: string | null;
  size?: "wide" | "default" | "narrow";
  content?: ReactNode;
};

const SidePanelContent = () => {
  const { sidePanelContent, setSidePanelContent } = useSidePanel();
  console.log(sidePanelContent);
  // controllers
  if (!sidePanelContent) {
    return null;
  }
  if (Object.values(ControllerHeaderViews).includes(sidePanelContent.view)) {
    // TODO: make TS infer this type
    return (
      <ControllerHeaderForms
        controllers={
          (sidePanelContent as ControllerSidePanelContent).extras?.controllers
        }
        setSidePanelContent={setSidePanelContent}
        sidePanelContent={sidePanelContent}
      />
    );
  }
  if (Object.values(MachineActionHeaderViews).includes(sidePanelContent.view)) {
    return (
      <MachineHeaderForms
        searchFilter={sidePanelContent.extras?.searchFilter}
        selectedCount={sidePanelContent.extras?.selectedCount}
        selectedCountLoading={sidePanelContent.extras?.selectedCountLoading}
        selectedMachines={sidePanelContent.extras?.selectedMachines}
        setSearchFilter={sidePanelContent.extras?.setSearchFilter}
        setSidePanelContent={setSidePanelContent}
        sidePanelContent={sidePanelContent}
      />
    );
  }
  return null;
};

const getSidePanelTitle = (sidePanelContent: SidePanelContent | null) => {
  if (Object.values(ControllerHeaderViews).includes(sidePanelContent.view)) {
    return getControllerHeaderTitle(
      sidePanelContent.extras?.controllers?.length > 1
        ? "Controllers"
        : "Controller",
      sidePanelContent
    );
  }
  if (Object.values(MachineHeaderViews).includes(sidePanelContent.view)) {
    getMachineHeaderTitle("Machines", sidePanelContent);
  }
  return null;
};

const AppSidePanel = ({ size }: Props): JSX.Element => {
  const { sidePanelContent, setSidePanelContent } = useSidePanel();
  const title = sidePanelContent ? getSidePanelTitle(sidePanelContent) : null;
  useOnEscapePressed(() => setSidePanelContent(null));

  return (
    <aside
      aria-label={title ?? undefined}
      className={classNames("l-aside", {
        "is-collapsed": !sidePanelContent?.view,
        "is-wide": size === "wide",
        "is-narrow": size === "narrow",
      })}
      data-testid="section-header-content"
      id="aside-panel"
    >
      <Row>
        <Col size={12}>
          {title ? (
            <div className="row section-header">
              <div className="col-12">
                <h3 className="section-header__title u-flex--no-shrink p-heading--4">
                  {title}
                </h3>
                <hr />
              </div>
            </div>
          ) : null}
          <SidePanelContent />
        </Col>
      </Row>
    </aside>
  );
};

export default AppSidePanel;
