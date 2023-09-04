import RAMColumn from "./RAMColumn";

import type { Pod } from "@/app/store/pod/types";
import type { RootState } from "@/app/store/root/types";
import {
  pod as podFactory,
  podMemoryResource as podMemoryResourceFactory,
  podResource as podResourceFactory,
  podResources as podResourcesFactory,
  podState as podStateFactory,
  rootState as rootStateFactory,
  vmClusterResource as vmClusterResourceFactory,
  vmClusterResourcesMemory as vmClusterResourcesMemoryFactory,
} from "testing/factories";
import { renderWithMockStore, screen } from "testing/utils";

describe("RAMColumn", () => {
  let state: RootState;
  let pod: Pod;

  beforeEach(() => {
    pod = podFactory({
      id: 1,
      name: "pod-1",
    });
    state = rootStateFactory({
      pod: podStateFactory({
        items: [pod],
      }),
    });
  });

  it("can display correct memory information without overcommit", () => {
    pod.memory_over_commit_ratio = 1;
    pod.resources = podResourcesFactory({
      memory: podMemoryResourceFactory({
        general: podResourceFactory({
          allocated_other: 1,
          allocated_tracked: 2,
          free: 3,
        }),
        hugepages: podResourceFactory({
          allocated_other: 4,
          allocated_tracked: 5,
          free: 6,
        }),
      }),
    });

    renderWithMockStore(
      <RAMColumn
        memory={pod.resources.memory}
        overCommit={pod.memory_over_commit_ratio}
      />,
      { state }
    );
    // Allocated tracked = 2 + 5 = 7
    // Total = (1 + 2 + 3) + (4 + 5 + 6) = 6 + 15 = 21
    expect(screen.getByText(/7 of 21B allocated/i)).toBeInTheDocument();
  });

  it("can display correct memory information with overcommit", () => {
    pod.memory_over_commit_ratio = 2;
    pod.resources = podResourcesFactory({
      memory: podMemoryResourceFactory({
        general: podResourceFactory({
          allocated_other: 1,
          allocated_tracked: 2,
          free: 3,
        }),
        hugepages: podResourceFactory({
          allocated_other: 4,
          allocated_tracked: 5,
          free: 6,
        }),
      }),
    });

    renderWithMockStore(
      <RAMColumn
        memory={pod.resources.memory}
        overCommit={pod.memory_over_commit_ratio}
      />,
      { state }
    );
    // Allocated tracked = 2 + 5 = 7
    // Hugepages do not take overcommit into account, so
    // Total = ((1 + 2 + 3) * 2) + (4 + 5 + 6) = 12 + 15 = 27
    expect(screen.getByText(/7 of 27B allocated/i)).toBeInTheDocument();
  });

  it("can display when memory has been overcommitted", () => {
    pod.memory_over_commit_ratio = 1;
    pod.resources = podResourcesFactory({
      memory: podMemoryResourceFactory({
        general: podResourceFactory({
          allocated_other: 0,
          allocated_tracked: 2,
          free: -1,
        }),
        hugepages: podResourceFactory({
          allocated_other: 0,
          allocated_tracked: 5,
          free: -1,
        }),
      }),
    });

    renderWithMockStore(
      <RAMColumn
        memory={pod.resources.memory}
        overCommit={pod.memory_over_commit_ratio}
      />,
      { state }
    );
    expect(screen.getByTestId("meter-overflow")).toBeInTheDocument();
    expect(screen.getByText(/7 of 5B allocated/i)).toBeInTheDocument();
  });

  it("can display correct memory for a vmcluster", () => {
    const memory = vmClusterResourcesMemoryFactory({
      general: vmClusterResourceFactory({
        allocated_other: 1,
        allocated_tracked: 2,
        free: 3,
      }),
      hugepages: vmClusterResourceFactory({
        allocated_other: 4,
        allocated_tracked: 5,
        free: 6,
      }),
    });

    renderWithMockStore(<RAMColumn memory={memory} />, {
      state,
    });
    expect(screen.getByText(/7 of 21B allocated/i)).toBeInTheDocument();
  });
});
