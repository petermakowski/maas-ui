import { useCallback, useEffect, useState } from "react";

import type { ValueOf } from "@canonical/react-components";
import { useDispatch, useSelector } from "react-redux";
import { useStorageState } from "react-storage-hooks";

import ErrorsNotification from "./ErrorsNotification";
import MachineListControls from "./MachineListControls";
import MachineListTable from "./MachineListTable";
import { DEFAULTS } from "./MachineListTable/constants";

import VaultNotification from "app/base/components/VaultNotification";
import { useWindowTitle } from "app/base/hooks";
import type { SetSearchFilter, SortDirection } from "app/base/types";
import { actions as controllerActions } from "app/store/controller";
import { actions as generalActions } from "app/store/general";
import { actions as machineActions } from "app/store/machine";
import machineSelectors from "app/store/machine/selectors";
import { FetchGroupKey } from "app/store/machine/types";
import { FilterMachines } from "app/store/machine/utils";
import { useFetchMachinesWithGroupingUpdates } from "app/store/machine/utils/hooks";

type Props = {
  headerFormOpen?: boolean;
  searchFilter: string;
  setSearchFilter: SetSearchFilter;
};

const DEFAULT_PAGE_SIZE = DEFAULTS.pageSize;

const MachineList = ({
  headerFormOpen,
  searchFilter,
  setSearchFilter,
}: Props): JSX.Element => {
  useWindowTitle("Machines");
  const dispatch = useDispatch();
  const errors = useSelector(machineSelectors.errors);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<FetchGroupKey | null>(
    DEFAULTS.sortKey
  );
  const [sortDirection, setSortDirection] = useState<
    ValueOf<typeof SortDirection>
  >(DEFAULTS.sortDirection);
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
  const [hiddenGroups, setHiddenGroups] = useStorageState<(string | null)[]>(
    localStorage,
    "hiddenGroups",
    []
  );
  const [storedPageSize, setStoredPageSize] = useStorageState<number>(
    localStorage,
    "machineListPageSize",
    DEFAULT_PAGE_SIZE
  );
  // fallback to default if the stored value is not valid
  const pageSize =
    storedPageSize && typeof storedPageSize === "number"
      ? storedPageSize
      : DEFAULT_PAGE_SIZE;

  const { callId, loading, machineCount, machines, machinesErrors, groups } =
    useFetchMachinesWithGroupingUpdates({
      collapsedGroups: hiddenGroups,
      filters: FilterMachines.parseFetchFilters(searchFilter),
      grouping,
      sortDirection,
      sortKey,
      pagination: { currentPage, setCurrentPage, pageSize },
    });

  useEffect(
    () => () => {
      // Clear machine selected state and clean up any machine errors etc.
      // when closing the list.
      dispatch(machineActions.setSelectedMachines(null));
      dispatch(machineActions.cleanup());
    },
    [dispatch]
  );

  // Fetch vault enabled status and controllers on page load
  useEffect(() => {
    dispatch(controllerActions.fetch());
    dispatch(generalActions.fetchVaultEnabled());
  }, [dispatch]);

  return (
    <>
      {errors && !headerFormOpen ? (
        <ErrorsNotification
          errors={errors}
          onAfterDismiss={() => dispatch(machineActions.cleanup())}
        />
      ) : null}
      {!headerFormOpen ? <ErrorsNotification errors={machinesErrors} /> : null}
      <VaultNotification />
      <MachineListControls
        filter={searchFilter}
        grouping={grouping}
        hiddenColumns={hiddenColumns}
        setFilter={handleSetSearchFilter}
        setGrouping={handleSetGrouping}
        setHiddenColumns={setHiddenColumns}
        setHiddenGroups={setHiddenGroups}
      />
      <MachineListTable
        callId={callId}
        currentPage={currentPage}
        filter={searchFilter}
        grouping={grouping}
        groups={groups}
        hiddenColumns={hiddenColumns}
        hiddenGroups={hiddenGroups}
        machineCount={machineCount}
        machines={machines}
        machinesLoading={loading}
        pageSize={pageSize}
        setCurrentPage={setCurrentPage}
        setHiddenGroups={setHiddenGroups}
        setPageSize={setStoredPageSize}
        setSortDirection={setSortDirection}
        setSortKey={setSortKey}
        sortDirection={sortDirection}
        sortKey={sortKey}
      />
    </>
  );
};

MachineList.whyDidYouRender = true;
export default MachineList;
