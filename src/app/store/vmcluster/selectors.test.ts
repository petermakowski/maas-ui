import selectors from "./selectors";

import {
  rootState as rootStateFactory,
  vmClusterEventError as vmClusterEventErrorFactory,
  vmCluster as vmClusterFactory,
  vmClusterState as vmClusterStateFactory,
  vmClusterStatuses as vmClusterStatusesFactory,
} from "testing/factories";

describe("vmcluster selectors", () => {
  it("can get the items", () => {
    const items = [vmClusterFactory(), vmClusterFactory(), vmClusterFactory()];
    const state = rootStateFactory({
      vmcluster: vmClusterStateFactory({
        items,
      }),
    });
    expect(selectors.all(state)).toStrictEqual(items);
  });

  it("can get the statuses", () => {
    const statuses = vmClusterStatusesFactory();
    const state = rootStateFactory({
      vmcluster: vmClusterStateFactory({
        statuses,
      }),
    });
    expect(selectors.statuses(state)).toStrictEqual(statuses);
  });

  it("can get a status", () => {
    const statuses = vmClusterStatusesFactory({
      getting: true,
    });
    const state = rootStateFactory({
      vmcluster: vmClusterStateFactory({
        statuses,
      }),
    });
    expect(selectors.status(state, "getting")).toBe(true);
  });

  it("can get the event errors", () => {
    const eventErrors = [vmClusterEventErrorFactory()];
    const state = rootStateFactory({
      vmcluster: vmClusterStateFactory({
        eventErrors,
      }),
    });
    expect(selectors.eventErrors(state)).toStrictEqual(eventErrors);
  });

  it("can get an event error", () => {
    const eventError = vmClusterEventErrorFactory({
      event: "listByPhysicalCluster",
    });
    const state = rootStateFactory({
      vmcluster: vmClusterStateFactory({
        eventErrors: [eventError],
      }),
    });
    expect(selectors.eventError(state, "listByPhysicalCluster")).toStrictEqual([
      eventError,
    ]);
  });
});
