import type { ReactNode } from "react";
import { useEffect } from "react";

import { Button, Icon, Spinner } from "@canonical/react-components";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom-v5-compat";

import urls from "@/app/base/urls";
import KVMDetailsHeader from "@/app/kvm/components/KVMDetailsHeader";
import { KVMSidePanelViews } from "@/app/kvm/constants";
import type { KVMSetSidePanelContent } from "@/app/kvm/types";
import { actions as podActions } from "@/app/store/pod";
import podSelectors from "@/app/store/pod/selectors";
import type { Pod } from "@/app/store/pod/types";
import type { RootState } from "@/app/store/root/types";
import { actions as zoneActions } from "@/app/store/zone";
import zoneSelectors from "@/app/store/zone/selectors";

type Props = {
  id: Pod["id"];
  setSidePanelContent: KVMSetSidePanelContent;
};

const LXDSingleDetailsHeader = ({
  id,
  setSidePanelContent,
}: Props): JSX.Element => {
  const dispatch = useDispatch();
  const location = useLocation();
  const pod = useSelector((state: RootState) =>
    podSelectors.getById(state, id)
  );
  const zone = useSelector((state: RootState) =>
    zoneSelectors.getById(state, pod?.zone)
  );

  useEffect(() => {
    dispatch(podActions.fetch());
    dispatch(zoneActions.fetch());
  }, [dispatch]);

  let title: ReactNode = <Spinner text="Loading..." />;
  if (pod) {
    title = pod.name;
  }

  return (
    <KVMDetailsHeader
      buttons={[
        <Button
          appearance="positive"
          disabled={!pod}
          hasIcon
          onClick={() => {
            setSidePanelContent({
              view: KVMSidePanelViews.REFRESH_KVM,
              extras: { hostIds: [id] },
            });
          }}
        >
          <Icon light name="restart" />
          <span>Refresh host</span>
        </Button>,
      ]}
      className="has-icon"
      loading={!pod}
      setSidePanelContent={setSidePanelContent}
      tabLinks={[
        {
          active: location.pathname.endsWith(urls.kvm.lxd.single.vms({ id })),
          component: Link,
          label: "Virtual machines",
          to: urls.kvm.lxd.single.vms({ id }),
        },
        {
          active: location.pathname.endsWith(
            urls.kvm.lxd.single.resources({ id })
          ),
          component: Link,
          label: "Resources",
          to: urls.kvm.lxd.single.resources({ id }),
        },
        {
          active: location.pathname.endsWith(urls.kvm.lxd.single.edit({ id })),
          component: Link,
          label: "KVM host settings",
          to: urls.kvm.lxd.single.edit({ id }),
        },
      ]}
      title={title}
      titleBlocks={
        pod
          ? [
              {
                title: (
                  <>
                    <Icon name="single-host" />
                    <span className="u-nudge-right--small">Single host</span>
                  </>
                ),
              },
              {
                title: "VMs:",
                subtitle: `${pod.resources.vm_count.tracked} available`,
              },
              {
                title: "AZ:",
                subtitle: zone?.name || <Spinner />,
              },
              {
                title: "LXD project:",
                subtitle: pod.power_parameters?.project,
              },
            ]
          : []
      }
    />
  );
};

export default LXDSingleDetailsHeader;
