import { useEffect, useState } from "react";

import { MainTable } from "@canonical/react-components";
import type { MainTableRow } from "@canonical/react-components/dist/components/MainTable/MainTable";
import { useDispatch } from "react-redux";

import AddLogicalVolume from "./AddLogicalVolume";
import AddPartition from "./AddPartition";
import BulkActions from "./BulkActions";
import CreateBcache from "./CreateBcache";
import EditDisk from "./EditDisk";
import EditPartition from "./EditPartition";
import StorageDeviceActions from "./StorageDeviceActions";

import DoubleRow from "@/app/base/components/DoubleRow";
import GroupCheckbox from "@/app/base/components/GroupCheckbox";
import RowCheckbox from "@/app/base/components/RowCheckbox";
import TagLinks from "@/app/base/components/TagLinks";
import ActionConfirm from "@/app/base/components/node/ActionConfirm";
import DiskBootStatus from "@/app/base/components/node/DiskBootStatus";
import DiskNumaNodes from "@/app/base/components/node/DiskNumaNodes";
import DiskTestStatus from "@/app/base/components/node/DiskTestStatus";
import urls from "@/app/base/urls";
import type { ControllerDetails } from "@/app/store/controller/types";
import { FilterControllers } from "@/app/store/controller/utils";
import { actions as machineActions } from "@/app/store/machine";
import type { MachineDetails } from "@/app/store/machine/types";
import { FilterMachines } from "@/app/store/machine/utils";
import type { Disk, Node, Partition } from "@/app/store/types/node";
import {
  diskAvailable,
  formatSize,
  formatType,
  getDiskById,
  getPartitionById,
  isDatastore,
  isDisk,
  isPartition,
  nodeIsMachine,
  partitionAvailable,
} from "@/app/store/utils";

// Actions that are performed on multiple devices at once
export enum BulkAction {
  CREATE_DATASTORE = "createDatastore",
  CREATE_RAID = "createRaid",
  CREATE_VOLUME_GROUP = "createVolumeGroup",
  UPDATE_DATASTORE = "updateDatastore",
}

// Actions that are performed on a single device
export enum StorageDeviceAction {
  CREATE_BCACHE = "createBcache",
  CREATE_CACHE_SET = "createCacheSet",
  CREATE_LOGICAL_VOLUME = "createLogicalVolume",
  CREATE_PARTITION = "createPartition",
  DELETE_DISK = "deleteDisk",
  DELETE_PARTITION = "deletePartition",
  DELETE_VOLUME_GROUP = "deleteVolumeGroup",
  EDIT_DISK = "editDisk",
  EDIT_PARTITION = "editPartition",
  SET_BOOT_DISK = "setBootDisk",
}

type Expanded = {
  content: StorageDeviceAction;
  id: string;
};

type Props = {
  canEditStorage: boolean;
  node: ControllerDetails | MachineDetails;
};

/**
 * Generate a unique ID for a disk or partition. Since both disks and partitions
 * are used in the table it's possible for the id number alone to be non-unique.
 * @param storageDevice - the disk or partition to create a unique ID for.
 * @returns unique ID for the disk or partition
 */
export const uniqueId = (storageDevice: Disk | Partition): string =>
  `${storageDevice.type}-${storageDevice.id}`;

/**
 * Returns whether a storage device is available.
 * @param storageDevice - the disk or partition to check.
 * @returns whether a storage device is available.
 */
const isAvailable = (storageDevice: Disk | Partition) => {
  if (isDatastore(storageDevice.filesystem)) {
    return false;
  }

  if (isDisk(storageDevice)) {
    return diskAvailable(storageDevice);
  }
  return partitionAvailable(storageDevice);
};

/**
 * Returns whether a storage device is currently in selected state.
 * @param storageDevice - the disk or partition to check.
 * @param selected - list of currently selected storage devices.
 * @returns whether a storage device is selected.
 */
const isSelected = (
  storageDevice: Disk | Partition,
  selected: (Disk | Partition)[]
) =>
  selected.some(
    (item) => item.id === storageDevice.id && item.type === storageDevice.type
  );

/**
 * Normalise rendered row data so that both disks and partitions can be displayed.
 * @param systemId - the system_id of the machine
 * @param storageDevice - the disk or partition to normalise.
 * @param actionsDisabled - whether actions should be disabled.
 * @param expanded - the currently expanded row and content.
 * @param setExpanded - function to set the expanded table row and content.
 * @param selected - the currently selected storage devices.
 * @param handleRowCheckbox - row checkbox handler function.
 * @returns normalised row data
 */
