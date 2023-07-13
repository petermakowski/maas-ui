import { useMemo, memo, useCallback, useEffect, useState } from "react";

import { MainTable } from "@canonical/react-components";
import classNames from "classnames";
import { useDispatch } from "react-redux";

import AllCheckbox from "./AllCheckbox";
import MachineListDisplayCount from "./MachineListDisplayCount";
import MachineListPagination from "./MachineListPagination";
import MachineListSelectedCount from "./MachineListSelectedCount/MachineListSelectedCount";
import PageSizeSelect from "./PageSizeSelect";
import {
  filterColumns,
  generateSkeletonRows,
  generateGroupRows,
} from "./tableModels";
import type { MachineListTableProps } from "./types";

import TableHeader from "app/base/components/TableHeader";
import { useSendAnalytics } from "app/base/hooks";
import { SortDirection } from "app/base/types";
import { columnLabels, columns, MachineColumns } from "app/machines/constants";
import { actions as generalActions } from "app/store/general";
import { FetchGroupKey } from "app/store/machine/types";
import { FilterMachines } from "app/store/machine/utils";
import { useMachineSelectedCount } from "app/store/machine/utils/hooks";
import { actions as resourcePoolActions } from "app/store/resourcepool";
import { actions as tagActions } from "app/store/tag";
import { actions as userActions } from "app/store/user";
import { actions as zoneActions } from "app/store/zone";

export enum Label {
  Loading = "Loading machines",
  Machines = "Machines",
  NoResults = "No machines match the search criteria.",
}

