/* eslint-disable react/no-multi-comp */
import type { ReactNode } from "react";
import { useCallback, useRef, useMemo, memo, useEffect, useState } from "react";

import type { ValueOf } from "@canonical/react-components";
import { Button, MainTable } from "@canonical/react-components";
import type {
  MainTableCell,
  MainTableRow,
} from "@canonical/react-components/dist/components/MainTable/MainTable";
import type { ColumnDefResolved } from "@tanstack/react-table";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import classNames from "classnames";
import pluralize from "pluralize";
import { useDispatch, useSelector } from "react-redux";

import AllCheckbox from "./AllCheckbox";
import CoresColumn from "./CoresColumn";
import DisksColumn from "./DisksColumn";
import FabricColumn from "./FabricColumn";
import GroupCheckbox from "./GroupCheckbox";
import MachineListDisplayCount from "./MachineListDisplayCount";
import MachineListPagination from "./MachineListPagination";
import NameColumn from "./NameColumn";
import OwnerColumn from "./OwnerColumn";
import PageSizeSelect from "./PageSizeSelect";
import PoolColumn from "./PoolColumn";
import PowerColumn from "./PowerColumn";
import RamColumn from "./RamColumn";
import StatusColumn from "./StatusColumn";
import StorageColumn from "./StorageColumn";
import ZoneColumn from "./ZoneColumn";

import DoubleRow from "app/base/components/DoubleRow";
import Placeholder from "app/base/components/Placeholder";
import TableHeader from "app/base/components/TableHeader";
import { useSendAnalytics } from "app/base/hooks";
import { SortDirection } from "app/base/types";
import { columnLabels, columns, MachineColumns } from "app/machines/constants";
import { actions as generalActions } from "app/store/general";
import machineSelectors from "app/store/machine/selectors";
import { FetchGroupKey } from "app/store/machine/types";
import type {
  Machine,
  MachineMeta,
  MachineStateListGroup,
} from "app/store/machine/types";
import { FilterMachines } from "app/store/machine/utils";
import { actions as resourcePoolActions } from "app/store/resourcepool";
import { actions as tagActions } from "app/store/tag";
import { actions as userActions } from "app/store/user";
import { actions as zoneActions } from "app/store/zone";

export enum Label {
  HideGroup = "Hide",
  Loading = "Loading machines",
  Machines = "Machines",
  NoResults = "No machines match the search criteria.",
  ShowGroup = "Show",
}

type Props = {
  callId?: string | null;
  currentPage: number;
  filter?: string;
  grouping?: FetchGroupKey | null;
  groups: MachineStateListGroup[] | null;
  hiddenColumns?: string[];
  hiddenGroups?: (string | null)[];
  machineCount: number | null;
  machines: Machine[];
  machinesLoading?: boolean | null;
  pageSize: number;
  setCurrentPage: (currentPage: number) => void;
  setHiddenGroups?: (hiddenGroups: (string | null)[]) => void;
  setPageSize?: (pageSize: number) => void;
  showActions?: boolean;
  sortDirection: ValueOf<typeof SortDirection>;
  sortKey: FetchGroupKey | null;
  setSortDirection: (sortDirection: ValueOf<typeof SortDirection>) => void;
  setSortKey: (sortKey: FetchGroupKey | null) => void;
};

type TableColumn = MainTableCell & { key: string };

type GetToggleHandler = (
  eventLabel: string
) => (systemId: Machine[MachineMeta.PK], open: boolean) => void;

type GenerateRowParams = {
  callId?: string | null;
  activeRow: Machine[MachineMeta.PK] | null;
  groupValue: MachineStateListGroup["value"];
  hiddenColumns: NonNullable<Props["hiddenColumns"]>;
  machines: Machine[];
  getToggleHandler: GetToggleHandler;
  showActions: Props["showActions"];
  showMAC: boolean;
  showFullName: boolean;
};

type RowContent = {
  [MachineColumns.FQDN]: ReactNode;
  [MachineColumns.POWER]: ReactNode;
  [MachineColumns.STATUS]: ReactNode;
  [MachineColumns.OWNER]: ReactNode;
  [MachineColumns.POOL]: ReactNode;
  [MachineColumns.ZONE]: ReactNode;
  [MachineColumns.FABRIC]: ReactNode;
  [MachineColumns.CPU]: ReactNode;
  [MachineColumns.MEMORY]: ReactNode;
  [MachineColumns.DISKS]: ReactNode;
  [MachineColumns.STORAGE]: ReactNode;
};