const normaliseRowData = (
  systemId: Node["system_id"],
  isMachine: boolean,
  storageDevice: Disk | Partition,
  actionsDisabled: boolean,
  expanded: Expanded | null,
  setExpanded: (expanded: Expanded | null) => void,
  selected: (Disk | Partition)[],
  handleRowCheckbox: (storageDevice: Disk | Partition) => void
) => {
  const rowId = uniqueId(storageDevice);
  const isExpanded = expanded?.id === rowId && Boolean(expanded?.content);

  return {
    className: isExpanded ? "p-table__row is-active" : null,
    columns: [
      {
        "aria-label": "Name & Serial",
        content: (
          <DoubleRow
            primary={
              isMachine ? (
                <RowCheckbox
                  checkSelected={isSelected}
                  data-testid={`checkbox-${rowId}`}
                  disabled={actionsDisabled}
                  handleRowCheckbox={handleRowCheckbox}
                  inputLabel={storageDevice.name}
                  item={storageDevice}
                  items={selected}
                />
              ) : (
                storageDevice.name
              )
            }
            primaryTitle={storageDevice.name}
            secondary={"serial" in storageDevice && storageDevice.serial}
            secondaryClassName={isMachine ? "u-nudge--secondary-row" : null}
            secondaryTitle={
              "serial" in storageDevice ? storageDevice.serial : null
            }
          />
        ),
      },
      {
        "aria-label": "Model & Firmware",
        content: (
          <DoubleRow
            primary={"model" in storageDevice ? storageDevice.model : "—"}
            primaryTitle={"model" in storageDevice ? storageDevice.model : null}
            secondary={
              "firmware_version" in storageDevice &&
              storageDevice.firmware_version
            }
            secondaryTitle={
              "firmware_version" in storageDevice
                ? storageDevice.firmware_version
                : null
            }
          />
        ),
      },
      {
        "aria-label": "Boot",
        content: (
          <DoubleRow
            primary={
              "is_boot" in storageDevice ? (
                <DiskBootStatus disk={storageDevice} />
              ) : (
                "—"
              )
            }
          />
        ),
      },
      {
        "aria-label": "Size",
        content: (
          <DoubleRow
            primary={formatSize(storageDevice.size)}
            secondary={
              "available_size" in storageDevice &&
              `Free: ${formatSize(storageDevice.available_size)}`
            }
          />
        ),
      },
      {
        "aria-label": "Type & NUMA node",
        content: (
          <DoubleRow
            primary={formatType(storageDevice)}
            secondary={
              ("numa_node" in storageDevice ||
                "numa_nodes" in storageDevice) && (
                <DiskNumaNodes disk={storageDevice} />
              )
            }
          />
        ),
      },
      {
        "aria-label": "Health & Tags",
        content: (
          <DoubleRow
            primary={
              "test_status" in storageDevice ? (
                <DiskTestStatus testStatus={storageDevice.test_status} />
              ) : (
                "—"
              )
            }
            secondary={
              <TagLinks
                getLinkURL={(tag) => {
                  if (isMachine) {
                    const filter = FilterMachines.filtersToQueryString({
                      storage_tags: [`=${tag}`],
                    });
                    return `${urls.machines.index}${filter}`;
                  }
                  const filter = FilterControllers.filtersToQueryString({
                    storage_tags: [`=${tag}`],
                  });
                  return `${urls.controllers.index}${filter}`;
                }}
                tags={storageDevice.tags}
              />
            }
          />
        ),
      },
      ...(isMachine
        ? [
            {
              "aria-label": "Actions",
              className: "u-align--right",
              content: (
                <StorageDeviceActions
                  disabled={actionsDisabled}
                  onActionClick={(action: StorageDeviceAction) =>
                    setExpanded({ content: action, id: rowId })
                  }
                  storageDevice={storageDevice}
                  systemId={systemId}
                />
              ),
            },
          ]
        : []),
    ],
    expanded: isExpanded,
    key: rowId,
  };
};

