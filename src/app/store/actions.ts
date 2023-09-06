import { actions as auth } from "app/store/auth";
import { actions as bootresource } from "app/store/bootresource";
import { actions as config } from "app/store/config";
import { actions as controller } from "app/store/controller";
import { actions as device } from "app/store/device";
import { actions as dhcpsnippet } from "app/store/dhcpsnippet";
import { actions as discovery } from "app/store/discovery";
import { actions as domain } from "app/store/domain";
import { actions as event } from "app/store/event";
import { actions as fabric } from "app/store/fabric";
import { actions as general } from "app/store/general";
import { actions as iprange } from "app/store/iprange";
import { actions as licensekeys } from "app/store/licensekeys";
import { actions as machine } from "app/store/machine";
import { actions as message } from "app/store/message";
import { actions as nodedevice } from "app/store/nodedevice";
import { actions as nodescriptresult } from "app/store/nodescriptresult";
import { actions as notification } from "app/store/notification";
import { actions as packagerepository } from "app/store/packagerepository";
import { actions as pod } from "app/store/pod";
import { actions as resourcepool } from "app/store/resourcepool";
import { actions as script } from "app/store/script";
import { actions as scriptresult } from "app/store/scriptresult";
import { actions as service } from "app/store/service";
import { actions as space } from "app/store/space";
import { actions as sshkey } from "app/store/sshkey";
import { actions as sslkey } from "app/store/sslkey";
import { actions as staticroute } from "app/store/staticroute";
import { actions as status } from "app/store/status";
import { actions as subnet } from "app/store/subnet";
import { actions as tag } from "app/store/tag";
import { actions as token } from "app/store/token";
import { actions as user } from "app/store/user";
import { actions as vlan } from "app/store/vlan";
import { actions as vmcluster } from "app/store/vmcluster";
import { actions as zone } from "app/store/zone";

const actions = {
  auth,
  bootresource,
  config,
  controller,
  device,
  dhcpsnippet,
  discovery,
  domain,
  event,
  fabric,
  general,
  iprange,
  licensekeys,
  machine,
  message,
  nodedevice,
  nodescriptresult,
  notification,
  packagerepository,
  pod,
  resourcepool,
  script,
  scriptresult,
  service,
  space,
  sshkey,
  sslkey,
  staticroute,
  status,
  subnet,
  tag,
  token,
  user,
  vlan,
  vmcluster,
  zone,
} as const;

export const fetchActions = {
  bootresource,
  config,
  controller,
  device,
  dhcpsnippet,
  discovery,
  domain,
  event,
  fabric,
  general,
  iprange,
  licensekeys,
  machine,
  message,
  nodedevice,
  nodescriptresult,
  notification,
  packagerepository,
  pod,
  resourcepool,
  script,
  scriptresult,
  service,
  space,
  sshkey,
  sslkey,
  staticroute,
  status,
  subnet,
  tag,
  token,
  user,
  vlan,
  vmcluster,
  zone,
};

export default actions;
