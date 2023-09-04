import { Button, List, Tooltip } from "@canonical/react-components";
import { useSelector } from "react-redux";

import { BulkAction } from "../AvailableStorageTable";

import CreateDatastore from "./CreateDatastore";
import CreateRaid from "./CreateRaid";
import CreateVolumeGroup from "./CreateVolumeGroup";
import UpdateDatastore from "./UpdateDatastore";

import machineSelectors from "@/app/store/machine/selectors";
import type { Machine } from "@/app/store/machine/types";
import { isMachineDetails } from "@/app/store/machine/utils";
import type { RootState } from "@/app/store/root/types";
import type { Disk, Partition } from "@/app/store/types/node";
import {
  canCreateOrUpdateDatastore,
  canCreateRaid,
  canCreateVolumeGroup,
  isDatastore,
  isVMWareLayout,
} from "@/app/store/utils";

type Props = {
  bulkAction: BulkAction | null;
  selected: (Disk | Partition)[];
  setBulkAction: (bulkAction: BulkAction | null) => void;
  systemId: Machine["system_id"];
};

const BulkActions = ({
  bulkAction,
  selected,
  setBulkAction,
  systemId,
}: Props): JSX.Element | null => {
  const machine = useSelector((state: RootState) =>
    machineSelectors.getById(state, systemId)
  );

  if (!isMachineDetails(machine)) {
    return null;
  }

  if (bulkAction === BulkAction.CREATE_DATASTORE) {
    return (
      <CreateDatastore
        closeForm={() => setBulkAction(null)}
        selected={selected}
        systemId={systemId}
      />
    );
  }

  if (bulkAction === BulkAction.CREATE_RAID) {
    return (
      <CreateRaid
        closeForm={() => setBulkAction(null)}
        selected={selected}
        systemId={systemId}
      />
    );
  }

  if (bulkAction === BulkAction.CREATE_VOLUME_GROUP) {
    return (
      <CreateVolumeGroup
        closeForm={() => setBulkAction(null)}
        selected={selected}
        systemId={systemId}
      />
    );
  }

  if (bulkAction === BulkAction.UPDATE_DATASTORE) {
    return (
      <UpdateDatastore
        closeForm={() => setBulkAction(null)}
        selected={selected}
        systemId={systemId}
      />
    );
  }

  if (isVMWareLayout(machine.detected_storage_layout)) {
    const hasDatastores = machine.disks.some((disk) =>
      isDatastore(disk.filesystem)
    );
    const createDatastoreEnabled = canCreateOrUpdateDatastore(selected);
    const updateDatastoreEnabled = createDatastoreEnabled && hasDatastores;

    let updateTooltip: string | null = null;
    if (!hasDatastores) {
      updateTooltip = "No datastores detected.";
    } else if (!updateDatastoreEnabled) {
      updateTooltip =
        "Select one or more unpartitioned and unformatted storage devices to add to an existing datastore.";
    }

    return (
      <List
        className="u-no-margin--bottom"
        data-testid="vmware-bulk-actions"
        inline
        items={[
          <Tooltip
            data-testid="create-datastore-tooltip"
            message={
              !createDatastoreEnabled
                ? "Select one or more unpartitioned and unformatted storage devices to create a datastore."
                : null
            }
            position="top-left"
          >
            <Button
              data-testid="create-datastore"
              disabled={!createDatastoreEnabled}
              onClick={() => setBulkAction(BulkAction.CREATE_DATASTORE)}
            >
              Create datastore
            </Button>
          </Tooltip>,
          <Tooltip
            data-testid="add-to-datastore-tooltip"
            message={updateTooltip}
            position="top-left"
          >
            <Button
              data-testid="add-to-datastore"
              disabled={!updateDatastoreEnabled}
              onClick={() => setBulkAction(BulkAction.UPDATE_DATASTORE)}
            >
              Add to existing datastore
            </Button>
          </Tooltip>,
        ]}
      />
    );
  }

  const createRaidEnabled = canCreateRaid(selected);
  const createVgEnabled = canCreateVolumeGroup(selected);

  return (
    <List
      className="u-no-margin--bottom"
      inline
      items={[
        <Tooltip
          data-testid="create-vg-tooltip"
          message={
            !createVgEnabled
              ? "Select one or more unpartitioned and unformatted storage devices to create a volume group."
              : null
          }
          position="top-left"
        >
          <Button
            data-testid="create-vg"
            disabled={!createVgEnabled}
            onClick={() => setBulkAction(BulkAction.CREATE_VOLUME_GROUP)}
          >
            Create volume group
          </Button>
        </Tooltip>,
        <Tooltip
          data-testid="create-raid-tooltip"
          message={
            !createRaidEnabled
              ? "Select two or more unpartitioned and unmounted storage devices to create a RAID."
              : null
          }
          position="top-left"
        >
          <Button
            data-testid="create-raid"
            disabled={!createRaidEnabled}
            onClick={() => setBulkAction(BulkAction.CREATE_RAID)}
          >
            Create RAID
          </Button>
        </Tooltip>,
      ]}
    />
  );
};

export default BulkActions;
