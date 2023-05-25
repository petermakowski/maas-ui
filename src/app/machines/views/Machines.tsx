import { useCallback, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom-v5-compat";
import { useStorageState } from "react-storage-hooks";

import MachineListHeader from "./MachineList/MachineListHeader";
import { DEFAULTS } from "./MachineList/MachineListTable/constants";

import MainContentSection from "app/base/components/MainContentSection";
import { useSidePanel } from "app/base/side-panel-context";
import MachineList from "app/machines/views/MachineList";
import { actions as machineActions } from "app/store/machine";
import machineSelectors from "app/store/machine/selectors";
import { FetchGroupKey } from "app/store/machine/types";
import { FilterMachines } from "app/store/machine/utils";
import { useMachineSelectedCount } from "app/store/machine/utils/hooks";

const Machines = (): JSX.Element => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const currentFilters = FilterMachines.queryStringToFilters(location.search);
  // The filter state is initialised from the URL.
  const [searchFilter, setFilter] = useState(
    FilterMachines.filtersToString(currentFilters)
  );
  const selectedMachines = useSelector(machineSelectors.selectedMachines);
  // searchFilter;
  // selectedCount;
  // selectedCountLoading;
  // selectedMachines;
  // setSearchFilter;

  const filter = FilterMachines.parseFetchFilters(searchFilter);
  // Get the count of selected machines that match the current filter
  const { selectedCount, selectedCountLoading } =
    useMachineSelectedCount(filter);
  const { sidePanelContent, setSidePanelContent } = useSidePanel("machines", {
    extras: {
      selectedMachines,
      selectedCount,
      searchFilter,
      selectedCountLoading,
      setSearchFilter: setFilter,
    },
  });

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

  const [hiddenGroups, setHiddenGroups] = useStorageState<(string | null)[]>(
    localStorage,
    "hiddenGroups",
    []
  );

  return (
    <MainContentSection
      header={
        <MachineListHeader
          grouping={grouping}
          hiddenColumns={hiddenColumns}
          searchFilter={searchFilter}
          setGrouping={handleSetGrouping}
          setHiddenColumns={setHiddenColumns}
          setHiddenGroups={setHiddenGroups}
          setSearchFilter={setSearchFilter}
          setSidePanelContent={setSidePanelContent}
        />
      }
    >
      <MachineList
        grouping={grouping}
        headerFormOpen={!!sidePanelContent}
        hiddenColumns={hiddenColumns}
        hiddenGroups={hiddenGroups}
        searchFilter={searchFilter}
        setHiddenGroups={setHiddenGroups}
      />
    </MainContentSection>
  );
};

export default Machines;
