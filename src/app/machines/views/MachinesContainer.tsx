import { useCallback, useState } from "react";

import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom-v5-compat";
import { useStorageState } from "react-storage-hooks";

import { getHeaderTitle } from "../utils";

import { DEFAULTS } from "./MachineList/MachineListTable/constants";

import { useSidePanel } from "app/base/side-panel-context";
import { actions as machineActions } from "app/store/machine";
import { FetchGroupKey } from "app/store/machine/types";
import { FilterMachines } from "app/store/machine/utils";

const MachinesContainer = ({
  children,
}: {
  children: (props) => React.ReactNode;
}): JSX.Element => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentFilters = FilterMachines.queryStringToFilters(location.search);
  // The filter state is initialised from the URL.
  const [searchFilter, setFilter] = useState(
    FilterMachines.filtersToString(currentFilters)
  );
  const { sidePanelContent, setSidePanelContent } = useSidePanel();

  const setSearchFilter = useCallback(
    (searchText) => {
      setFilter(searchText);
      const filters = FilterMachines.getCurrentFilters(searchText);
      navigate({ search: FilterMachines.filtersToQueryString(filters) });
    },
    [navigate, setFilter]
  );

  const [storedGrouping, setStoredGrouping] =
    useStorageState<FetchGroupKey | null>(
      localStorage,
      "grouping",
      DEFAULTS.grouping
    );
  // fallback to "None" if the stored grouping is not valid
  const grouping: FetchGroupKey =
    typeof storedGrouping === "string" &&
    Object.values(FetchGroupKey).includes(storedGrouping)
      ? storedGrouping
      : DEFAULTS.grouping;

  const [hiddenColumns, setHiddenColumns] = useStorageState<string[]>(
    localStorage,
    "machineListHiddenColumns",
    []
  );

  const handleSetGrouping = useCallback(
    (group: FetchGroupKey | null) => {
      setStoredGrouping(group);
      // clear selected machines on grouping change
      // we cannot reliably preserve the selected state for individual machines
      // as we are only fetching information about a group from the back-end
      dispatch(machineActions.setSelectedMachines(null));
    },
    [setStoredGrouping, dispatch]
  );
  console.log(sidePanelContent?.view);

  const [hiddenGroups, setHiddenGroups] = useStorageState<(string | null)[]>(
    localStorage,
    "hiddenGroups",
    []
  );

  const sidePanelTitle = getHeaderTitle("Machines", sidePanelContent);

  return (
    <>
      {children({
        hiddenGroups,
        grouping,
        hiddenColumns,
        searchFilter,
        handleSetGrouping,
        setHiddenColumns,
        setHiddenGroups,
        setSearchFilter,
        setSidePanelContent,
        sidePanelContent,
        sidePanelTitle,
      })}
    </>
  );
};

export default MachinesContainer;
