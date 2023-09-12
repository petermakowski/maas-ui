import KVMForms from "./KVMForms";

import { KVMSidePanelViews } from "@/app/kvm/constants";
import { MachineSidePanelViews } from "@/app/machines/constants";
import { PodType } from "@/app/store/pod/constants";
import zoneSelectors from "@/app/store/zone/selectors";
import {
  domainState as domainStateFactory,
  fabricState as fabricStateFactory,
  generalState as generalStateFactory,
  podDetails as podDetailsFactory,
  podState as podStateFactory,
  podStatus as podStatusFactory,
  powerType as powerTypeFactory,
  powerTypesState as powerTypesStateFactory,
  resourcePoolState as resourcePoolStateFactory,
  rootState as rootStateFactory,
  spaceState as spaceStateFactory,
  subnetState as subnetStateFactory,
  vlanState as vlanStateFactory,
  vmCluster as vmClusterFactory,
  vmClusterState as vmClusterStateFactory,
  zone as zoneFactory,
  zoneState as zoneStateFactory,
} from "testing/factories";
import {
  getByTextContent,
  renderWithBrowserRouter,
  screen,
} from "testing/utils";

describe("KVMForms", () => {
  let state = rootStateFactory();

  beforeEach(() => {
    // "loaded" doesn't exist on ZoneState type, so we have to mock the return value here
    jest.spyOn(zoneSelectors, "loaded").mockReturnValue(true);

    state = rootStateFactory({
      domain: domainStateFactory({
        loaded: true,
      }),
      fabric: fabricStateFactory({
        loaded: true,
      }),
      general: generalStateFactory({
        powerTypes: powerTypesStateFactory({
          loaded: true,
          data: [powerTypeFactory({ name: PodType.VIRSH })],
        }),
      }),
      pod: podStateFactory({
        items: [
          podDetailsFactory({ id: 1, name: "pod-1", type: PodType.LXD }),
          podDetailsFactory({ id: 2, name: "pod-2", type: PodType.VIRSH }),
        ],
        statuses: {
          1: podStatusFactory(),
          2: podStatusFactory(),
        },
      }),
      resourcepool: resourcePoolStateFactory({
        loaded: true,
      }),
      space: spaceStateFactory({
        loaded: true,
      }),
      subnet: subnetStateFactory({
        loaded: true,
      }),
      vmcluster: vmClusterStateFactory({
        loaded: true,
        items: [vmClusterFactory({ id: 1, name: "cluster-1" })],
      }),
      vlan: vlanStateFactory({
        loaded: true,
      }),
      zone: zoneStateFactory({
        items: [zoneFactory({ id: 1 })],
      }),
    });
  });

  it("does not render if sidePanelContent is not defined", () => {
    renderWithBrowserRouter(
      <KVMForms setSidePanelContent={jest.fn()} sidePanelContent={null} />,
      { state }
    );
    expect(
      screen.queryByTestId("kvm-action-form-wrapper")
    ).not.toBeInTheDocument();
  });

  it("renders AddLxd if Add LXD host side panel content provided", () => {
    renderWithBrowserRouter(
      <KVMForms
        setSidePanelContent={jest.fn()}
        sidePanelContent={{ view: KVMSidePanelViews.ADD_LXD_HOST }}
      />,
      { state }
    );
    // Ensure AddLxd fields are shown
    expect(screen.getByText("Credentials")).toBeInTheDocument();
    expect(screen.getByText("Authentication")).toBeInTheDocument();
    expect(screen.getByText("Project selection")).toBeInTheDocument();

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Zone" })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Resource pool" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "LXD address" })
    ).toBeInTheDocument();

    expect(screen.getByText("Certificate")).toBeInTheDocument();
  });

  it("renders AddVirsh if Add Virsh host side panel content provided", () => {
    renderWithBrowserRouter(
      <KVMForms
        setSidePanelContent={jest.fn()}
        sidePanelContent={{ view: KVMSidePanelViews.ADD_VIRSH_HOST }}
      />,
      { state }
    );

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Zone" })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Resource pool" })
    ).toBeInTheDocument();
    state.general.powerTypes.data.forEach((powerType) => {
      powerType.fields.forEach((field) => {
        expect(
          screen.getByRole("textbox", { name: field.label })
        ).toBeInTheDocument();
      });
    });
  });

  it("renders ComposeForm if Compose side panel content and host id provided", () => {
    renderWithBrowserRouter(
      <KVMForms
        setSidePanelContent={jest.fn()}
        sidePanelContent={{
          view: KVMSidePanelViews.COMPOSE_VM,
          extras: { hostId: 1 },
        }}
      />,
      { state }
    );

    expect(
      screen.getByRole("textbox", { name: "VM name" })
    ).toBeInTheDocument();
    expect(screen.getByText("Cores")).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: "RAM (MiB)" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Show advanced/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Interfaces")).toBeInTheDocument();
    expect(screen.getByText("Storage configuration")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Compose machine" })
    ).toBeInTheDocument();
  });

  it("renders DeleteForm if delete side panel content and host id provided", () => {
    renderWithBrowserRouter(
      <KVMForms
        setSidePanelContent={jest.fn()}
        sidePanelContent={{
          view: KVMSidePanelViews.DELETE_KVM,
          extras: { hostId: 1 },
        }}
      />,
      { state }
    );

    expect(
      screen.getByText(
        "Once a KVM host is removed, you can still access all VMs in this project from the LXD server."
      )
    ).toBeInTheDocument();

    expect(
      getByTextContent(
        "Selecting this option will delete all VMs in pod-1 along with their storage."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Remove KVM host" })
    ).toBeInTheDocument();
  });

  it("renders DeleteForm if delete side panel content and cluster id provided", () => {
    renderWithBrowserRouter(
      <KVMForms
        setSidePanelContent={jest.fn()}
        sidePanelContent={{
          view: KVMSidePanelViews.DELETE_KVM,
          extras: { clusterId: 1 },
        }}
      />,
      { state }
    );
    expect(
      screen.getByText(
        "Once a cluster is removed, you can still access all VMs in this cluster from the LXD server."
      )
    ).toBeInTheDocument();

    expect(
      getByTextContent(
        "Selecting this option will delete all VMs in cluster-1 along with their storage."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Remove cluster" })
    ).toBeInTheDocument();
  });

  it("renders RefreshForm if refresh side panel content and host ids provided", () => {
    renderWithBrowserRouter(
      <KVMForms
        setSidePanelContent={jest.fn()}
        sidePanelContent={{
          view: KVMSidePanelViews.REFRESH_KVM,
          extras: { hostIds: [1] },
        }}
      />,
      { state }
    );

    expect(
      screen.getByText(
        "Refreshing KVM hosts will cause MAAS to recalculate usage metrics, update information about storage pools, and commission any machines present in the KVM hosts that are not yet known to MAAS."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Refresh KVM host" })
    ).toBeInTheDocument();
  });

  it("renders machine action forms if a machine action is selected", () => {
    state.machine.selected = { items: ["abc123"] };
    renderWithBrowserRouter(
      <KVMForms
        setSidePanelContent={jest.fn()}
        sidePanelContent={{ view: MachineSidePanelViews.DELETE_MACHINE }}
      />,
      { state }
    );
    expect(
      screen.getByText("Are you sure you want to delete a machine?")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete machine" })
    ).toBeInTheDocument();
  });

  it("renders machine action forms with selected machine count", () => {
    state.machine.selected = { items: ["abc123", "def456"] };
    renderWithBrowserRouter(
      <KVMForms
        setSidePanelContent={jest.fn()}
        sidePanelContent={{ view: MachineSidePanelViews.DELETE_MACHINE }}
      />,
      { state, route: "/kvm" }
    );

    expect(
      screen.getByText("Are you sure you want to delete 2 machines?")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Delete 2 machines/i })
    ).toBeInTheDocument();
  });
});
