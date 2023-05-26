import { useCallback, useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useMatch } from "react-router-dom-v5-compat";

import MachineListControls from "../MachineListControls";

import MachinesHeader from "app/base/components/node/MachinesHeader";
import type { SetSearchFilter } from "app/base/types";
import urls from "app/base/urls";
import type {
  MachineSidePanelContent,
  MachineSetSidePanelContent,
} from "app/machines/types";
import { actions as machineActions } from "app/store/machine";
import machineSelectors from "app/store/machine/selectors";
import type { FetchGroupKey } from "app/store/machine/types";
import { FilterMachines, selectedToFilters } from "app/store/machine/utils";
import {
  useFetchMachineCount,
  useMachineSelectedCount,
} from "app/store/machine/utils/hooks";
import { actions as resourcePoolActions } from "app/store/resourcepool";
import resourcePoolSelectors from "app/store/resourcepool/selectors";

type Props = {
  grouping: FetchGroupKey | null;
  hiddenColumns?: string[];
  setGrouping: (group: FetchGroupKey | null) => void;
  setHiddenGroups: (groups: string[]) => void;
  setHiddenColumns: React.Dispatch<React.SetStateAction<string[]>>;
  sidePanelContent: MachineSidePanelContent | null;
  searchFilter: string;
  setSearchFilter: SetSearchFilter;
  setSidePanelContent: MachineSetSidePanelContent;
};

export const MachineListHeader = ({
  grouping,
  hiddenColumns = [],
  setGrouping,
  setHiddenGroups,
  setHiddenColumns,
  sidePanelContent,
  searchFilter,
  setSearchFilter,
  setSidePanelContent,
}: Props): JSX.Element => {
  const dispatch = useDispatch();
  const machinesPathMatch = useMatch(urls.machines.index);
  const filter = FilterMachines.parseFetchFilters(searchFilter);
  // Get the count of all machines
  const { machineCount: allMachineCount } = useFetchMachineCount();
  // Get the count of selected machines that match the current filter
  const { selectedCount, selectedCountLoading } =
    useMachineSelectedCount(filter);
  const selectedMachines = useSelector(machineSelectors.selectedMachines);

  // Clear the header when there are no selected machines
  useEffect(() => {
    if (!machinesPathMatch || selectedToFilters(selectedMachines) === null) {
      setSidePanelContent(null);
    }
  }, [machinesPathMatch, selectedMachines, setSidePanelContent]);

  useEffect(() => {
    dispatch(resourcePoolActions.fetch());
  }, [dispatch]);

  const resourcePoolsCount = useSelector(resourcePoolSelectors.count);

  const handleSetSearchFilter = useCallback(
    (filter: string) => {
      setSearchFilter(filter);
      // clear selected machines on filters change
      // we cannot reliably preserve the selected state for groups of machines
      // as we are only fetching information about a group from the back-end
      // and the contents of a group may change when different filters are applied
      dispatch(machineActions.setSelectedMachines(null));
    },
    [dispatch, setSearchFilter]
  );

  return (
    <MachinesHeader
      machineCount={allMachineCount}
      renderButtons={() => (
        <MachineListControls
          filter={searchFilter}
          grouping={grouping}
          hiddenColumns={hiddenColumns}
          machineCount={allMachineCount}
          resourcePoolsCount={resourcePoolsCount}
          setFilter={handleSetSearchFilter}
          setGrouping={setGrouping}
          setHiddenColumns={setHiddenColumns}
          setHiddenGroups={setHiddenGroups}
          setSidePanelContent={setSidePanelContent}
        />
      )}
      subtitleLoading={selectedCountLoading}
    />
  );
};

export default MachineListHeader;