/**
 * Filters columns by hiddenColumns.
 *
 * If showActions is true, the "fqdn" column will not be filtered as action checkboxes
 * share the "fqdn" column.
 * @param {Array} columns - headers or rows
 * @param {string[]} hiddenColumns - columns to hide, e.g. ["zone"]
 * @param {bool} showActions - whether actions and associated checkboxes are displayed
 */
const filterColumns = (
  columns: TableColumn[],
  hiddenColumns: NonNullable<Props["hiddenColumns"]>,
  showActions: Props["showActions"]
) => {
  if (hiddenColumns.length === 0) {
    return columns;
  }
  return columns.filter(
    (column) =>
      !hiddenColumns.includes(column.key) ||
      (column.key === "fqdn" && showActions)
  );
};

const generateRow = ({
  key,
  content,
  hiddenColumns,
  showActions,
  classes,
}: {
  key: string | number;
  content: RowContent;
  hiddenColumns: NonNullable<Props["hiddenColumns"]>;
  showActions: GenerateRowParams["showActions"];
  classes: string;
}) => {
  const columns = [
    {
      "aria-label": columnLabels[MachineColumns.FQDN],
      key: MachineColumns.FQDN,
      className: "fqdn-col",
      content: content[MachineColumns.FQDN],
    },
    {
      "aria-label": columnLabels[MachineColumns.POWER],
      key: MachineColumns.POWER,
      className: "power-col",
      content: content[MachineColumns.POWER],
    },
    {
      "aria-label": columnLabels[MachineColumns.STATUS],
      key: MachineColumns.STATUS,
      className: "status-col",
      content: content[MachineColumns.STATUS],
    },
    {
      "aria-label": columnLabels[MachineColumns.OWNER],
      key: MachineColumns.OWNER,
      className: "owner-col",
      content: content[MachineColumns.OWNER],
    },
    {
      "aria-label": columnLabels[MachineColumns.POOL],
      key: MachineColumns.POOL,
      className: "pool-col",
      content: content[MachineColumns.POOL],
    },
    {
      "aria-label": columnLabels[MachineColumns.ZONE],
      key: MachineColumns.ZONE,
      className: "zone-col",
      content: content[MachineColumns.ZONE],
    },
    {
      "aria-label": columnLabels[MachineColumns.FABRIC],
      key: MachineColumns.FABRIC,
      className: "fabric-col",
      content: content[MachineColumns.FABRIC],
    },
    {
      "aria-label": columnLabels[MachineColumns.CPU],
      key: MachineColumns.CPU,
      className: "cores-col",
      content: content[MachineColumns.CPU],
    },
    {
      "aria-label": columnLabels[MachineColumns.MEMORY],
      key: MachineColumns.MEMORY,
      className: "ram-col",
      content: content[MachineColumns.MEMORY],
    },
    {
      "aria-label": columnLabels[MachineColumns.DISKS],
      key: MachineColumns.DISKS,
      className: "disks-col",
      content: content[MachineColumns.DISKS],
    },
    {
      "aria-label": columnLabels[MachineColumns.STORAGE],
      key: MachineColumns.STORAGE,
      className: "storage-col",
      content: content[MachineColumns.STORAGE],
    },
  ];

  return {
    key,
    className: classNames(
      "machine-list__machine",
      {
        "truncated-border": showActions,
      },
      classes
    ),
    columns: filterColumns(columns, hiddenColumns, showActions),
  };
};