export const MachineListTable = ({
  callId,
  currentPage,
  totalPages,
  filter = "",
  groups,
  grouping,
  hiddenColumns = [],
  hiddenGroups = [],
  machineCount,
  machines,
  machinesLoading,
  pageSize,
  setCurrentPage,
  setHiddenGroups,
  setPageSize,
  showActions = true,
  sortDirection,
  sortKey,
  setSortDirection,
  setSortKey,
  ...props
}: MachineListTableProps): JSX.Element => {
  const dispatch = useDispatch();
  const sendAnalytics = useSendAnalytics();
  const { selectedCount } = useMachineSelectedCount();

  const currentSort = {
    direction: sortDirection,
    key: sortKey,
  };
  const updateSort = (newSortKey: MachineListTableProps["sortKey"]) => {
    if (newSortKey === sortKey) {
      if (sortDirection === SortDirection.ASCENDING) {
        setSortKey(null);
        setSortDirection(SortDirection.NONE);
      } else {
        setSortDirection(SortDirection.ASCENDING);
      }
    } else {
      setSortKey(newSortKey);
      setSortDirection(SortDirection.DESCENDING);
    }
  };
  const [showMAC, setShowMAC] = useState(false);
  const [showFullName, setShowFullName] = useState(false);
  useEffect(() => {
    dispatch(generalActions.fetchArchitectures());
    dispatch(generalActions.fetchDefaultMinHweKernel());
    dispatch(generalActions.fetchHweKernels());
    dispatch(generalActions.fetchMachineActions());
    dispatch(generalActions.fetchOsInfo());
    dispatch(generalActions.fetchPowerTypes());
    dispatch(generalActions.fetchVersion());
    dispatch(resourcePoolActions.fetch());
    dispatch(tagActions.fetch());
    dispatch(userActions.fetch());
    dispatch(zoneActions.fetch());
  }, [dispatch]);

  const toggleHandler = useCallback(
    (columnName: string, open: boolean) => {
      if (open) {
        sendAnalytics(
          "Machine list",
          "Inline actions open",
          `${columnName} column`
        );
      } else if (!open) {
        sendAnalytics(
          "Machine list",
          "Inline actions close",
          `${columnName} column`
        );
      }
    },
    [sendAnalytics]
  );
  const getToggleHandler = (columnName: string) => (open: boolean) =>
    toggleHandler(columnName, open);

  const rowProps = {
    callId,
    getToggleHandler,
    showActions,
    showMAC,
    showFullName,
  };

  const parsedFilter = useMemo(
    () => FilterMachines.parseFetchFilters(filter),
    [filter]
  );

  const headers = [
    {
      "aria-label": columnLabels[MachineColumns.FQDN],
      key: MachineColumns.FQDN,
      className: "fqdn-col",
      content: (
        <div className="u-flex">
          {showActions && (
            <AllCheckbox
              callId={callId}
              data-testid="all-machines-checkbox"
              filter={parsedFilter}
            />
          )}
          <div>
            <TableHeader
              currentSort={currentSort}
              data-testid="fqdn-header"
              // TODO: change this to "fqdn" when the API supports it:
              // https://github.com/canonical/app-tribe/issues/1268
              onClick={() => {
                setShowMAC(false);
                updateSort(FetchGroupKey.Hostname);
              }}
              sortKey={FetchGroupKey.Hostname}
            >
              {columnLabels[MachineColumns.FQDN]}
            </TableHeader>
            &nbsp;<strong>|</strong>&nbsp;
            <TableHeader
              currentSort={currentSort}
              data-testid="mac-header"
              // TODO: enable sorting by "pxe_mac" when the API supports it:
              // https://github.com/canonical/app-tribe/issues/1268
              onClick={() => {
                setShowMAC(true);
              }}
            >
              MAC
            </TableHeader>
            <TableHeader>IP</TableHeader>
          </div>
        </div>
      ),
    },
    {
      "aria-label": columnLabels[MachineColumns.POWER],
      key: MachineColumns.POWER,
      className: "power-col",
      content: (
        <TableHeader
          className="p-double-row__header-spacer"
          currentSort={currentSort}
          data-testid="power-header"
          onClick={() => updateSort(FetchGroupKey.PowerState)}
          sortKey={FetchGroupKey.PowerState}
        >
          {columnLabels[MachineColumns.POWER]}
        </TableHeader>
      ),
    },
    {
      "aria-label": columnLabels[MachineColumns.STATUS],
      key: MachineColumns.STATUS,
      className: "status-col",
      content: (
        <TableHeader
          className="p-double-row__header-spacer"
          currentSort={currentSort}
          data-testid="status-header"
          onClick={() => updateSort(FetchGroupKey.Status)}
          sortKey={FetchGroupKey.Status}
        >
          {columnLabels[MachineColumns.STATUS]}
        </TableHeader>
      ),
    },
    {
      "aria-label": columnLabels[MachineColumns.OWNER],
      key: MachineColumns.OWNER,
      className: "owner-col",
      content: (
        <>
          <TableHeader
            currentSort={currentSort}
            data-testid="owner-header"
            onClick={() => {
              setShowFullName(false);
              updateSort(FetchGroupKey.Owner);
            }}
            sortKey={FetchGroupKey.Owner}
          >
            {columnLabels[MachineColumns.OWNER]}
          </TableHeader>
          &nbsp;<strong>|</strong>&nbsp;
          <TableHeader
            currentSort={currentSort}
            data-testid="owner-name-header"
            onClick={() => {
              sendAnalytics(
                "Machine list",
                "Column header",
                "Show owner full name"
              );
              setShowFullName(true);
            }}
          >
            Name
          </TableHeader>
          <TableHeader>Tags</TableHeader>
        </>
      ),
    },
    {
      "aria-label": columnLabels[MachineColumns.POOL],
      key: MachineColumns.POOL,
      className: "pool-col",
      content: (
        <>
          <TableHeader
            currentSort={currentSort}
            data-testid="pool-header"
            onClick={() => updateSort(FetchGroupKey.Pool)}
            sortKey={FetchGroupKey.Pool}
          >
            {columnLabels[MachineColumns.POOL]}
          </TableHeader>
          <TableHeader>Note</TableHeader>
        </>
      ),
    },
    {
      "aria-label": columnLabels[MachineColumns.ZONE],
      key: MachineColumns.ZONE,
      className: "zone-col",
      content: (
        <>
          <TableHeader
            currentSort={currentSort}
            data-testid="zone-header"
            onClick={() => updateSort(FetchGroupKey.Zone)}
            sortKey={FetchGroupKey.Zone}
          >
            {columnLabels[MachineColumns.ZONE]}
          </TableHeader>
          <TableHeader>Spaces</TableHeader>
        </>
      ),
    },
    {
      "aria-label": columnLabels[MachineColumns.FABRIC],
      key: MachineColumns.FABRIC,
      className: "fabric-col",
      content: (
        <>
          <TableHeader
            currentSort={currentSort}
            data-testid="fabric-header"
            // TODO: enable sorting by "fabric" when the API supports it:
            // https://github.com/canonical/app-tribe/issues/1268
          >
            {columnLabels[MachineColumns.FABRIC]}
          </TableHeader>
          <TableHeader>VLAN</TableHeader>
        </>
      ),
    },
    {
      "aria-label": columnLabels[MachineColumns.CPU],
      key: MachineColumns.CPU,
      className: "cores-col u-align--right",
      content: (
        <>
          <TableHeader
            currentSort={currentSort}
            data-testid="cores-header"
            onClick={() => updateSort(FetchGroupKey.CpuCount)}
            sortKey={FetchGroupKey.CpuCount}
          >
            {columnLabels[MachineColumns.CPU]}
          </TableHeader>
          <TableHeader>Arch</TableHeader>
        </>
      ),
    },
    {
      "aria-label": columnLabels[MachineColumns.MEMORY],
      key: MachineColumns.MEMORY,
      className: "ram-col u-align--right",
      content: (
        <TableHeader
          currentSort={currentSort}
          data-testid="memory-header"
          onClick={() => updateSort(FetchGroupKey.Memory)}
          sortKey={FetchGroupKey.Memory}
        >
          {columnLabels[MachineColumns.MEMORY]}
        </TableHeader>
      ),
    },
    {
      "aria-label": columnLabels[MachineColumns.DISKS],
      key: MachineColumns.DISKS,
      className: "disks-col u-align--right",
      content: (
        <TableHeader
          currentSort={currentSort}
          data-testid="disks-header"
          // TODO: enable sorting by "physical_disk_count" when the API supports it:
          // https://github.com/canonical/app-tribe/issues/1268
        >
          {columnLabels[MachineColumns.DISKS]}
        </TableHeader>
      ),
    },
    {
      "aria-label": columnLabels[MachineColumns.STORAGE],
      key: MachineColumns.STORAGE,
      className: "storage-col u-align--right",
      content: (
        <TableHeader
          currentSort={currentSort}
          data-testid="storage-header"
          // TODO: enable sorting by "storage" when the API supports it:
          // https://github.com/canonical/app-tribe/issues/1268
        >
          {columnLabels[MachineColumns.STORAGE]}
        </TableHeader>
      ),
    },
  ];

  const rows = generateGroupRows({
    grouping,
    groups,
    hiddenGroups,
    machines,
    setHiddenGroups,
    hiddenColumns,
    filter: parsedFilter,
    ...rowProps,
  });

  const skeletonRows = useMemo(
    () => generateSkeletonRows(hiddenColumns, showActions),
    [hiddenColumns, showActions]
  );

  const selectionState = useMemo(() => {
    if (selectedCount > 0) {
      return [
        {
          className: "select-notification",
          key: "select-info",
          columns: [
            {
              colSpan: columns.length - hiddenColumns.length,
              content: (
                <MachineListSelectedCount
                  filter={filter}
                  machineCount={machineCount}
                  selectedCount={selectedCount}
                />
              ),
            },
          ],
        },
      ];
    } else {
      return [];
    }
  }, [filter, hiddenColumns.length, machineCount, selectedCount]);

  const machineRows = useMemo(
    () => [...selectionState, ...rows],
    [rows, selectionState]
  );

  return (
    <>
      {machineCount ? (
        <div className="u-flex--between u-flex--align-baseline u-flex--wrap">
          <hr />
          <MachineListDisplayCount
            currentPage={currentPage}
            machineCount={machineCount}
            pageSize={pageSize}
          />
          <span className="u-flex--end">
            <MachineListPagination
              currentPage={currentPage}
              itemsPerPage={pageSize}
              machineCount={machineCount}
              machinesLoading={machinesLoading}
              paginate={setCurrentPage}
              totalPages={totalPages}
            />
            {setPageSize ? (
              <PageSizeSelect
                pageSize={pageSize}
                paginate={setCurrentPage}
                setPageSize={setPageSize}
              />
            ) : null}
          </span>
          <hr />
        </div>
      ) : null}
      <MainTable
        aria-label={machinesLoading ? Label.Loading : Label.Machines}
        className={classNames("p-table-expanding--light", "machine-list", {
          "machine-list--grouped": grouping,
          "machine-list--loading": machinesLoading,
        })}
        emptyStateMsg={!machinesLoading && filter ? Label.NoResults : null}
        headers={filterColumns(headers, hiddenColumns, showActions)}
        rows={machinesLoading ? skeletonRows : machineRows}
        {...props}
      />
    </>
  );
};

export default memo(MachineListTable);
