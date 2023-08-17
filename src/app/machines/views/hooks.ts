import { useCallback, useEffect, useState } from "react";

import { useDispatch } from "react-redux";
import { useStorageState } from "react-storage-hooks";

import { DEFAULTS } from "./MachineList/MachineListTable/constants";

import type { MachineColumnToggle } from "app/machines/constants";
import { actions as machineActions } from "app/store/machine/slice";
import { FetchGroupKey } from "app/store/machine/types";

const breakpoints: {
  max: number;
  hiddenColumns: MachineColumnToggle[];
}[] = [
  {
    max: 600,
    hiddenColumns: [
      "owner",
      "pool",
      "zone",
      "fabric",
      "cpu",
      "memory",
      "disks",
      "storage",
    ],
  },
  {
    max: 900,
    hiddenColumns: [
      "pool",
      "zone",
      "fabric",
      "cpu",
      "memory",
      "disks",
      "storage",
    ],
  },
  { max: 1030, hiddenColumns: ["pool", "zone", "fabric"] },
  { max: 1300, hiddenColumns: ["pool", "fabric"] },
  { max: Infinity, hiddenColumns: [] },
];

export const useResponsiveColumns = () => {
  const [responsiveHiddenColumns, setResponsiveHiddenColumns] = useState<
    string[]
  >([]);
  const [hiddenColumns, setHiddenColumns] = useStorageState<string[] | null>(
    localStorage,
    "machineListHiddenColumns",
    null
  );

  useEffect(() => {
    const breakpoint = breakpoints.find((b) => window.innerWidth <= b.max);
    // Set hidden columns on mount if haven't been previously set
    if (hiddenColumns === null) {
      setResponsiveHiddenColumns(breakpoint ? breakpoint.hiddenColumns : []);
    }
  }, []);

  useEffect(() => {
    const breakpoint = breakpoints.find((b) => window.innerWidth <= b.max);
    const updateColumns = () => {
      setResponsiveHiddenColumns(breakpoint ? breakpoint.hiddenColumns : []);
    };
    window.addEventListener("resize", updateColumns);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("resize", updateColumns);
    };
  }, []);

  const handleSetHiddenColumns = useCallback(
    (columns: string[]) => {
      setHiddenColumns(columns);
      setResponsiveHiddenColumns(columns);
    },
    [setHiddenColumns, setResponsiveHiddenColumns]
  );

  return [
    [...(hiddenColumns ?? []), ...responsiveHiddenColumns],
    handleSetHiddenColumns,
  ] as const;
};

export const useGrouping = (): [
  FetchGroupKey,
  (group: FetchGroupKey | null) => void
] => {
  const dispatch = useDispatch();
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

  const setGrouping = useCallback(
    (group: FetchGroupKey | null) => {
      setStoredGrouping(group);
      // clear selected machines on grouping change
      // we cannot reliably preserve the selected state for individual machines
      // as we are only fetching information about a group from the back-end
      dispatch(machineActions.setSelected(null));
    },
    [setStoredGrouping, dispatch]
  );

  return [grouping, setGrouping];
};

export const usePageSize = () => {
  const [storedPageSize, setPageSize] = useStorageState<number>(
    localStorage,
    "machineListPageSize",
    DEFAULTS.pageSize
  );
  // fallback to default if the stored value is not valid
  const pageSize =
    storedPageSize && typeof storedPageSize === "number"
      ? storedPageSize
      : DEFAULTS.pageSize;

  return [pageSize, setPageSize] as const;
};