// const content = ({
//   showActions,
//   row,
//   machines,
//   callId,
//   groupValue,
//   getMenuHandler,
//   showMAC,
//   showFullName,
// }) => ({
//   [MachineColumns.FQDN]: (
//     <NameColumn
//       callId={callId}
//       data-testid="fqdn-column"
//       groupValue={groupValue}
//       machines={machines}
//       showActions={showActions}
//       showMAC={showMAC}
//       systemId={row.system_id}
//     />
//   ),
//   [MachineColumns.POWER]: (
//     <PowerColumn
//       data-testid="power-column"
//       onToggleMenu={getMenuHandler(MachineColumns.POWER)}
//       systemId={row.system_id}
//     />
//   ),
//   [MachineColumns.STATUS]: (
//     <StatusColumn
//       data-testid="status-column"
//       onToggleMenu={getMenuHandler(MachineColumns.STATUS)}
//       systemId={row.system_id}
//     />
//   ),
//   [MachineColumns.OWNER]: (
//     <OwnerColumn
//       data-testid="owner-column"
//       onToggleMenu={getMenuHandler(MachineColumns.OWNER)}
//       showFullName={showFullName}
//       systemId={row.system_id}
//     />
//   ),
//   [MachineColumns.POOL]: (
//     <PoolColumn
//       data-testid="pool-column"
//       onToggleMenu={getMenuHandler(MachineColumns.POOL)}
//       systemId={row.system_id}
//     />
//   ),
//   [MachineColumns.ZONE]: (
//     <ZoneColumn
//       data-testid="zone-column"
//       onToggleMenu={getMenuHandler(MachineColumns.ZONE)}
//       systemId={row.system_id}
//     />
//   ),
//   [MachineColumns.FABRIC]: (
//     <FabricColumn data-testid="fabric-column" systemId={row.system_id} />
//   ),
//   [MachineColumns.CPU]: (
//     <CoresColumn data-testid="cpu-column" systemId={row.system_id} />
//   ),
//   [MachineColumns.MEMORY]: (
//     <RamColumn data-testid="memory-column" systemId={row.system_id} />
//   ),
//   [MachineColumns.DISKS]: (
//     <DisksColumn data-testid="disks-column" systemId={row.system_id} />
//   ),
//   [MachineColumns.STORAGE]: (
//     <StorageColumn data-testid="storage-column" systemId={row.system_id} />
//   ),
// });

// const getColumns = [
//   {
//     "aria-label": columnLabels[MachineColumns.FQDN],
//     key: MachineColumns.FQDN,
//     className: "fqdn-col",
//     cell: ({ row }) => content({ row })[MachineColumns.FQDN],
//   },
//   {
//     "aria-label": columnLabels[MachineColumns.POWER],
//     key: MachineColumns.POWER,
//     className: "power-col",
//     cell: ({ row }) => content({ row })[MachineColumns.POWER],
//   },
//   {
//     "aria-label": columnLabels[MachineColumns.STATUS],
//     key: MachineColumns.STATUS,
//     className: "status-col",
//     cell: ({ row }) => content({ row })[MachineColumns.STATUS],
//   },
//   {
//     "aria-label": columnLabels[MachineColumns.OWNER],
//     key: MachineColumns.OWNER,
//     className: "owner-col",
//     cell: ({ row }) => content({ row })[MachineColumns.OWNER],
//   },
//   {
//     "aria-label": columnLabels[MachineColumns.POOL],
//     key: MachineColumns.POOL,
//     className: "pool-col",
//     cell: ({ row }) => content({ row })[MachineColumns.POOL],
//   },
//   {
//     "aria-label": columnLabels[MachineColumns.ZONE],
//     key: MachineColumns.ZONE,
//     className: "zone-col",
//     cell: ({ row }) => content({ row })[MachineColumns.ZONE],
//   },
//   {
//     "aria-label": columnLabels[MachineColumns.FABRIC],
//     key: MachineColumns.FABRIC,
//     className: "fabric-col",
//     cell: ({ row }) => content({ row })[MachineColumns.FABRIC],
//   },
//   {
//     "aria-label": columnLabels[MachineColumns.CPU],
//     key: MachineColumns.CPU,
//     className: "cores-col",
//     cell: ({ row }) => content({ row })[MachineColumns.CPU],
//   },
//   {
//     "aria-label": columnLabels[MachineColumns.MEMORY],
//     key: MachineColumns.MEMORY,
//     className: "ram-col",
//     cell: ({ row }) => content({ row })[MachineColumns.MEMORY],
//   },
//   {
//     "aria-label": columnLabels[MachineColumns.DISKS],
//     key: MachineColumns.DISKS,
//     className: "disks-col",
//     cell: ({ row }) => content({ row })[MachineColumns.DISKS],
//   },
//   {
//     "aria-label": columnLabels[MachineColumns.STORAGE],
//     key: MachineColumns.STORAGE,
//     className: "storage-col",
//     cell: ({ row }) => content({ row })[MachineColumns.STORAGE],
//   },
// ];

