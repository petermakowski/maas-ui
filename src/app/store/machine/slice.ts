import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

import { ACTIONS, DEFAULT_STATUSES } from "./constants";
import type {
  ApplyStorageLayoutParams,
  BaseMachineActionParams,
  CloneParams,
  CommissionParams,
  CreateBcacheParams,
  CreateBondParams,
  CreateBridgeParams,
  CreateCacheSetParams,
  CreateLogicalVolumeParams,
  CreateParams,
  CreatePartitionParams,
  CreatePhysicalParams,
  CreateRaidParams,
  CreateVlanParams,
  CreateVmfsDatastoreParams,
  CreateVolumeGroupParams,
  DeleteCacheSetParams,
  DeleteDiskParams,
  DeleteFilesystemParams,
  DeleteInterfaceParams,
  DeletePartitionParams,
  DeleteVolumeGroupParams,
  DeployParams,
  FetchParams,
  FetchResponse,
  FetchResponseGroup,
  FilterGroupOption,
  FilterGroupOptionType,
  FilterGroupResponse,
  GetSummaryXmlParams,
  GetSummaryYamlParams,
  LinkSubnetParams,
  Machine,
  MachineDetails,
  MachineState,
  MachineStateCount,
  MachineStateDetailsItem,
  MachineStateList,
  MarkBrokenParams,
  MountSpecialParams,
  ReleaseParams,
  SetBootDiskParams,
  SetPoolParams,
  SetZoneParams,
  TagParams,
  TestParams,
  UnlinkSubnetParams,
  UnmountSpecialParams,
  UntagParams,
  UpdateDiskParams,
  UpdateFilesystemParams,
  UpdateParams,
  UpdateVmfsDatastoreParams,
  FetchFilters,
  SelectedMachines,
  FilterGroupKey,
} from "./types";
import { MachineMeta, FilterGroupType } from "./types";
import type { OverrideFailedTesting } from "./types/actions";
import type { MachineActionStatus, MachineStateListGroup } from "./types/base";
import { createMachineListGroup } from "./utils";

import { ACTION_STATUS } from "app/base/constants";
import type { ScriptResult } from "app/store/scriptresult/types";
import type { UpdateInterfaceParams } from "app/store/types/node";
import { NodeActions } from "app/store/types/node";
import { generateStatusHandlers, updateErrors } from "app/store/utils";
import type {
  StatusHandlers,
  GenericItemMeta,
  GenericMeta,
} from "app/store/utils/slice";
import {
  generateCommonReducers,
  genericInitialState,
} from "app/store/utils/slice";
import { preparePayloadParams, kebabToCamelCase } from "app/utils";

const DEFAULT_MACHINE_QUERY_STATE = {
  params: null,
  listeners: 0,
  fetchedAt: null,
  refetchedAt: null,
  refetching: false,
};

const DEFAULT_LIST_STATE = {
  count: null,
  cur_page: null,
  errors: null,
  groups: null,
  loaded: false,
  loading: true,
  stale: false,
  num_pages: null,
  ...DEFAULT_MACHINE_QUERY_STATE,
};

const DEFAULT_COUNT_STATE = {
  loading: false,
  loaded: false,
  stale: false,
  count: null,
  errors: null,
  ...DEFAULT_MACHINE_QUERY_STATE,
};

const DEFAULT_DETAILS_STATE = {
  loading: false,
  loaded: false,
  stale: false,
  errors: null,
  ...DEFAULT_MACHINE_QUERY_STATE,
};

const isArrayOfOptionsType = <T extends FilterGroupOptionType>(
  options: FilterGroupOption[],
  typeString: string
): options is FilterGroupOption<T>[] =>
  options.every(({ key }) => typeof key === typeString);

/**
 * Wrap the updateError call so that the call is made with the correct generics.
 */
const setErrors = (
  state: MachineState,
  action: PayloadAction<MachineState["errors"]> | null,
  event: string | null
): MachineState =>
  updateErrors<MachineState, MachineMeta.PK>(
    state,
    action,
    event,
    MachineMeta.PK
  );

const statusHandlers = generateStatusHandlers<
  MachineState,
  Machine,
  MachineMeta.PK,
  MachineActionStatus
>(
  MachineMeta.PK,
  ACTIONS.map((action) => {
    const handler: StatusHandlers<
      MachineState,
      Machine,
      MachineActionStatus | null
    > = {
      status: kebabToCamelCase(action.name),
      start: (state, action) => {
        if (action.meta.callId) {
          if (action.meta.callId in state.actions) {
            state.actions[action.meta.callId].status = ACTION_STATUS.loading;
          } else {
            state.actions[action.meta.callId] = {
              status: ACTION_STATUS.loading,
              errors: null,
              successCount: 0,
              failedSystemIds: [],
            };
          }
        }
      },
      success: (state, action) => {
        if (action.meta.callId) {
          const actionsItem = state.actions[action.meta.callId];

          if (action.meta.callId in state.actions && action?.payload) {
            actionsItem.status = ACTION_STATUS.success;
            if (action?.payload && "success_count" in action.payload) {
              actionsItem.successCount = action.payload.success_count as number;
            }
            if (
              "failed_system_ids" in action?.payload &&
              action.payload.failed_system_ids?.length > 0
            ) {
              actionsItem.status = ACTION_STATUS.error;
              actionsItem.failedSystemIds = [
                ...action.payload.failed_system_ids,
              ] as Machine[MachineMeta.PK][];
            }
          } else if (actionsItem) {
            actionsItem.status = ACTION_STATUS.error;
          }
        }
      },
      error: (state, action) => {
        if (action.meta.callId) {
          if (action.meta.callId in state.actions) {
            const actionsItem = state.actions[action.meta.callId];
            actionsItem.status = "error";
            actionsItem.errors = action.payload;
          }
        }
      },
      method: "action",
      statusKey: action.status,
    };
    return handler;
  }),
  setErrors
);

