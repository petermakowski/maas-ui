import { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { Redirect } from "react-router-dom";
import { Routes, Route } from "react-router-dom-v5-compat";

import ControllerCommissioning from "./ControllerCommissioning";
import ControllerConfiguration from "./ControllerConfiguration";
import ControllerDetailsHeader from "./ControllerDetailsHeader";
import ControllerLogs from "./ControllerLogs";
import ControllerNetwork from "./ControllerNetwork";
import ControllerPCIDevices from "./ControllerPCIDevices";
import ControllerStorage from "./ControllerStorage";
import ControllerSummary from "./ControllerSummary";
import ControllerUSBDevices from "./ControllerUSBDevices";
import ControllerVLANs from "./ControllerVLANs";

import { useSidePanel } from "app/base/app-context";
import MainContentSection from "app/base/components/MainContentSection";
import ModelNotFound from "app/base/components/ModelNotFound";
import NodeTestDetails from "app/base/components/node/NodeTestDetails";
import { useScrollToTop } from "app/base/hooks";
import { useGetURLId } from "app/base/hooks/urls";
import urls from "app/base/urls";
import { actions as controllerActions } from "app/store/controller";
import controllerSelectors from "app/store/controller/selectors";
import { ControllerMeta } from "app/store/controller/types";
import type { RootState } from "app/store/root/types";
import { getRelativeRoute, isId } from "app/utils";

const ControllerDetails = (): JSX.Element => {
  const dispatch = useDispatch();
  const id = useGetURLId(ControllerMeta.PK);
  const controller = useSelector((state: RootState) =>
    controllerSelectors.getById(state, id)
  );
  const controllersLoading = useSelector(controllerSelectors.loading);
  const { sidePanelContent, setSidePanelContent } = useSidePanel();
  console.warn("ControllerDetails", sidePanelContent);
  useScrollToTop();

  useEffect(() => {
    if (isId(id)) {
      // Set active controller on load to ensure all controller details are sent
      // through the websocket.
      dispatch(controllerActions.get(id));
      dispatch(controllerActions.setActive(id));
    }
    // Unset active controller and cleanup state on unmount.
    return () => {
      dispatch(controllerActions.setActive(null));
      dispatch(controllerActions.cleanup());
    };
  }, [dispatch, id]);

  if (!isId(id) || (!controllersLoading && !controller)) {
    return (
      <ModelNotFound
        id={id}
        linkURL={urls.controllers.index}
        modelName="controller"
      />
    );
  }

  const base = urls.controllers.controller.index(null);

  return (
    <MainContentSection
      header={
        <ControllerDetailsHeader
          setSidePanelContent={setSidePanelContent}
          sidePanelContent={sidePanelContent}
          systemId={id}
        />
      }
    >
      {controller && (
        <Routes>
          <Route
            element={
              <Redirect to={urls.controllers.controller.summary({ id })} />
            }
            index
          />
          <Route
            element={<ControllerSummary systemId={id} />}
            path={getRelativeRoute(
              urls.controllers.controller.summary(null),
              base
            )}
          />
          <Route
            element={<ControllerVLANs systemId={id} />}
            path={getRelativeRoute(
              urls.controllers.controller.vlans(null),
              base
            )}
          />
          <Route
            element={<ControllerNetwork systemId={id} />}
            path={getRelativeRoute(
              urls.controllers.controller.network(null),
              base
            )}
          />
          <Route
            element={<ControllerStorage systemId={id} />}
            path={getRelativeRoute(
              urls.controllers.controller.storage(null),
              base
            )}
          />
          <Route
            element={<ControllerPCIDevices systemId={id} />}
            path={getRelativeRoute(
              urls.controllers.controller.pciDevices(null),
              base
            )}
          />
          <Route
            element={<ControllerUSBDevices systemId={id} />}
            path={getRelativeRoute(
              urls.controllers.controller.usbDevices(null),
              base
            )}
          />
          <Route
            element={<ControllerCommissioning systemId={id} />}
            path={getRelativeRoute(
              urls.controllers.controller.commissioning.index(null),
              base
            )}
          />
          <Route
            element={
              <NodeTestDetails
                getReturnPath={(id) =>
                  urls.controllers.controller.commissioning.index({ id })
                }
              />
            }
            path={getRelativeRoute(
              urls.controllers.controller.commissioning.scriptResult(null),
              base
            )}
          />
          <Route
            element={<ControllerLogs systemId={id} />}
            path={getRelativeRoute(
              urls.controllers.controller.logs.index(null),
              base
            )}
          />
          <Route
            element={<ControllerLogs systemId={id} />}
            path={getRelativeRoute(
              urls.controllers.controller.logs.events(null),
              base
            )}
          />
          <Route
            element={<ControllerLogs systemId={id} />}
            path={getRelativeRoute(
              urls.controllers.controller.logs.installationOutput(null),
              base
            )}
          />
          <Route
            element={<ControllerConfiguration systemId={id} />}
            path={getRelativeRoute(
              urls.controllers.controller.configuration(null),
              base
            )}
          />
        </Routes>
      )}
    </MainContentSection>
  );
};

export default ControllerDetails;
