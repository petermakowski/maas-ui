import configureStore from "redux-mock-store";

import NumaResourcesCard from "./NumaResourcesCard";

import { actions as machineActions } from "app/store/machine";
import type { RootState } from "app/store/root/types";
import {
  machine as machineFactory,
  machineState as machineStateFactory,
  pod as podFactory,
  podNetworkInterface as podInterfaceFactory,
  podNuma as podNumaFactory,
  podNumaMemory as podNumaMemoryFactory,
  podNumaHugepageMemory as podNumaHugepageFactory,
  podResources as podResourcesFactory,
  podState as podStateFactory,
  podVM as podVmFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { renderWithMockStore, screen, within } from "testing/utils";

const mockStore = configureStore<RootState>();

describe("NumaResourcesCard", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches machines on load", () => {
    const numaNode = podNumaFactory({ node_id: 111 });
    const pod = podFactory({
      id: 1,
      resources: podResourcesFactory({
        numa: [numaNode],
      }),
    });
    const state = rootStateFactory({
      pod: podStateFactory({ items: [pod] }),
    });
    const store = mockStore(state);

    renderWithMockStore(<NumaResourcesCard numaId={111} podId={1} />, {
      store,
    });

    const expectedAction = machineActions.fetch("mocked-nanoid");
    expect(
      store.getActions().some((action) => action.type === expectedAction.type)
    ).toBe(true);
  });

  it("aggregates the individual NUMA hugepages memory", () => {
    const pod = podFactory({
      id: 1,
      resources: podResourcesFactory({
        numa: [
          podNumaFactory({
            memory: podNumaMemoryFactory({
              hugepages: [
                podNumaHugepageFactory({
                  allocated: 1,
                  free: 2,
                  page_size: 1024,
                }),
                podNumaHugepageFactory({
                  allocated: 4,
                  free: 5,
                  page_size: 1024,
                }),
              ],
            }),
            node_id: 11,
          }),
        ],
      }),
    });
    const state = rootStateFactory({
      pod: podStateFactory({ items: [pod] }),
    });

    renderWithMockStore(<NumaResourcesCard numaId={11} podId={1} />, { state });

    const hugepagesData = screen.getByTestId("hugepages-data");
    expect(within(hugepagesData).getByText("(Size: 1KiB)")).toBeInTheDocument();
    expect(within(hugepagesData).getAllByRole("cell")[1]).toHaveTextContent(
      "5B"
    ); // Allocated
    expect(within(hugepagesData).getAllByRole("cell")[2]).toHaveTextContent(
      "7B"
    ); // Free
  });

  it("filters interface resources to those that belong to the NUMA node", () => {
    const podInterfaces = [
      podInterfaceFactory({ id: 11, name: "eth0" }),
      podInterfaceFactory({ id: 22, name: "eth1" }),
      podInterfaceFactory({ id: 33, name: "eth2" }),
    ];
    const numaNode = podNumaFactory({ interfaces: [11, 33], node_id: 111 });
    const pod = podFactory({
      id: 1,
      resources: podResourcesFactory({
        interfaces: podInterfaces,
        numa: [numaNode],
      }),
    });
    const state = rootStateFactory({
      pod: podStateFactory({ items: [pod] }),
    });

    renderWithMockStore(<NumaResourcesCard numaId={111} podId={1} />, {
      state,
    });

    expect(screen.getByText(/eth0/i)).toBeInTheDocument();
    expect(screen.queryByText(/eth1/i)).not.toBeInTheDocument();
    expect(screen.getByText(/eth2/i)).toBeInTheDocument();
  });

  it("correctly filters VMs dropdown to those that belong to each NUMA node", () => {
    const podID = 1;
    const podName = "pod";
    const machines = [
      machineFactory({
        pod: { id: podID, name: podName },
        system_id: "abc123",
      }),
      machineFactory({
        pod: { id: podID, name: podName },
        system_id: "def456",
      }),
      machineFactory({
        pod: { id: podID, name: podName },
        system_id: "ghi789",
      }),
    ];
    const pod = podFactory({
      id: podID,
      name: podName,
      resources: podResourcesFactory({
        numa: [podNumaFactory({ node_id: 11, vms: [111, 333] })],
        vms: [
          podVmFactory({ id: 111, system_id: "abc123" }),
          podVmFactory({ id: 222, system_id: "def456" }),
          podVmFactory({ id: 333, system_id: "ghi789" }),
        ],
      }),
    });
    const state = rootStateFactory({
      machine: machineStateFactory({ items: machines }),
      pod: podStateFactory({ items: [pod] }),
    });
    const store = mockStore(state);

    renderWithMockStore(<NumaResourcesCard numaId={11} podId={1} />, { store });

    const expected = machineActions.fetch("mocked-nanoid");
    const result = store
      .getActions()
      .find((action) => action.type === expected.type);
    expect(result.payload.params.filter).toStrictEqual({
      id: [machines[0].system_id, machines[2].system_id],
      pod: [podName],
    });
  });
});
