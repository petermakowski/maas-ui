import type { RouterState } from "redux-first-history";

import type { VMClusterMeta, VMClusterState } from "../vmcluster/types";

import type {
  BootResourceMeta,
  BootResourceState,
} from "@/app/store/bootresource/types";
import type { ConfigMeta, ConfigState } from "@/app/store/config/types";
import type {
  ControllerMeta,
  ControllerState,
} from "@/app/store/controller/types";
import type { DeviceMeta, DeviceState } from "@/app/store/device/types";
import type {
  DHCPSnippetMeta,
  DHCPSnippetState,
} from "@/app/store/dhcpsnippet/types";
import type {
  DiscoveryMeta,
  DiscoveryState,
} from "@/app/store/discovery/types";
import type { DomainMeta, DomainState } from "@/app/store/domain/types";
import type { EventMeta, EventState } from "@/app/store/event/types";
import type { FabricMeta, FabricState } from "@/app/store/fabric/types";
import type { GeneralMeta, GeneralState } from "@/app/store/general/types";
import type { IPRangeMeta, IPRangeState } from "@/app/store/iprange/types";
import type {
  LicenseKeysMeta,
  LicenseKeysState,
} from "@/app/store/licensekeys/types";
import type { MachineMeta, MachineState } from "@/app/store/machine/types";
import type { MessageMeta, MessageState } from "@/app/store/message/types";
import type {
  NodeDeviceMeta,
  NodeDeviceState,
} from "@/app/store/nodedevice/types";
import type {
  NodeScriptResultMeta,
  NodeScriptResultState,
} from "@/app/store/nodescriptresult/types";
import type {
  NotificationMeta,
  NotificationState,
} from "@/app/store/notification/types";
import type {
  PackageRepositoryMeta,
  PackageRepositoryState,
} from "@/app/store/packagerepository/types";
import type { PodMeta, PodState } from "@/app/store/pod/types";
import type {
  ResourcePoolMeta,
  ResourcePoolState,
} from "@/app/store/resourcepool/types";
import type { ScriptMeta, ScriptState } from "@/app/store/script/types";
import type {
  ScriptResultMeta,
  ScriptResultState,
} from "@/app/store/scriptresult/types";
import type { ServiceMeta, ServiceState } from "@/app/store/service/types";
import type { SpaceMeta, SpaceState } from "@/app/store/space/types";
import type { SSHKeyMeta, SSHKeyState } from "@/app/store/sshkey/types";
import type { SSLKeyMeta, SSLKeyState } from "@/app/store/sslkey/types";
import type {
  StaticRouteMeta,
  StaticRouteState,
} from "@/app/store/staticroute/types";
import type { StatusMeta, StatusState } from "@/app/store/status/types";
import type { SubnetMeta, SubnetState } from "@/app/store/subnet/types";
import type { TagMeta, TagState } from "@/app/store/tag/types";
import type { TokenMeta, TokenState } from "@/app/store/token/types";
import type { UserMeta, UserState } from "@/app/store/user/types";
import type { VLANMeta, VLANState } from "@/app/store/vlan/types";
import type { ZoneMeta, ZoneState } from "@/app/store/zone/types";

export type RootState = {
  [BootResourceMeta.MODEL]: BootResourceState;
  [ConfigMeta.MODEL]: ConfigState;
  [ControllerMeta.MODEL]: ControllerState;
  [DeviceMeta.MODEL]: DeviceState;
  [DHCPSnippetMeta.MODEL]: DHCPSnippetState;
  [DiscoveryMeta.MODEL]: DiscoveryState;
  [DomainMeta.MODEL]: DomainState;
  [EventMeta.MODEL]: EventState;
  [FabricMeta.MODEL]: FabricState;
  [GeneralMeta.MODEL]: GeneralState;
  [IPRangeMeta.MODEL]: IPRangeState;
  [LicenseKeysMeta.MODEL]: LicenseKeysState;
  [MachineMeta.MODEL]: MachineState;
  [MessageMeta.MODEL]: MessageState;
  [NodeDeviceMeta.MODEL]: NodeDeviceState;
  [NodeScriptResultMeta.MODEL]: NodeScriptResultState;
  [NotificationMeta.MODEL]: NotificationState;
  [PackageRepositoryMeta.MODEL]: PackageRepositoryState;
  [PodMeta.MODEL]: PodState;
  [ResourcePoolMeta.MODEL]: ResourcePoolState;
  router: RouterState;
  [ScriptResultMeta.MODEL]: ScriptResultState;
  [ScriptMeta.MODEL]: ScriptState;
  [ServiceMeta.MODEL]: ServiceState;
  [SpaceMeta.MODEL]: SpaceState;
  [SSHKeyMeta.MODEL]: SSHKeyState;
  [SSLKeyMeta.MODEL]: SSLKeyState;
  [StaticRouteMeta.MODEL]: StaticRouteState;
  [StatusMeta.MODEL]: StatusState;
  [SubnetMeta.MODEL]: SubnetState;
  [TagMeta.MODEL]: TagState;
  [TokenMeta.MODEL]: TokenState;
  [UserMeta.MODEL]: UserState;
  [VLANMeta.MODEL]: VLANState;
  [VMClusterMeta.MODEL]: VMClusterState;
  [ZoneMeta.MODEL]: ZoneState;
};