const AvailableStorageTable = ({
  canEditStorage,
  node,
}: Props): JSX.Element => {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState<Expanded | null>(null);
  const [selected, setSelected] = useState<(Disk | Partition)[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const isMachine = nodeIsMachine(node);

  const closeExpanded = () => setExpanded(null);
  const handleRowCheckbox = (storageDevice: Disk | Partition) => {
    const newSelected = isSelected(storageDevice, selected)
      ? selected.filter((item) => item !== storageDevice)
      : [...selected, storageDevice];
    setSelected(newSelected);
  };
  const handleAllCheckbox = () => {
    if (selected.length) {
      setSelected([]);
    } else {
      const newSelected = node.disks.reduce<(Disk | Partition)[]>(
        (selected, disk) => {
          if (isAvailable(disk)) {
            selected.push(disk);
          }
          if (disk.partitions) {
            disk.partitions.forEach((partition) => {
              if (isAvailable(partition)) {
                selected.push(partition);
              }
            });
          }
          return selected;
        },
        []
      );
      setSelected(newSelected);
    }
  };
  const actionsDisabled = !canEditStorage || Boolean(bulkAction);

  // To prevent selected state from becoming stale, set it directly from the
  // machine object when it changes (e.g. when a disk is deleted or updated).
  useEffect(() => {
    setSelected((prevSelected) => {
      const newSelected = [];
      for (const item of prevSelected) {
        if (isPartition(item)) {
          const partition = getPartitionById(node.disks, item.id);
          if (partition && isAvailable(partition)) {
            newSelected.push(partition);
          }
        } else {
          const disk = getDiskById(node.disks, item.id);
          if (disk && isAvailable(disk)) {
            newSelected.push(disk);
          }
        }
      }
      return newSelected;
    });
  }, [node.disks]);

  const rows: MainTableRow[] = [];
  node.disks.forEach((disk) => {
    if (isAvailable(disk)) {
      const diskType = formatType(disk, true);

      rows.push({
        ...normaliseRowData(
          node.system_id,
          isMachine,
          disk,
          actionsDisabled,
          expanded,
          setExpanded,
          selected,
          handleRowCheckbox
        ),
        expandedContent: isMachine ? (
          <div className="u-flex--grow">
            {expanded?.content === StorageDeviceAction.CREATE_BCACHE && (
              <CreateBcache
                closeExpanded={() => setExpanded(null)}
                storageDevice={disk}
                systemId={node.system_id}
              />
            )}
            {expanded?.content === StorageDeviceAction.CREATE_CACHE_SET && (
              <ActionConfirm
                closeExpanded={closeExpanded}
                confirmLabel="Create cache set"
                eventName="createCacheSet"
                onConfirm={() => {
                  dispatch(machineActions.cleanup());
                  dispatch(
                    machineActions.createCacheSet({
                      blockId: disk.id,
                      systemId: node.system_id,
                    })
                  );
                }}
                onSaveAnalytics={{
                  action: "Create cache set from disk",
                  category: "Machine storage",
                  label: "Create cache set",
                }}
                statusKey="creatingCacheSet"
                submitAppearance="positive"
                systemId={node.system_id}
              />
            )}
            {expanded?.content ===
              StorageDeviceAction.CREATE_LOGICAL_VOLUME && (
              <AddLogicalVolume
                closeExpanded={closeExpanded}
                disk={disk}
                systemId={node.system_id}
              />
            )}
            {expanded?.content === StorageDeviceAction.CREATE_PARTITION && (
              <AddPartition
                closeExpanded={closeExpanded}
                disk={disk}
                systemId={node.system_id}
              />
            )}
            {expanded?.content === StorageDeviceAction.DELETE_DISK && (
              <ActionConfirm
                closeExpanded={closeExpanded}
                confirmLabel={`Remove ${diskType}`}
                eventName="deleteDisk"
                message={`Are you sure you want to remove this ${diskType}?`}
                onConfirm={() => {
                  dispatch(machineActions.cleanup());
                  dispatch(
                    machineActions.deleteDisk({
                      blockId: disk.id,
                      systemId: node.system_id,
                    })
                  );
                }}
                onSaveAnalytics={{
                  action: `Delete ${diskType}`,
                  category: "Machine storage",
                  label: `Remove ${diskType}`,
                }}
                statusKey="deletingDisk"
                systemId={node.system_id}
              />
            )}
            {expanded?.content === StorageDeviceAction.DELETE_VOLUME_GROUP && (
              <ActionConfirm
                closeExpanded={closeExpanded}
                confirmLabel="Remove volume group"
                eventName="deleteVolumeGroup"
                message="Are you sure you want to remove this volume group?"
                onConfirm={() => {
                  dispatch(machineActions.cleanup());
                  dispatch(
                    machineActions.deleteVolumeGroup({
                      systemId: node.system_id,
                      volumeGroupId: disk.id,
                    })
                  );
                }}
                onSaveAnalytics={{
                  action: "Delete volume group",
                  category: "Machine storage",
                  label: "Remove volume group",
                }}
                statusKey="deletingVolumeGroup"
                systemId={node.system_id}
              />
            )}
            {expanded?.content === StorageDeviceAction.EDIT_DISK && (
              <EditDisk
                closeExpanded={closeExpanded}
                disk={disk}
                systemId={node.system_id}
              />
            )}
            {expanded?.content === StorageDeviceAction.SET_BOOT_DISK && (
              <ActionConfirm
                closeExpanded={closeExpanded}
                confirmLabel="Set boot disk"
                eventName="setBootDisk"
                onConfirm={() => {
                  dispatch(machineActions.cleanup());
                  dispatch(
                    machineActions.setBootDisk({
                      blockId: disk.id,
                      systemId: node.system_id,
                    })
                  );
                }}
                onSaveAnalytics={{
                  action: "Set boot disk",
                  category: "Machine storage",
                  label: "Set boot disk",
                }}
                statusKey="settingBootDisk"
                submitAppearance="positive"
                systemId={node.system_id}
              />
            )}
          </div>
        ) : null,
      });
    }

    if (disk.partitions) {
      disk.partitions.forEach((partition) => {
        if (isAvailable(partition)) {
          rows.push({
            ...normaliseRowData(
              node.system_id,
              isMachine,
              partition,
              actionsDisabled,
              expanded,
              setExpanded,
              selected,
              handleRowCheckbox
            ),
            expandedContent: isMachine ? (
              <div className="u-flex--grow">
                {expanded?.content === StorageDeviceAction.CREATE_BCACHE && (
                  <CreateBcache
                    closeExpanded={() => setExpanded(null)}
                    storageDevice={partition}
                    systemId={node.system_id}
                  />
                )}
                {expanded?.content === StorageDeviceAction.CREATE_CACHE_SET && (
                  <ActionConfirm
                    closeExpanded={closeExpanded}
                    confirmLabel="Create cache set"
                    eventName="createCacheSet"
                    onConfirm={() => {
                      dispatch(machineActions.cleanup());
                      dispatch(
                        machineActions.createCacheSet({
                          partitionId: partition.id,
                          systemId: node.system_id,
                        })
                      );
                    }}
                    onSaveAnalytics={{
                      action: "Create cache set from partition",
                      category: "Machine storage",
                      label: "Create cache set",
                    }}
                    statusKey="creatingCacheSet"
                    submitAppearance="positive"
                    systemId={node.system_id}
                  />
                )}
                {expanded?.content === StorageDeviceAction.DELETE_PARTITION && (
                  <ActionConfirm
                    closeExpanded={closeExpanded}
                    confirmLabel="Remove partition"
                    eventName="deletePartition"
                    message="Are you sure you want to remove this partition?"
                    onConfirm={() => {
                      dispatch(machineActions.cleanup());
                      dispatch(
                        machineActions.deletePartition({
                          partitionId: partition.id,
                          systemId: node.system_id,
                        })
                      );
                    }}
                    onSaveAnalytics={{
                      action: "Delete partition",
                      category: "Machine storage",
                      label: "Remove partition",
                    }}
                    statusKey="deletingPartition"
                    systemId={node.system_id}
                  />
                )}
                {expanded?.content === StorageDeviceAction.EDIT_PARTITION && (
                  <EditPartition
                    closeExpanded={() => setExpanded(null)}
                    disk={disk}
                    partition={partition}
                    systemId={node.system_id}
                  />
                )}
              </div>
            ) : null,
          });
        }
      });
    }
  });

  return (
    <>
      <MainTable
        className="p-table-expanding--light"
        expanding
        headers={[
          {
            content: (
              <div className="u-flex">
                {isMachine && (
                  <GroupCheckbox
                    data-testid="all-storage-checkbox"
                    disabled={actionsDisabled}
                    handleGroupCheckbox={handleAllCheckbox}
                    items={rows.map(({ key }) => key)}
                    selectedItems={selected.map((item) => uniqueId(item))}
                  />
                )}
                <div>
                  <div>Name</div>
                  <div>Serial</div>
                </div>
              </div>
            ),
          },
          {
            content: (
              <div>
                <div>Model</div>
                <div>Firmware</div>
              </div>
            ),
          },
          {
            content: <div>Boot</div>,
          },
          {
            content: <div>Size</div>,
          },
          {
            content: (
              <div>
                <div>Type</div>
                <div>NUMA node</div>
              </div>
            ),
          },
          {
            content: (
              <div>
                <div>Health</div>
                <div>Tags</div>
              </div>
            ),
          },
          ...(isMachine
            ? [
                {
                  className: "u-align--right",
                  content: <div>Actions</div>,
                },
              ]
            : []),
        ]}
        responsive
        rows={rows}
      />
      {rows.length === 0 && (
        <div className="u-nudge-right--small u-sv2" data-testid="no-available">
          No available disks or partitions.
        </div>
      )}
      {isMachine && canEditStorage && (
        <BulkActions
          bulkAction={bulkAction}
          selected={selected}
          setBulkAction={setBulkAction}
          systemId={node.system_id}
        />
      )}
    </>
  );
};

export default AvailableStorageTable;
