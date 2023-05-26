import { useEffect } from "react";

import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";

import { useGetURLId } from "app/base/hooks/urls";
import { useSidePanel } from "app/base/side-panel-context";
import { getHeaderTitle } from "app/machines/utils";
import { actions as machineActions } from "app/store/machine";
import { MachineMeta } from "app/store/machine/types";
import { useFetchMachine } from "app/store/machine/utils/hooks";
import { actions as tagActions } from "app/store/tag";
import { isId } from "app/utils";

const MachineDetailsContainer = ({ children }): JSX.Element | null => {
  console.warn("Redner");
  const dispatch = useDispatch();
  const id = useGetURLId(MachineMeta.PK);
  const { pathname } = useLocation();
  const { machine, loaded: detailsLoaded } = useFetchMachine(id);
  const { sidePanelContent, setSidePanelContent } = useSidePanel();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (isId(id)) {
      // Set machine as active to ensure all machine data is sent from the server.
      dispatch(machineActions.setActive(id));
      dispatch(tagActions.fetch());
    }
    // Unset active machine on cleanup.
    return () => {
      dispatch(machineActions.setActive(null));
      // Clean up any machine errors etc. when closing the details.
      dispatch(machineActions.cleanup());
    };
  }, [dispatch, id]);

  console.log("details container");
  if (!machine) {
    return null;
  }

  return (
    <>
      {children({
        id,
        machine,
        detailsLoaded,
        sidePanelContent,
        sidePanelTitle: getHeaderTitle(machine.hostname, sidePanelContent),
      })}
    </>
  );
};

export default MachineDetailsContainer;