const generateSkeletonRows = (
  hiddenColumns: NonNullable<Props["hiddenColumns"]>,
  showActions: GenerateRowParams["showActions"]
) => {
  return Array.from(Array(5)).map((_, i) => {
    const content = {
      [MachineColumns.FQDN]: (
        <DoubleRow
          primary={<Placeholder>xxxxxxxxx.xxxx</Placeholder>}
          secondary={<Placeholder>xxx.xxx.xx.x</Placeholder>}
        />
      ),
      [MachineColumns.POWER]: (
        <DoubleRow
          primary={<Placeholder>Xxxxxxxxxxx</Placeholder>}
          secondary={<Placeholder>Xxxxxxx</Placeholder>}
        />
      ),
      [MachineColumns.STATUS]: (
        <DoubleRow primary={<Placeholder>XXXXX XXXXX</Placeholder>} />
      ),
      [MachineColumns.OWNER]: (
        <DoubleRow
          primary={<Placeholder>Xxxx</Placeholder>}
          secondary={<Placeholder>XXXX, XXX</Placeholder>}
        />
      ),
      [MachineColumns.POOL]: (
        <DoubleRow primary={<Placeholder>Xxxxx</Placeholder>} />
      ),
      [MachineColumns.ZONE]: (
        <DoubleRow
          primary={<Placeholder>Xxxxxxx</Placeholder>}
          secondary={<Placeholder>Xxxxxxx</Placeholder>}
        />
      ),
      [MachineColumns.FABRIC]: (
        <DoubleRow
          primary={<Placeholder>Xxxxxxx-X</Placeholder>}
          secondary={<Placeholder>Xxxxx</Placeholder>}
        />
      ),
      [MachineColumns.CPU]: (
        <DoubleRow
          primary={<Placeholder>XX</Placeholder>}
          primaryClassName="u-align--right"
          secondary={<Placeholder>xxxXX</Placeholder>}
          secondaryClassName="u-align--right"
        />
      ),
      [MachineColumns.MEMORY]: (
        <DoubleRow
          primary={<Placeholder>XX xxx</Placeholder>}
          primaryClassName="u-align--right"
        />
      ),
      [MachineColumns.DISKS]: (
        <DoubleRow
          primary={<Placeholder>XX</Placeholder>}
          primaryClassName="u-align--right"
        />
      ),
      [MachineColumns.STORAGE]: (
        <DoubleRow
          primary={<Placeholder>X.XX</Placeholder>}
          primaryClassName="u-align--right"
        />
      ),
    };
    return generateRow({
      key: i,
      content,
      hiddenColumns,
      showActions,
      classes: "machine-list__machine--inactive",
    });
  });
};
const generateRows = ({
  callId,
  activeRow,
  groupValue,
  hiddenColumns,
  machines,
  getToggleHandler,
  showActions,
  showMAC,
  showFullName,
}: GenerateRowParams) => {
  const getMenuHandler: GetToggleHandler = (...args) =>
    showActions ? getToggleHandler(...args) : () => undefined;

  return machines.map((row) => {
    const isActive = activeRow === row.system_id;

    const content = {
      [MachineColumns.FQDN]: (
        <NameColumn
          callId={callId}
          data-testid="fqdn-column"
          groupValue={groupValue}
          machines={machines}
          showActions={showActions}
          showMAC={showMAC}
          systemId={row.system_id}
        />
      ),
      [MachineColumns.POWER]: (
        <PowerColumn
          data-testid="power-column"
          onToggleMenu={getMenuHandler(MachineColumns.POWER)}
          systemId={row.system_id}
        />
      ),
      [MachineColumns.STATUS]: (
        <StatusColumn
          data-testid="status-column"
          onToggleMenu={getMenuHandler(MachineColumns.STATUS)}
          systemId={row.system_id}
        />
      ),
      [MachineColumns.OWNER]: (
        <OwnerColumn
          data-testid="owner-column"
          onToggleMenu={getMenuHandler(MachineColumns.OWNER)}
          showFullName={showFullName}
          systemId={row.system_id}
        />
      ),
      [MachineColumns.POOL]: (
        <PoolColumn
          data-testid="pool-column"
          onToggleMenu={getMenuHandler(MachineColumns.POOL)}
          systemId={row.system_id}
        />
      ),
      [MachineColumns.ZONE]: (
        <ZoneColumn
          data-testid="zone-column"
          onToggleMenu={getMenuHandler(MachineColumns.ZONE)}
          systemId={row.system_id}
        />
      ),
      [MachineColumns.FABRIC]: (
        <FabricColumn data-testid="fabric-column" systemId={row.system_id} />
      ),
      [MachineColumns.CPU]: (
        <CoresColumn data-testid="cpu-column" systemId={row.system_id} />
      ),
      [MachineColumns.MEMORY]: (
        <RamColumn data-testid="memory-column" systemId={row.system_id} />
      ),
      [MachineColumns.DISKS]: (
        <DisksColumn data-testid="disks-column" systemId={row.system_id} />
      ),
      [MachineColumns.STORAGE]: (
        <StorageColumn data-testid="storage-column" systemId={row.system_id} />
      ),
    };
    return generateRow({
      key: row.system_id,
      content,
      hiddenColumns,
      showActions,
      classes: classNames({
        "machine-list__machine--active": isActive,
      }),
    });
  });
};