const generateActionParams = <P extends BaseMachineActionParams>(
  action: NodeActions
) => ({
  prepare: (params: P, callId?: string) => {
    let actionParams: {
      action: NodeActions;
      extra: Omit<P, "filter" | "system_id"> | Omit<P, "system_id">;
    } & BaseMachineActionParams;
    if ("filter" in params) {
      // Separate the filter and 'extra' params.
      const { filter, system_id, ...extra } = params;
      actionParams = {
        action,
        extra,
        system_id,
        filter,
      };
    } else {
      // Separate the id and 'extra' params.
      const { system_id, ...extra } = params;
      actionParams = {
        action,
        extra,
        system_id,
      };
    }
    return {
      meta: {
        model: MachineMeta.MODEL,
        method: "action",
        ...(callId ? { callId } : {}),
      },
      payload: {
        params: actionParams,
      },
    };
  },
  reducer: () => {
    // No state changes need to be handled for this action.
  },
});

const machineSlice = createSlice({
  name: MachineMeta.MODEL,
  initialState: {
    ...genericInitialState,
    actions: {},
    active: null,
    counts: {},
    details: {},
    eventErrors: [],
    filters: [],
    filtersLoaded: false,
    filtersLoading: false,
    lists: {},
    selected: null,
    statuses: {},
  } as MachineState,
  reducers: {
    ...generateCommonReducers<
      MachineState,
      MachineMeta.PK,
      CreateParams,
      UpdateParams
    >(MachineMeta.MODEL, MachineMeta.PK, setErrors),
    [NodeActions.ABORT]: generateActionParams<BaseMachineActionParams>(
      NodeActions.ABORT
    ),
    [`${NodeActions.ABORT}Error`]: statusHandlers.abort.error,
    [`${NodeActions.ABORT}Start`]: statusHandlers.abort.start,
    [`${NodeActions.ABORT}Success`]: statusHandlers.abort.success,
    [NodeActions.ACQUIRE]: generateActionParams<BaseMachineActionParams>(
      NodeActions.ACQUIRE
    ),
    [`${NodeActions.ACQUIRE}Error`]: statusHandlers.acquire.error,
    [`${NodeActions.ACQUIRE}Start`]: statusHandlers.acquire.start,
    [`${NodeActions.ACQUIRE}Success`]: statusHandlers.acquire.success,
    addChassis: {
      prepare: (params: { [x: string]: string }) => ({
        payload: {
          params,
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    addChassisError: (
      state: MachineState,
      action: PayloadAction<MachineState["errors"]>
    ) => {
      state.errors = action.payload;
      state = setErrors(state, action, "addChassis");
      state.loading = false;
      state.saving = false;
    },
    addChassisStart: (state: MachineState) => {
      state.saved = false;
      state.saving = true;
    },
    addChassisSuccess: (state: MachineState) => {
      state.errors = null;
      state.saved = true;
      state.saving = false;
    },
    applyStorageLayout: {
      prepare: (params: ApplyStorageLayoutParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "apply_storage_layout",
        },
        payload: {
          params: {
            storage_layout: params.storageLayout,
            system_id: params.systemId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    applyStorageLayoutError: statusHandlers.applyStorageLayout.error,
    applyStorageLayoutStart: statusHandlers.applyStorageLayout.start,
    applyStorageLayoutSuccess: statusHandlers.applyStorageLayout.success,
    checkPower: {
      prepare: (system_id: Machine[MachineMeta.PK]) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "check_power",
        },
        payload: {
          params: {
            system_id,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    checkPowerError: statusHandlers.checkPower.error,
    checkPowerStart: statusHandlers.checkPower.start,
    checkPowerSuccess: statusHandlers.checkPower.success,
    [NodeActions.CLONE]: generateActionParams<CloneParams>(NodeActions.CLONE),
    cloneError: statusHandlers.clone.error,
    cloneStart: statusHandlers.clone.start,
    cloneSuccess: statusHandlers.clone.success,
    [NodeActions.COMMISSION]: generateActionParams<CommissionParams>(
      NodeActions.COMMISSION
    ),
    [`${NodeActions.COMMISSION}Error`]: statusHandlers.commission.error,
    [`${NodeActions.COMMISSION}Start`]: statusHandlers.commission.start,
    [`${NodeActions.COMMISSION}Success`]: statusHandlers.commission.success,
    createBcache: {
      prepare: (params: CreateBcacheParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "create_bcache",
        },
        payload: {
          params: preparePayloadParams(params, {
            cacheMode: "cache_mode",
            cacheSetId: "cache_set",
            systemId: MachineMeta.PK,
            blockId: "block_id",
            mountOptions: "mount_options",
            mountPoint: "mount_point",
            partitionId: "partition_id",
          }),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    count: {
      prepare: (callId: string, filters?: FetchFilters | null) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "count",
          callId,
        },
        payload: filters
          ? {
              params: { filter: filters },
            }
          : null,
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    countError: {
      prepare: (callId: string, errors: MachineStateCount["errors"]) => ({
        meta: {
          callId,
        },
        payload: errors,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<MachineStateCount["errors"], string, GenericMeta>
      ) => {
        if (action.meta.callId) {
          state.counts[action.meta.callId] = {
            ...(action.meta.callId in state.counts
              ? state.counts[action.meta.callId]
              : DEFAULT_COUNT_STATE),
            errors: action.payload,
            loading: false,
          };
        }
        state = setErrors(state, action, "count");
      },
    },
    countStart: {
      prepare: (callId: string) => ({
        meta: {
          callId,
        },
        payload: null,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<null, string, GenericMeta>
      ) => {
        if (action.meta.callId) {
          if (action.meta.callId in state.counts) {
            // refetching
            state.counts[action.meta.callId].refetching = true;
            state.counts[action.meta.callId].refetchedAt = Date.now();
            state.counts[action.meta.callId].listeners += 1;
          } else {
            // initial fetch
            state.counts[action.meta.callId] = {
              ...DEFAULT_COUNT_STATE,
              loading: true,
              params: action?.meta.item || null,
              listeners: 1,
              fetchedAt: Date.now(),
            };
          }
        }
      },
    },
    countSuccess: {
      prepare: (callId: string, count: { count: number }) => ({
        meta: {
          callId,
        },
        payload: count,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<{ count: number }, string, GenericMeta>
      ) => {
        // Only update state if this call exists in the store. This check is required
        // because the call may have been cleaned up in the time the API takes
        // to respond.
        if (action.meta.callId && action.meta.callId in state.counts) {
          state.counts[action.meta.callId] = {
            ...(action.meta.callId in state.counts
              ? state.counts[action.meta.callId]
              : DEFAULT_COUNT_STATE),
            count: action.payload.count,
            loading: false,
            loaded: true,
          };
        }
      },
    },
    createBcacheError: statusHandlers.createBcache.error,
    createBcacheStart: statusHandlers.createBcache.start,
    createBcacheSuccess: statusHandlers.createBcache.success,
    createBond: {
      prepare: (params: CreateBondParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "create_bond",
        },
        payload: {
          params: preparePayloadParams(params),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    createBondError: statusHandlers.createBond.error,
    createBondStart: statusHandlers.createBond.start,
    createBondSuccess: statusHandlers.createBond.success,
    createBridge: {
      prepare: (params: CreateBridgeParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "create_bridge",
        },
        payload: {
          params: preparePayloadParams(params),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    createBridgeError: statusHandlers.createBridge.error,
    createBridgeStart: statusHandlers.createBridge.start,
    createBridgeSuccess: statusHandlers.createBridge.success,
    createCacheSet: {
      prepare: (params: CreateCacheSetParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "create_cache_set",
        },
        payload: {
          params: preparePayloadParams(params, {
            blockId: "block_id",
            partitionId: "partition_id",
            systemId: MachineMeta.PK,
          }),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    createCacheSetError: statusHandlers.createCacheSet.error,
    createCacheSetStart: statusHandlers.createCacheSet.start,
    createCacheSetSuccess: statusHandlers.createCacheSet.success,
    createLogicalVolume: {
      prepare: (params: CreateLogicalVolumeParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "create_logical_volume",
        },
        payload: {
          params: preparePayloadParams(params, {
            mountOptions: "mount_options",
            mountPoint: "mount_point",
            systemId: MachineMeta.PK,
            volumeGroupId: "volume_group_id",
          }),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    createLogicalVolumeError: statusHandlers.createLogicalVolume.error,
    createLogicalVolumeStart: statusHandlers.createLogicalVolume.start,
    createLogicalVolumeSuccess: statusHandlers.createLogicalVolume.success,
    createPartition: {
      prepare: (params: CreatePartitionParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "create_partition",
        },
        payload: {
          params: {
            block_id: params.blockId,
            fstype: params.fstype,
            mount_options: params.mountOptions,
            mount_point: params.mountPoint,
            partition_size: params.partitionSize,
            system_id: params.systemId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    createPartitionError: statusHandlers.createPartition.error,
    createPartitionStart: statusHandlers.createPartition.start,
    createPartitionSuccess: statusHandlers.createPartition.success,
    createPhysical: {
      prepare: (params: CreatePhysicalParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "create_physical",
        },
        payload: {
          params: preparePayloadParams(params),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    createPhysicalError: statusHandlers.createPhysical.error,
    createPhysicalStart: statusHandlers.createPhysical.start,
    createPhysicalSuccess: statusHandlers.createPhysical.success,
    createRaid: {
      prepare: (params: CreateRaidParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "create_raid",
        },
        payload: {
          params: preparePayloadParams(params, {
            blockDeviceIds: "block_devices",
            mountOptions: "mount_options",
            mountPoint: "mount_point",
            partitionIds: "partitions",
            spareBlockDeviceIds: "spare_devices",
            sparePartitionIds: "spare_partitions",
            systemId: MachineMeta.PK,
          }),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    createRaidError: statusHandlers.createRaid.error,
    createRaidStart: statusHandlers.createRaid.start,
    createRaidSuccess: statusHandlers.createRaid.success,
    createVlan: {
      prepare: (params: CreateVlanParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "create_vlan",
        },
        payload: {
          params: preparePayloadParams(params),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    createVlanError: statusHandlers.createVlan.error,
    createVlanStart: statusHandlers.createVlan.start,
    createVlanSuccess: statusHandlers.createVlan.success,
    createVmfsDatastore: {
      prepare: (params: CreateVmfsDatastoreParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "create_vmfs_datastore",
        },
        payload: {
          params: preparePayloadParams(params, {
            blockDeviceIds: "block_devices",
            partitionIds: "partitions",
            systemId: MachineMeta.PK,
          }),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    createVmfsDatastoreError: statusHandlers.createVmfsDatastore.error,
    createVmfsDatastoreStart: statusHandlers.createVmfsDatastore.start,
    createVmfsDatastoreSuccess: statusHandlers.createVmfsDatastore.success,
    createVolumeGroup: {
      prepare: (params: CreateVolumeGroupParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "create_volume_group",
        },
        payload: {
          params: preparePayloadParams(params, {
            blockDeviceIds: "block_devices",
            partitionIds: "partitions",
            systemId: MachineMeta.PK,
          }),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    createVolumeGroupError: statusHandlers.createVolumeGroup.error,
    createVolumeGroupStart: statusHandlers.createVolumeGroup.start,
    createVolumeGroupSuccess: statusHandlers.createVolumeGroup.success,
    [NodeActions.DELETE]: generateActionParams<BaseMachineActionParams>(
      NodeActions.DELETE
    ),
    [`${NodeActions.DELETE}Error`]: statusHandlers.delete.error,
    [`${NodeActions.DELETE}Start`]: statusHandlers.delete.start,
    [`${NodeActions.DELETE}Success`]: statusHandlers.delete.success,
    [`${NodeActions.DELETE}Notify`]: (state: MachineState, action) => {
      const index = state.items.findIndex(
        (item: Machine) => item.system_id === action.payload
      );
      state.items.splice(index, 1);
      if (
        state.selected &&
        "items" in state.selected &&
        state.selected.items &&
        state.selected.items.length > 0
      ) {
        state.selected.items = state.selected.items.filter(
          (machineId: Machine[MachineMeta.PK]) => machineId !== action.payload
        );
      }
      // Remove deleted machine from all lists
      Object.values(state.lists).forEach((list) => {
        list.groups?.forEach((group) => {
          let index = group.items.indexOf(action.payload);
          if (index !== -1) {
            group.items.splice(index, 1);
            // update the count
            if (group.count > 0) {
              group.count = group.count - 1;
            }
            if (list.count && list.count > 0) {
              list.count = list.count! - 1;
            }
            // Exit the loop early if the item has been found and removed
            return;
          }
        });
        // remove any empty groups
        if (list.groups) {
          list.groups = list.groups?.filter((group) => group.items.length > 0);
        }
      });

      // we do not know if the deleted machine is in the the requested count
      // mark all machine count queries as stale and in need of re-fetch
      Object.keys(state.counts).forEach((callId) => {
        state.counts[callId].stale = true;
      });

      // Clean up the statuses for model.
      delete state.statuses[action.payload];
    },
    deleteCacheSet: {
      prepare: (params: DeleteCacheSetParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "delete_cache_set",
        },
        payload: {
          params: {
            cache_set_id: params.cacheSetId,
            system_id: params.systemId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    deleteCacheSetError: statusHandlers.deleteCacheSet.error,
    deleteCacheSetStart: statusHandlers.deleteCacheSet.start,
    deleteCacheSetSuccess: statusHandlers.deleteCacheSet.success,
    deleteDisk: {
      prepare: (params: DeleteDiskParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "delete_disk",
        },
        payload: {
          params: {
            block_id: params.blockId,
            system_id: params.systemId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    deleteDiskError: statusHandlers.deleteDisk.error,
    deleteDiskStart: statusHandlers.deleteDisk.start,
    deleteDiskSuccess: statusHandlers.deleteDisk.success,
    deleteFilesystem: {
      prepare: (params: DeleteFilesystemParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "delete_filesystem",
        },
        payload: {
          params: preparePayloadParams(params, {
            blockDeviceId: "blockdevice_id",
            filesystemId: "filesystem_id",
            partitionId: "partition_id",
            systemId: MachineMeta.PK,
          }),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    deleteFilesystemError: statusHandlers.deleteFilesystem.error,
    deleteFilesystemStart: statusHandlers.deleteFilesystem.start,
    deleteFilesystemSuccess: statusHandlers.deleteFilesystem.success,
    deleteInterface: {
      prepare: (params: DeleteInterfaceParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "delete_interface",
        },
        payload: {
          params: {
            interface_id: params.interfaceId,
            system_id: params.systemId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    deleteInterfaceError: statusHandlers.deleteInterface.error,
    deleteInterfaceStart: statusHandlers.deleteInterface.start,
    deleteInterfaceSuccess: statusHandlers.deleteInterface.success,
    deletePartition: {
      prepare: (params: DeletePartitionParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "delete_partition",
        },
        payload: {
          params: {
            partition_id: params.partitionId,
            system_id: params.systemId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    deletePartitionError: statusHandlers.deletePartition.error,
    deletePartitionStart: statusHandlers.deletePartition.start,
    deletePartitionSuccess: statusHandlers.deletePartition.success,
    deleteVolumeGroup: {
      prepare: (params: DeleteVolumeGroupParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "delete_volume_group",
        },
        payload: {
          params: {
            system_id: params.systemId,
            volume_group_id: params.volumeGroupId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    deleteVolumeGroupError: statusHandlers.deleteVolumeGroup.error,
    deleteVolumeGroupStart: statusHandlers.deleteVolumeGroup.start,
    deleteVolumeGroupSuccess: statusHandlers.deleteVolumeGroup.success,
    [NodeActions.DEPLOY]: generateActionParams<DeployParams>(
      NodeActions.DEPLOY
    ),
    [`${NodeActions.DEPLOY}Error`]: statusHandlers.deploy.error,
    [`${NodeActions.DEPLOY}Start`]: statusHandlers.deploy.start,
    [`${NodeActions.DEPLOY}Success`]: statusHandlers.deploy.success,
    exitRescueMode: generateActionParams<BaseMachineActionParams>(
      NodeActions.EXIT_RESCUE_MODE
    ),
    exitRescueModeError: statusHandlers.exitRescueMode.error,
    exitRescueModeStart: statusHandlers.exitRescueMode.start,
    exitRescueModeSuccess: statusHandlers.exitRescueMode.success,
    fetch: {
      prepare: (callId: string, params?: FetchParams | null) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "list",
          nocache: true,
          callId,
        },
        payload: params
          ? {
              params,
            }
          : null,
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    fetchError: {
      prepare: (callId: string, errors: MachineStateList["errors"]) => ({
        meta: {
          callId,
        },
        payload: errors,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<MachineStateList["errors"], string, GenericMeta>
      ) => {
        if (action.meta.callId) {
          if (action.meta.callId in state.lists) {
            state.lists[action.meta.callId].errors = action.payload;
            state.lists[action.meta.callId].loading = false;
          }
        }
        state = setErrors(state, action, "fetch");
      },
    },
    fetchStart: {
      prepare: (callId: string) => ({
        meta: {
          callId,
        },
        payload: null,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<null, string, GenericMeta>
      ) => {
        if (action.meta.callId) {
          if (!state.lists[action.meta.callId]) {
            // initial fetch
            state.lists[action.meta.callId] = {
              ...DEFAULT_LIST_STATE,
              loading: true,
              params: action?.meta.item || null,
              listeners: 1,
              fetchedAt: Date.now(),
            };
          } else {
            // refetching
            state.lists[action.meta.callId].refetching = true;
            state.lists[action.meta.callId].params = action?.meta.item || null;
            state.lists[action.meta.callId].listeners += 1;
            state.lists[action.meta.callId].refetchedAt = Date.now();
          }
        }
      },
    },
    fetchSuccess: {
      prepare: (callId: string, payload: FetchResponse) => ({
        meta: {
          callId,
        },
        payload,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<FetchResponse, string, GenericMeta>
      ) => {
        const { callId } = action.meta;
        // Only update state if this call exists in the store. This check is required
        // because the call may have been cleaned up in the time the API takes
        // to respond.
        if (callId && callId in state.lists) {
          action.payload.groups.forEach((group: FetchResponseGroup) => {
            group.items.forEach((newItem: Machine) => {
              // Add items that don't already exist in the store. Existing items
              // are probably MachineDetails so this would overwrite them with the
              // simple machine. Existing items will be kept up to date via the
              // notify (sync) messages.
              const existing = state.items.find(
                (draftItem: Machine) => draftItem.id === newItem.id
              );
              if (!existing) {
                state.items.push(newItem);
                // Set up the statuses for this machine.
                state.statuses[newItem.system_id] = DEFAULT_STATUSES;
              }
            });
          });
          const { payload } = action;
          state.lists[callId].count = payload.count;
          state.lists[callId].cur_page = payload.cur_page;
          state.lists[callId].groups = payload.groups.map((group) => ({
            ...group,
            items: group.items.map(({ system_id }) => system_id),
          }));
          state.lists[callId].loaded = true;
          state.lists[callId].loading = false;
          state.lists[callId].num_pages = payload.num_pages;
        }
      },
    },
    // marks all queries as stale which will trigger a re-fetch
    invalidateQueries: (state) => {
      Object.keys(state.lists).forEach((callId) => {
        state.lists[callId].stale = true;
      });
      Object.keys(state.counts).forEach((callId) => {
        state.counts[callId].stale = true;
      });
    },
    filterGroups: {
      prepare: () => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "filter_groups",
        },
        payload: null,
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    filterGroupsError: (
      state: MachineState,
      action: PayloadAction<MachineState["errors"]>
    ) => {
      state.errors = action.payload;
      state = setErrors(state, action, "filterGroups");
      state.filtersLoading = false;
    },
    filterGroupsStart: (state: MachineState) => {
      state.filtersLoading = true;
    },
    filterGroupsSuccess: (
      state: MachineState,
      action: PayloadAction<FilterGroupResponse[]>
    ) => {
      state.filters = action.payload.map((response) => ({
        ...response,
        errors: null,
        loaded: false,
        loading: false,
        options: null,
      }));
      state.filtersLoading = false;
      state.filtersLoaded = true;
    },
    filterOptions: {
      prepare: (groupKey: FilterGroupKey) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "filter_options",
        },
        payload: {
          params: {
            group_key: groupKey,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    filterOptionsError: {
      prepare: (
        groupKey: FilterGroupKey,
        errors: MachineStateDetailsItem["errors"]
      ) => ({
        meta: {
          item: {
            group_key: groupKey,
          },
        },
        payload: errors,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<
          MachineStateDetailsItem["errors"],
          string,
          GenericItemMeta<{ group_key: FilterGroupKey }>
        >
      ) => {
        // Find the group for the requested key.
        const filterGroup = state.filters.find(
          ({ key }) => key === action.meta.item.group_key
        );
        if (filterGroup) {
          filterGroup.errors = action.payload;
          filterGroup.loading = false;
        }
        state = setErrors(state, action, "filterOptions");
      },
    },
    filterOptionsStart: {
      prepare: (groupKey: FilterGroupKey) => ({
        meta: {
          item: {
            group_key: groupKey,
          },
        },
        payload: null,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<
          null,
          string,
          GenericItemMeta<{ group_key: FilterGroupKey }>
        >
      ) => {
        // Find the group for the requested key.
        const filterGroup = state.filters.find(
          ({ key }) => key === action.meta.item.group_key
        );
        if (filterGroup) {
          filterGroup.loading = true;
        }
      },
    },
    filterOptionsSuccess: {
      prepare: (groupKey: FilterGroupKey, payload: FilterGroupOption[]) => ({
        meta: {
          item: {
            group_key: groupKey,
          },
        },
        payload,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<
          FilterGroupOption[],
          string,
          GenericItemMeta<{ group_key: FilterGroupKey }>
        >
      ) => {
        // Find the group for the requested key.
        const filterGroup = state.filters.find(
          ({ key }) => key === action.meta.item.group_key
        );
        if (filterGroup) {
          // Remove any blank options.
          const options = action.payload.filter(
            ({ key, label }) => key || label
          );
          // Narrow the type of the response to match the expected options
          // and instert the options inside the filter group.
          if (
            filterGroup.type === FilterGroupType.Bool &&
            isArrayOfOptionsType<boolean>(options, "boolean")
          ) {
            filterGroup.options = options;
          } else if (
            [
              FilterGroupType.Float,
              FilterGroupType.FloatList,
              FilterGroupType.Int,
              FilterGroupType.IntList,
            ].includes(filterGroup.type) &&
            isArrayOfOptionsType<number>(options, "number")
          ) {
            filterGroup.options = options;
          } else if (
            [
              FilterGroupType.String,
              FilterGroupType.StringList,
              FilterGroupType.Dict,
            ].includes(filterGroup.type) &&
            isArrayOfOptionsType<string>(options, "string")
          ) {
            filterGroup.options = options;
          }
          filterGroup.loading = false;
          filterGroup.loaded = true;
        }
      },
    },
    cleanupRequest: {
      prepare: (callId: string) => ({
        meta: {
          callId,
          model: MachineMeta.MODEL,
          unsubscribe: true,
        },
        payload: null,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<null, string, GenericMeta>
      ) => {
        const { callId } = action.meta;
        if (callId) {
          if (callId in state.lists) {
            state.lists[callId].listeners -= 1;
          } else if (callId in state.counts) {
            state.counts[callId].listeners -= 1;
          }
        }
      },
    },
    get: {
      prepare: (machineID: Machine[MachineMeta.PK], callId: string) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "get",
          callId,
        },
        payload: {
          params: { system_id: machineID },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    getError: {
      prepare: (
        item: { system_id: Machine[MachineMeta.PK] },
        callId: string,
        errors: MachineStateDetailsItem["errors"]
      ) => ({
        meta: {
          item,
          callId,
        },
        payload: errors,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<
          MachineStateDetailsItem["errors"],
          string,
          GenericItemMeta<{ system_id: Machine[MachineMeta.PK] }>
        >
      ) => {
        if (action.meta.callId && action.meta.callId in state.details) {
          state.details[action.meta.callId].errors = action.payload;
          state.details[action.meta.callId].loading = false;
        }
        state = setErrors(state, action, "get");
      },
    },
    getStart: {
      prepare: (
        item: { system_id: Machine[MachineMeta.PK] },
        callId: string
      ) => ({
        meta: {
          item,
          callId,
        },
        payload: null,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<
          null,
          string,
          GenericItemMeta<{ system_id: Machine[MachineMeta.PK] }>
        >
      ) => {
        if (action.meta.callId) {
          if (action.meta.callId in state.details) {
            // TODO: improve this, is this the right place to do it? - probably not, should go to websockets where we have isLoaded and setIsLoaded
            const fetchedAt = state.details[action.meta.callId].fetchedAt;
            const diff = fetchedAt ? fetchedAt - Date.now() : null;
            const shouldRefetch = typeof diff === "number" ? diff > 5000 : true;
            console.log(fetchedAt, Date.now(), diff, shouldRefetch);
            if (!shouldRefetch) {
              return;
            }
            // refetching
            state.details[action.meta.callId].refetching = true;
            state.details[action.meta.callId].refetchedAt = Date.now();
            state.details[action.meta.callId].listeners += 1;
          } else {
            // initial fetch
            state.details[action.meta.callId] = {
              ...DEFAULT_DETAILS_STATE,
              system_id: action.meta.item.system_id,
              loading: true,
              listeners: 1,
              fetchedAt: Date.now(),
            };
          }
        }
      },
    },
    getSuccess: {
      prepare: (
        item: { system_id: Machine[MachineMeta.PK] },
        callId: string,
        machine: MachineDetails
      ) => ({
        meta: {
          item,
          callId,
        },
        payload: machine,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<
          MachineDetails,
          string,
          GenericItemMeta<{ system_id: Machine[MachineMeta.PK] }>
        >
      ) => {
        const { callId } = action.meta;
        // Only update state if this call exists in the store. This check is required
        // because the call may have been cleaned up in the time the API takes
        // to respond.
        if (callId && callId in state.details) {
          const machine = action.payload;
          // If the item already exists, update it, otherwise
          // add it to the store.
          const i = state.items.findIndex(
            (draftItem: Machine) => draftItem.system_id === machine.system_id
          );
          if (i !== -1) {
            state.items[i] = machine;
          } else {
            state.items.push(machine);
            // Set up the statuses for this machine.
            state.statuses[machine.system_id] = DEFAULT_STATUSES;
          }
          state.details[callId].loading = false;
          state.details[callId].loaded = true;
        }
      },
    },
    getSummaryXml: {
      prepare: (params: GetSummaryXmlParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "get_summary_xml",
          // This request needs to store the results in the file context.
          fileContextKey: params.fileId,
          useFileContext: true,
        },
        payload: {
          params: {
            system_id: params.systemId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    getSummaryXmlError: statusHandlers.getSummaryXml.error,
    getSummaryXmlStart: statusHandlers.getSummaryXml.start,
    getSummaryXmlSuccess: statusHandlers.getSummaryXml.success,
    getSummaryYaml: {
      prepare: (params: GetSummaryYamlParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "get_summary_yaml",
          // This request needs to store the results in the file context.
          fileContextKey: params.fileId,
          useFileContext: true,
        },
        payload: {
          params: {
            system_id: params.systemId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    getSummaryYamlError: statusHandlers.getSummaryYaml.error,
    getSummaryYamlStart: statusHandlers.getSummaryYaml.start,
    getSummaryYamlSuccess: statusHandlers.getSummaryYaml.success,
    linkSubnet: {
      prepare: (params: LinkSubnetParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "link_subnet",
        },
        payload: {
          params: preparePayloadParams(params),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    linkSubnetError: statusHandlers.linkSubnet.error,
    linkSubnetStart: statusHandlers.linkSubnet.start,
    linkSubnetSuccess: statusHandlers.linkSubnet.success,
    [NodeActions.LOCK]: generateActionParams<BaseMachineActionParams>(
      NodeActions.LOCK
    ),
    [`${NodeActions.LOCK}Error`]: statusHandlers.lock.error,
    [`${NodeActions.LOCK}Start`]: statusHandlers.lock.start,
    [`${NodeActions.LOCK}Success`]: statusHandlers.lock.success,
    markBroken: generateActionParams<MarkBrokenParams>(NodeActions.MARK_BROKEN),
    markBrokenError: statusHandlers.markBroken.error,
    markBrokenStart: statusHandlers.markBroken.start,
    markBrokenSuccess: statusHandlers.markBroken.success,
    markFixed: generateActionParams<BaseMachineActionParams>(
      NodeActions.MARK_FIXED
    ),
    markFixedError: statusHandlers.markFixed.error,
    markFixedStart: statusHandlers.markFixed.start,
    markFixedSuccess: statusHandlers.markFixed.success,
    mountSpecial: {
      prepare: (params: MountSpecialParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "mount_special",
        },
        payload: {
          params: {
            fstype: params.fstype,
            mount_options: params.mountOptions,
            mount_point: params.mountPoint,
            system_id: params.systemId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    mountSpecialError: statusHandlers.mountSpecial.error,
    mountSpecialStart: statusHandlers.mountSpecial.start,
    mountSpecialSuccess: statusHandlers.mountSpecial.success,
    [NodeActions.OFF]: generateActionParams<BaseMachineActionParams>(
      NodeActions.OFF
    ),
    [`${NodeActions.OFF}Error`]: statusHandlers.off.error,
    [`${NodeActions.OFF}Start`]: statusHandlers.off.start,
    [`${NodeActions.OFF}Success`]: statusHandlers.off.success,
    [NodeActions.ON]: generateActionParams<BaseMachineActionParams>(
      NodeActions.ON
    ),
    [`${NodeActions.ON}Error`]: statusHandlers.on.error,
    [`${NodeActions.ON}Start`]: statusHandlers.on.start,
    [`${NodeActions.ON}Success`]: statusHandlers.on.success,
    overrideFailedTesting: generateActionParams<OverrideFailedTesting>(
      NodeActions.OVERRIDE_FAILED_TESTING
    ),
    overrideFailedTestingError: statusHandlers.overrideFailedTesting.error,
    overrideFailedTestingStart: statusHandlers.overrideFailedTesting.start,
    overrideFailedTestingSuccess: statusHandlers.overrideFailedTesting.success,
    [NodeActions.RELEASE]: generateActionParams<ReleaseParams>(
      NodeActions.RELEASE
    ),
    [`${NodeActions.RELEASE}Error`]: statusHandlers.release.error,
    [`${NodeActions.RELEASE}Start`]: statusHandlers.release.start,
    [`${NodeActions.RELEASE}Success`]: statusHandlers.release.success,
    removeRequest: {
      prepare: (callId: string) => ({
        meta: {
          callId,
        },
        payload: null,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<null, string, GenericMeta>
      ) => {
        const { callId } = action.meta;
        if (callId) {
          if (callId in state.details) {
            delete state.details[callId];
          } else if (callId in state.actions) {
            delete state.actions[callId];
          }
        }
      },
    },
    rescueMode: generateActionParams<BaseMachineActionParams>(
      NodeActions.RESCUE_MODE
    ),
    rescueModeError: statusHandlers.rescueMode.error,
    rescueModeStart: statusHandlers.rescueMode.start,
    rescueModeSuccess: statusHandlers.rescueMode.success,
    setActive: {
      prepare: (system_id: Machine[MachineMeta.PK] | null) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "set_active",
        },
        payload: {
          // Server unsets active item if primary key (system_id) is not sent.
          params: system_id ? { system_id } : null,
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    setActiveError: (
      state: MachineState,
      action: PayloadAction<MachineState["errors"]>
    ) => {
      state.active = null;
      state.errors = action.payload;
      state = setErrors(state, action, "setActive");
    },
    setActiveSuccess: (
      state: MachineState,
      action: PayloadAction<Machine | null>
    ) => {
      state.active = action.payload?.system_id || null;
    },
    setBootDisk: {
      prepare: (params: SetBootDiskParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "set_boot_disk",
        },
        payload: {
          params: {
            block_id: params.blockId,
            system_id: params.systemId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    setBootDiskError: statusHandlers.setBootDisk.error,
    setBootDiskStart: statusHandlers.setBootDisk.start,
    setBootDiskSuccess: statusHandlers.setBootDisk.success,
    setPool: generateActionParams<SetPoolParams>(NodeActions.SET_POOL),
    setPoolError: statusHandlers.setPool.error,
    setPoolStart: statusHandlers.setPool.start,
    setPoolSuccess: statusHandlers.setPool.success,
    setSelected: {
      prepare: (selected: SelectedMachines | null) => ({
        payload: selected,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<SelectedMachines | null>
      ) => {
        state.selected = action.payload;
      },
    },
    setZone: generateActionParams<SetZoneParams>(NodeActions.SET_ZONE),
    setZoneError: statusHandlers.setZone.error,
    setZoneStart: statusHandlers.setZone.start,
    setZoneSuccess: statusHandlers.setZone.success,
    suppressScriptResults: {
      prepare: (
        machineID: Machine[MachineMeta.PK],
        scripts: ScriptResult[]
      ) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "set_script_result_suppressed",
        },
        payload: {
          params: {
            system_id: machineID,
            script_result_ids: scripts.map((script) => script.id),
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    [NodeActions.TAG]: generateActionParams<TagParams>(NodeActions.TAG),
    [`${NodeActions.TAG}Error`]: statusHandlers.tag.error,
    [`${NodeActions.TAG}Start`]: statusHandlers.tag.start,
    [`${NodeActions.TAG}Success`]: statusHandlers.tag.success,
    [NodeActions.TEST]: generateActionParams<TestParams>(NodeActions.TEST),
    [`${NodeActions.TEST}Error`]: statusHandlers.test.error,
    [`${NodeActions.TEST}Start`]: statusHandlers.test.start,
    [`${NodeActions.TEST}Success`]: statusHandlers.test.success,
    [NodeActions.UNLOCK]: generateActionParams<BaseMachineActionParams>(
      NodeActions.UNLOCK
    ),
    [`${NodeActions.UNLOCK}Error`]: statusHandlers.unlock.error,
    [`${NodeActions.UNLOCK}Start`]: statusHandlers.unlock.start,
    [`${NodeActions.UNLOCK}Success`]: statusHandlers.unlock.success,
    unlinkSubnet: {
      prepare: (params: UnlinkSubnetParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "unlink_subnet",
        },
        payload: {
          params: {
            interface_id: params.interfaceId,
            link_id: params.linkId,
            system_id: params.systemId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    unlinkSubnetError: statusHandlers.unlinkSubnet.error,
    unlinkSubnetStart: statusHandlers.unlinkSubnet.start,
    unlinkSubnetSuccess: statusHandlers.unlinkSubnet.success,
    unmountSpecial: {
      prepare: (params: UnmountSpecialParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "unmount_special",
        },
        payload: {
          params: {
            mount_point: params.mountPoint,
            system_id: params.systemId,
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    unmountSpecialError: statusHandlers.unmountSpecial.error,
    unmountSpecialStart: statusHandlers.unmountSpecial.start,
    unmountSpecialSuccess: statusHandlers.unmountSpecial.success,
    unsuppressScriptResults: {
      prepare: (
        machineID: Machine[MachineMeta.PK],
        scripts: ScriptResult[]
      ) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "set_script_result_unsuppressed",
        },
        payload: {
          params: {
            system_id: machineID,
            script_result_ids: scripts.map((script) => script.id),
          },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    unsubscribe: {
      prepare: (ids: Machine[MachineMeta.PK][]) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "unsubscribe",
        },
        payload: {
          params: { system_ids: ids },
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    unsubscribeError: (
      state: MachineState,
      action: PayloadAction<MachineState["errors"]>
    ) => {
      state.errors = action.payload;
      state = setErrors(state, action, "unsubscribe");
    },
    unsubscribeStart: {
      prepare: (ids: Machine[MachineMeta.PK][]) => ({
        meta: {
          item: { system_ids: ids },
        },
        payload: null,
      }),
      reducer: (
        state: MachineState,
        action: PayloadAction<
          null,
          string,
          GenericItemMeta<{ system_ids: Machine[MachineMeta.PK][] }>
        >
      ) => {
        action.meta.item.system_ids.forEach((id) => {
          if (state.statuses[id]) {
            state.statuses[id].unsubscribing = true;
          }
        });
      },
    },
    unsubscribeSuccess: (
      state: MachineState,
      action: PayloadAction<Machine[MachineMeta.PK][]>
    ) => {
      action.payload.forEach((id) => {
        // Clean up the statuses for model.
        delete state.statuses[id];
      });
    },
    [NodeActions.UNTAG]: generateActionParams<UntagParams>(NodeActions.UNTAG),
    untagError: statusHandlers.untag.error,
    untagStart: statusHandlers.untag.start,
    untagSuccess: statusHandlers.untag.success,
    updateDisk: {
      prepare: (params: UpdateDiskParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "update_disk",
        },
        payload: {
          params: preparePayloadParams(params, {
            blockId: "block_id",
            mountOptions: "mount_options",
            mountPoint: "mount_point",
            systemId: MachineMeta.PK,
          }),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    updateDiskError: statusHandlers.updateDisk.error,
    updateDiskStart: statusHandlers.updateDisk.start,
    updateDiskSuccess: statusHandlers.updateDisk.success,
    updateFilesystem: {
      prepare: (params: UpdateFilesystemParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "update_filesystem",
        },
        payload: {
          params: preparePayloadParams(params, {
            blockId: "block_id",
            mountOptions: "mount_options",
            mountPoint: "mount_point",
            partitionId: "partition_id",
            systemId: MachineMeta.PK,
          }),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    updateFilesystemError: statusHandlers.updateFilesystem.error,
    updateFilesystemStart: statusHandlers.updateFilesystem.start,
    updateFilesystemSuccess: statusHandlers.updateFilesystem.success,
    updateInterface: {
      prepare: (
        // This update endpoint is used for updating all interface types so
        // must allow all possible parameters.
        params: UpdateInterfaceParams
      ) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "update_interface",
        },
        payload: {
          params: preparePayloadParams(params),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    updateInterfaceError: statusHandlers.updateInterface.error,
    updateInterfaceStart: statusHandlers.updateInterface.start,
    updateInterfaceSuccess: statusHandlers.updateInterface.success,
    updateNotify: (
      state: MachineState,
      action: PayloadAction<MachineState["items"][0]>
    ) => {
      generateCommonReducers<
        MachineState,
        MachineMeta.PK,
        CreateParams,
        UpdateParams
      >(MachineMeta.MODEL, MachineMeta.PK, setErrors).updateNotify(
        state,
        action
      );
      // infer the new grouping value for each machine list
      // based on machine details sent as notification payload
      Object.keys(state.lists).forEach((callId: string) => {
        const list: MachineStateList = state.lists[callId];
        let groups: MachineStateListGroup[] = list.groups ?? [];
        const groupBy = list.params?.group_key ?? "";
        const machine = action.payload;

        // if groupBy is empty string, then we don't need to do anything
        if (groupBy === "") {
          return;
        }

        const currentMachineListGroup = groups?.find((group) =>
          group.items.some((systemId) => systemId === action.payload.system_id)
        );
        // get the right value from action.payload based on the groupKey
        const newMachineListGroup = createMachineListGroup({
          groupBy,
          machine,
        });

        if (!currentMachineListGroup || !newMachineListGroup) {
          return;
        }

        // update the groups if machine grouping changed
        if (currentMachineListGroup.value !== newMachineListGroup.value) {
          // remove machine from the current group
          groups = groups.map((group) => {
            if (group.value === currentMachineListGroup.value) {
              return {
                ...group,
                items: group.items.filter(
                  (item) => item !== action.payload.system_id
                ),
                // decrement count by 1 if count is known,
                // otherwise set to null indicating it needs to be fetched
                count: group.count ? group.count - 1 : null,
              };
            }
            return group;
          });

          // add machine to the new group
          const newGroupExists = groups.find(
            (group) => group.value === newMachineListGroup.value
          );
          if (newGroupExists) {
            groups = groups.map((group) => {
              if (group.value === newMachineListGroup.value) {
                return {
                  ...group,
                  items: [...group.items, action.payload.system_id],
                  // increment count by 1 if count is known,
                  // otherwise set to null indicating it needs to be fetched
                  count: group.count ? group.count + 1 : null,
                };
              }
              return group;
            });
          } else {
            // if the group does not exist create it
            groups.push({
              name: newMachineListGroup.name,
              value: newMachineListGroup.value,
              items: [action.payload.system_id],
              // set count to null indicating it's unknown and needs to be fetched
              count: null,
              collapsed: false,
            });
          }

          // remove any empty groups
          groups = groups.filter((group) => group.items.length > 0);

          // update the list
          list.groups = groups;
        }
      });

      // machine update can affect counts of filtered machine lists
      // - mark all filtered machine counts as stale indicating they need to be fetched
      Object.keys(state.counts).forEach((callId) => {
        if (state.counts[callId].params !== null) {
          state.counts[callId].stale = true;
        }
      });
    },
    updateVmfsDatastore: {
      prepare: (params: UpdateVmfsDatastoreParams) => ({
        meta: {
          model: MachineMeta.MODEL,
          method: "update_vmfs_datastore",
        },
        payload: {
          params: preparePayloadParams(params, {
            blockDeviceIds: "add_block_devices",
            partitionIds: "add_partitions",
            systemId: MachineMeta.PK,
            vmfsDatastoreId: "vmfs_datastore_id",
          }),
        },
      }),
      reducer: () => {
        // No state changes need to be handled for this action.
      },
    },
    updateVmfsDatastoreError: statusHandlers.updateVmfsDatastore.error,
    updateVmfsDatastoreStart: statusHandlers.updateVmfsDatastore.start,
    updateVmfsDatastoreSuccess: statusHandlers.updateVmfsDatastore.success,
  },
});

export const { actions } = machineSlice;

export default machineSlice.reducer;
