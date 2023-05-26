import { useCallback, useEffect, useState } from "react";

import type { ValueOf } from "@canonical/react-components";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom-v5-compat";

import AddController from "./AddController";
import ControllerActionFormWrapper from "./ControllerActionFormWrapper";

import { useWindowTitle } from "app/base/hooks";
import {
  useSidePanel,
  type SidePanelContextType,
} from "app/base/side-panel-context";
import { ControllerHeaderViews } from "app/controllers/constants";
import type { ControllerActionHeaderViews } from "app/controllers/constants";
import { actions as controllerActions } from "app/store/controller";
import controllerSelectors from "app/store/controller/selectors";
import type { Controller } from "app/store/controller/types";
import { FilterControllers } from "app/store/controller/utils";
import { actions as generalActions } from "app/store/general";
import { vaultEnabled as vaultEnabledSelectors } from "app/store/general/selectors";
import type { RootState } from "app/store/root/types";
import { actions as tagActions } from "app/store/tag";

type Props = SidePanelContextType & {
  controllers: Controller[];
  viewingDetails?: boolean;
};

// TODO: Rename to ControllerForms
const ControllerHeaderForms = (): JSX.Element | null => {
  const { sidePanelContent, setSidePanelContent } = useSidePanel();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentFilters = FilterControllers.queryStringToFilters(
    location.search
  );
  const [searchFilter, setFilter] = useState(
    // Initialise the filter state from the URL.
    FilterControllers.filtersToString(currentFilters)
  );
  const selectedIDs = useSelector(controllerSelectors.selectedIDs);

  const filteredControllers = useSelector((state: RootState) =>
    controllerSelectors.search(state, searchFilter || null, selectedIDs)
  );
  useWindowTitle("Controllers");

  useEffect(() => {
    dispatch(controllerActions.fetch());
    dispatch(tagActions.fetch());
    dispatch(generalActions.fetchVaultEnabled());
  }, [dispatch]);

  // Update the URL when filters are changed.
  const setSearchFilter = useCallback(
    (searchText) => {
      setFilter(searchText);
      const filters = FilterControllers.getCurrentFilters(searchText);
      navigate({ search: FilterControllers.filtersToQueryString(filters) });
    },
    [navigate, setFilter]
  );
  // TODO: read from route
  const viewingDetails = true;
  const clearSidePanelContent = useCallback(
    () => setSidePanelContent(null),
    [setSidePanelContent]
  );

  if (!sidePanelContent) {
    return null;
  }

  switch (sidePanelContent.view) {
    case ControllerHeaderViews.ADD_CONTROLLER:
      return <AddController clearSidePanelContent={clearSidePanelContent} />;
    default:
      // We need to explicitly cast sidePanelContent.view here - TypeScript doesn't
      // seem to be able to infer remaining object tuple values as with string
      // values.
      // https://github.com/canonical/maas-ui/issues/3040
      const { view } = sidePanelContent as {
        view: ValueOf<typeof ControllerActionHeaderViews>;
      };
      const [, action] = view;
      return (
        <ControllerActionFormWrapper
          action={action}
          clearSidePanelContent={clearSidePanelContent}
          controllers={filteredControllers}
          viewingDetails={viewingDetails}
        />
      );
  }
};

export default ControllerHeaderForms;