export const MachineListTable = ({
  callId,
  currentPage,
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
}: Props): JSX.Element => {
  const dispatch = useDispatch();
  const sendAnalytics = useSendAnalytics();

  const currentSort = {
    direction: sortDirection,
    key: sortKey,
  };
  const updateSort = (newSortKey: Props["sortKey"]) => {
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

  const [showFullName, setShowFullName] = useState(false);
  const toggleHandler = useCallback(
    (columnName: string, systemId: Machine[MachineMeta.PK], open: boolean) => {
      // if (open && !activeRow) {
      //   sendAnalytics(
      //     "Machine list",
      //     "Inline actions open",
      //     `${columnName} column`
      //   );
      //   setActiveRow(systemId);
      // } else if (!open || (open && activeRow)) {
      //   sendAnalytics(
      //     "Machine list",
      //     "Inline actions close",
      //     `${columnName} column`
      //   );
      //   setActiveRow(null);
      // }
    },
    [sendAnalytics]
  );
  const getToggleHandler =
    (columnName: string) =>
    (systemId: Machine[MachineMeta.PK], open: boolean) =>
      toggleHandler(columnName, systemId, open);
  const getMenuHandler: GetToggleHandler = (...args) =>
    showActions ? getToggleHandler(...args) : () => undefined;
  const columns = useMemo<
    ColumnDefResolved<
      {
        systemId: Machine[MachineMeta.PK];
      }[]
    >[]
  >(
    () => [
      {
        id: "fqdn",
        accessorKey: "systemId",
        header: () => (
          <div className="u-flex">
            {showActions && (
              <AllCheckbox
                callId={callId}
                data-testid="all-machines-checkbox"
                filter={FilterMachines.parseFetchFilters(filter)}
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
        cell: ({ row }) => {
          return (
            <NameColumn
              callId={callId}
              data-testid="fqdn-column"
              groupValue={undefined}
              showActions={showActions}
              showMAC={showMAC}
              systemId={row.original.systemId}
            />
          );
        },
      },
      {
        id: "power",
        accessorKey: "systemId",
        // "aria-label": columnLabels[MachineColumns.POWER],
        header: () => (
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
        cell: ({ row }) => {
          return (
            <PowerColumn
              data-testid="power-column"
              onToggleMenu={getMenuHandler(MachineColumns.POWER)}
              systemId={row.original.systemId}
            />
          );
        },
      },
      {
        id: "status",
        accessorKey: "systemId",
        // "aria-label": columnLabels[MachineColumns.POWER],
        header: () => (
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
        cell: ({ row }) => {
          return (
            <StatusColumn
              data-testid="status-column"
              onToggleMenu={getMenuHandler(MachineColumns.STATUS)}
              systemId={row.original.systemId}
            />
          );
        },
      },
      {
        id: MachineColumns.OWNER,
        accessorKey: "systemId",
        // "aria-label": columnLabels[MachineColumns.POWER],
        //   "aria-label": columnLabels[MachineColumns.OWNER],
        // className: "owner-col",
        header: () => (
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
        cell: ({ row }) => {
          return (
            <OwnerColumn
              data-testid="owner-column"
              onToggleMenu={getMenuHandler(MachineColumns.OWNER)}
              showFullName={showFullName}
              systemId={row.original.systemId}
            />
          );
        },
      },
      {
        "aria-label": columnLabels[MachineColumns.POOL],
        id: MachineColumns.POOL,
        accessorKey: "systemId",
        className: "pool-col",
        header: () => (
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
        cell: ({ row }) => (
          <PoolColumn
            data-testid="pool-column"
            onToggleMenu={getMenuHandler(MachineColumns.POOL)}
            systemId={row.original.systemId}
          />
        ),
      },
      {
        "aria-label": columnLabels[MachineColumns.ZONE],
        id: MachineColumns.ZONE,
        accessorKey: "systemId",
        className: "zone-col",
        header: () => (
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
        cell: ({ row }) => (
          <ZoneColumn
            data-testid="zone-column"
            onToggleMenu={getMenuHandler(MachineColumns.ZONE)}
            systemId={row.original.systemId}
          />
        ),
      },
      {
        "aria-label": columnLabels[MachineColumns.FABRIC],
        id: MachineColumns.FABRIC,
        accessorKey: "systemId",
        className: "fabric-col",
        header: () => (
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
        cell: ({ row }) => (
          <FabricColumn
            data-testid="fabric-column"
            systemId={row.original.systemId}
          />
        ),
      },
      {
        "aria-label": columnLabels[MachineColumns.CPU],
        id: MachineColumns.CPU,
        accessorKey: "systemId",
        className: "cores-col u-align--right",
        header: () => (
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
        cell: ({ row }) => (
          <CoresColumn
            data-testid="cpu-column"
            systemId={row.original.systemId}
          />
        ),
      },
      {
        "aria-label": columnLabels[MachineColumns.MEMORY],
        id: MachineColumns.MEMORY,
        accessorKey: "systemId",
        className: "ram-col u-align--right",
        header: () => (
          <TableHeader
            currentSort={currentSort}
            data-testid="memory-header"
            onClick={() => updateSort(FetchGroupKey.Memory)}
            sortKey={FetchGroupKey.Memory}
          >
            {columnLabels[MachineColumns.MEMORY]}
          </TableHeader>
        ),
        cell: ({ row }) => (
          <RamColumn
            data-testid="memory-column"
            systemId={row.original.systemId}
          />
        ),
      },
      {
        "aria-label": columnLabels[MachineColumns.DISKS],
        id: MachineColumns.DISKS,
        accessorKey: "systemId",
        className: "disks-col u-align--right",
        header: () => (
          <TableHeader
            currentSort={currentSort}
            data-testid="disks-header"
            // TODO: enable sorting by "physical_disk_count" when the API supports it:
            // https://github.com/canonical/app-tribe/issues/1268
          >
            {columnLabels[MachineColumns.DISKS]}
          </TableHeader>
        ),
        cell: ({ row }) => (
          <DisksColumn
            data-testid="disks-column"
            systemId={row.original.systemId}
          />
        ),
      },
      {
        "aria-label": columnLabels[MachineColumns.STORAGE],
        id: MachineColumns.STORAGE,
        accessorKey: "systemId",
        className: "storage-col u-align--right",
        header: () => (
          <TableHeader
            currentSort={currentSort}
            data-testid="storage-header"
            // TODO: enable sorting by "storage" when the API supports it:
            // https://github.com/canonical/app-tribe/issues/1268
          >
            {columnLabels[MachineColumns.STORAGE]}
          </TableHeader>
        ),
        cell: ({ row }) => (
          <StorageColumn
            data-testid="storage-column"
            systemId={row.original.systemId}
          />
        ),
      },
    ],
    []
  );

  // const skeletonRows = useMemo(() => {
  //   const rows = [];
  //   for (let i = 0; i < pageSize; i++) {
  //     rows.push({
  //       className: "u-skeleton",
  //       columns: [
  //         {
  //           className: "u-align--center",
  //           content: "",
  //         },
  //       ],
  //     });
  //   }
  // }, [pageSize]);
  const it = groups?.[0]?.items;
  const data = useMemo(() => {
    return it?.map((item) => ({ systemId: item }));
  }, [it]);

  const table = useReactTable({
    data: data || [],
    columns,
    // state: {
    //   rowSelection,
    //   columnVisibility,
    // },
    // onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: false,
    // onRowSelectionChange: setRowSelection,
    enableColumnResizing: false,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });
  return (
    <>
      {machineCount ? (
        <div className="u-flex--between u-flex--align-end u-flex--wrap">
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
          <table aria-label="machines" className="machine-list">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th colSpan={header.colSpan} key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanResize() && (
                          <div
                            className={`resizer ${
                              header.column.getIsResizing() ? "isResizing" : ""
                            }`}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                          ></div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                return (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
};

export default MachineListTable;
