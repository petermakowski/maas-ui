import machine from "./selectors";
import { FilterGroupKey } from "./types";

import { NetworkInterfaceTypes } from "@/app/store/types/enum";
import { NodeActions, NodeStatusCode } from "@/app/store/types/node";
import { callId, enableCallIdMocks } from "testing/callId-mock";
import {
  machineDetails as machineDetailsFactory,
  machineEventError as machineEventErrorFactory,
  machine as machineFactory,
  machineFilterGroup as machineFilterGroupFactory,
  machineInterface as machineInterfaceFactory,
  machineStateCount as machineStateCountFactory,
  machineStateCounts as machineStateCountsFactory,
  machineStateDetailsItem as machineStateDetailsItemFactory,
  machineState as machineStateFactory,
  machineStateList as machineStateListFactory,
  machineStateListGroup as machineStateListGroupFactory,
  machineStatuses as machineStatusesFactory,
  machineStatus as machineStatusFactory,
  networkLink as networkLinkFactory,
  rootState as rootStateFactory,
} from "testing/factories";

enableCallIdMocks();

describe("machine selectors", () => {
  it("can get all items", () => {
    const items = [machineFactory(), machineFactory()];
    const state = rootStateFactory({
      machine: machineStateFactory({
        items,
      }),
    });
    expect(machine.all(state)).toEqual(items);
  });

  it("can get the loading state", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        loading: true,
      }),
    });
    expect(machine.loading(state)).toEqual(true);
  });

  it("can get the loaded state", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        loaded: true,
      }),
    });
    expect(machine.loaded(state)).toEqual(true);
  });

  it("can get the saving state", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        saving: true,
      }),
    });
    expect(machine.saving(state)).toEqual(true);
  });

  it("can get the saved state", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        saved: true,
      }),
    });
    expect(machine.saved(state)).toEqual(true);
  });

  it("can get the active machine's system ID", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        active: "abc123",
      }),
    });
    expect(machine.activeID(state)).toEqual("abc123");
  });

  it("can get the active machine", () => {
    const activeMachine = machineFactory();
    const state = rootStateFactory({
      machine: machineStateFactory({
        active: activeMachine.system_id,
        items: [activeMachine],
      }),
    });
    expect(machine.active(state)).toEqual(activeMachine);
  });

  it("can get the selected machines", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        selected: { items: ["abc123", "def456"] },
      }),
    });
    expect(machine.selected(state)).toStrictEqual({
      items: ["abc123", "def456"],
    });
  });

  it("can get the errors state", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        errors: "Data is incorrect",
      }),
    });
    expect(machine.errors(state)).toStrictEqual("Data is incorrect");
  });

  it("can get a machine by id", () => {
    const items = [
      machineFactory({ system_id: "808" }),
      machineFactory({ system_id: "909" }),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        items,
      }),
    });
    expect(machine.getById(state, "909")).toStrictEqual(items[1]);
  });

  it("can get machines by status code", () => {
    const items = [
      machineFactory({ status_code: NodeStatusCode.DISK_ERASING }),
      machineFactory({ status_code: NodeStatusCode.BROKEN }),
      machineFactory({ status_code: NodeStatusCode.DISK_ERASING }),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        items,
      }),
    });
    expect(
      machine.getByStatusCode(state, NodeStatusCode.DISK_ERASING)
    ).toStrictEqual([items[0], items[2]]);
  });

  it("can get the machine statuses", () => {
    const statuses = machineStatusesFactory();
    const state = rootStateFactory({
      machine: machineStateFactory({
        statuses,
      }),
    });
    expect(machine.statuses(state)).toStrictEqual(statuses);
  });

  it("can get the statuses for a machine", () => {
    const machineStatuses = machineStatusFactory();
    const state = rootStateFactory({
      machine: machineStateFactory({
        statuses: machineStatusesFactory({
          abc123: machineStatuses,
        }),
      }),
    });
    expect(machine.getStatuses(state, "abc123")).toStrictEqual(machineStatuses);
  });

  it("can get a status for a machine", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: [machineFactory({ system_id: "abc123" })],
        statuses: machineStatusesFactory({
          abc123: machineStatusFactory({ creatingPhysical: true }),
        }),
      }),
    });
    expect(
      machine.getStatusForMachine(state, "abc123", "creatingPhysical")
    ).toBe(true);
  });

  it("can get machines that are processing", () => {
    const statuses = machineStatusesFactory({
      abc123: machineStatusFactory({ testing: true }),
      def456: machineStatusFactory(),
    });
    const state = rootStateFactory({
      machine: machineStateFactory({
        statuses,
      }),
    });
    expect(machine.processing(state)).toStrictEqual(["abc123"]);
  });

  it("can get machines that are tagging", () => {
    const machines = [
      machineFactory({ system_id: "abc123" }),
      machineFactory({ system_id: "def456" }),
    ];
    const statuses = machineStatusesFactory({
      abc123: machineStatusFactory({ tagging: true }),
      def456: machineStatusFactory(),
    });
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: machines,
        statuses,
      }),
    });
    expect(machine.tagging(state)).toStrictEqual([machines[0]]);
  });

  it("can get machines that are untagging", () => {
    const machines = [
      machineFactory({ system_id: "abc123" }),
      machineFactory({ system_id: "def456" }),
    ];
    const statuses = machineStatusesFactory({
      abc123: machineStatusFactory({ untagging: true }),
      def456: machineStatusFactory(),
    });
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: machines,
        statuses,
      }),
    });
    expect(machine.untagging(state)).toStrictEqual([machines[0]]);
  });

  it("can get machines that are either tagging or untagging", () => {
    const machines = [
      machineFactory({ system_id: "abc123" }),
      machineFactory({ system_id: "def456" }),
      machineFactory({ system_id: "ghi789" }),
    ];
    const statuses = machineStatusesFactory({
      abc123: machineStatusFactory({ tagging: true }),
      def456: machineStatusFactory({ untagging: true }),
      ghi789: machineStatusFactory(),
    });
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: machines,
        statuses,
      }),
    });
    expect(machine.updatingTags(state)).toStrictEqual([
      machines[0],
      machines[1],
    ]);
  });

  it("can get machines that are saving pools", () => {
    const items = [
      machineFactory({ system_id: "808" }),
      machineFactory({ system_id: "909" }),
    ];
    const statuses = machineStatusesFactory({
      "808": machineStatusFactory(),
      "909": machineStatusFactory({ settingPool: true }),
    });
    const state = rootStateFactory({
      machine: machineStateFactory({
        items,
        statuses,
      }),
    });
    expect(machine.settingPool(state)).toStrictEqual([items[1]]);
  });

  it("can get machines that are deleting interfaces", () => {
    const items = [
      machineFactory({ system_id: "808" }),
      machineFactory({ system_id: "909" }),
    ];
    const statuses = machineStatusesFactory({
      "808": machineStatusFactory(),
      "909": machineStatusFactory({ deletingInterface: true }),
    });
    const state = rootStateFactory({
      machine: machineStateFactory({
        items,
        statuses,
      }),
    });
    expect(machine.deletingInterface(state)).toStrictEqual([items[1]]);
  });

  it("can get machines that are linking subnets", () => {
    const items = [
      machineFactory({ system_id: "808" }),
      machineFactory({ system_id: "909" }),
    ];
    const statuses = machineStatusesFactory({
      "808": machineStatusFactory(),
      "909": machineStatusFactory({ linkingSubnet: true }),
    });
    const state = rootStateFactory({
      machine: machineStateFactory({
        items,
        statuses,
      }),
    });
    expect(machine.linkingSubnet(state)).toStrictEqual([items[1]]);
  });

  it("can get machines that are unlinking subnets", () => {
    const items = [
      machineFactory({ system_id: "808" }),
      machineFactory({ system_id: "909" }),
    ];
    const statuses = machineStatusesFactory({
      "808": machineStatusFactory(),
      "909": machineStatusFactory({ unlinkingSubnet: true }),
    });
    const state = rootStateFactory({
      machine: machineStateFactory({
        items,
        statuses,
      }),
    });
    expect(machine.unlinkingSubnet(state)).toStrictEqual([items[1]]);
  });

  it("can get machines that are creating physical interfaces", () => {
    const items = [
      machineFactory({ system_id: "808" }),
      machineFactory({ system_id: "909" }),
    ];
    const statuses = machineStatusesFactory({
      "808": machineStatusFactory(),
      "909": machineStatusFactory({ creatingPhysical: true }),
    });
    const state = rootStateFactory({
      machine: machineStateFactory({
        items,
        statuses,
      }),
    });
    expect(machine.creatingPhysical(state)).toStrictEqual([items[1]]);
  });

  it("can get all event errors", () => {
    const machineEventErrors = [
      machineEventErrorFactory(),
      machineEventErrorFactory(),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        eventErrors: machineEventErrors,
      }),
    });
    expect(machine.eventErrors(state)).toStrictEqual(machineEventErrors);
  });

  it("can get event errors for a machine", () => {
    const machineEventErrors = [
      machineEventErrorFactory({ id: "abc123" }),
      machineEventErrorFactory(),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        eventErrors: machineEventErrors,
      }),
    });
    expect(machine.eventErrorsForIds(state, "abc123")).toStrictEqual([
      machineEventErrors[0],
    ]);
  });

  it("can get event errors for a machine and a provided event", () => {
    const machineEventErrors = [
      machineEventErrorFactory({ id: "abc123", event: NodeActions.TAG }),
      machineEventErrorFactory({ event: NodeActions.TAG }),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        eventErrors: machineEventErrors,
      }),
    });
    expect(machine.eventErrorsForIds(state, "abc123")).toStrictEqual([
      machineEventErrors[0],
    ]);
  });

  it("can get event errors for a machine and no event", () => {
    const machineEventErrors = [
      machineEventErrorFactory({ id: "abc123", event: null }),
      machineEventErrorFactory({ id: "abc123", event: NodeActions.TAG }),
      machineEventErrorFactory({ event: null }),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        eventErrors: machineEventErrors,
      }),
    });
    expect(machine.eventErrorsForIds(state, "abc123", null)).toStrictEqual([
      machineEventErrors[0],
    ]);
  });

  it("can get event errors for a machine and multiple events", () => {
    const machineEventErrors = [
      machineEventErrorFactory({ id: "abc123", event: NodeActions.TAG }),
      machineEventErrorFactory({ id: "abc123", event: NodeActions.UNTAG }),
      machineEventErrorFactory({ id: "abc123", event: NodeActions.ABORT }),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        eventErrors: machineEventErrors,
      }),
    });
    expect(
      machine.eventErrorsForIds(state, "abc123", [
        NodeActions.TAG,
        NodeActions.UNTAG,
      ])
    ).toStrictEqual([machineEventErrors[0], machineEventErrors[1]]);
  });

  it("can get event errors for multiple machines", () => {
    const machineEventErrors = [
      machineEventErrorFactory({ id: "abc123" }),
      machineEventErrorFactory({ id: "def456" }),
      machineEventErrorFactory(),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        eventErrors: machineEventErrors,
      }),
    });
    expect(
      machine.eventErrorsForIds(state, ["abc123", "def456"])
    ).toStrictEqual([machineEventErrors[0], machineEventErrors[1]]);
  });

  it("can get event errors for multiple machines and a provided event", () => {
    const machineEventErrors = [
      machineEventErrorFactory({ id: "abc123", event: NodeActions.TAG }),
      machineEventErrorFactory({ id: "def456", event: NodeActions.TAG }),
      machineEventErrorFactory({ event: NodeActions.TAG }),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        eventErrors: machineEventErrors,
      }),
    });
    expect(
      machine.eventErrorsForIds(state, ["abc123", "def456"], NodeActions.TAG)
    ).toStrictEqual([machineEventErrors[0], machineEventErrors[1]]);
  });

  it("can get event errors for multiple machines and no event", () => {
    const machineEventErrors = [
      machineEventErrorFactory({ id: "abc123", event: null }),
      machineEventErrorFactory({ id: "def456", event: null }),
      machineEventErrorFactory({ id: "abc123", event: NodeActions.TAG }),
      machineEventErrorFactory({ id: "def456", event: NodeActions.TAG }),
      machineEventErrorFactory({ event: null }),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        eventErrors: machineEventErrors,
      }),
    });
    expect(
      machine.eventErrorsForIds(state, ["abc123", "def456"], null)
    ).toStrictEqual([machineEventErrors[0], machineEventErrors[1]]);
  });

  it("can get machine count", () => {
    const machines = [machineFactory(), machineFactory()];
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: [...machines, machineFactory()],
        counts: machineStateCountsFactory({
          "mocked-nanoid": machineStateCountFactory({
            count: 2,
            loaded: true,
            loading: false,
          }),
        }),
      }),
    });
    expect(machine.count(state, "mocked-nanoid")).toStrictEqual(2);
    expect(machine.countLoaded(state, "mocked-nanoid")).toStrictEqual(true);
    expect(machine.countLoading(state, "mocked-nanoid")).toStrictEqual(false);
  });

  it("can get machine filters", () => {
    const filters = [machineFilterGroupFactory()];
    const state = rootStateFactory({
      machine: machineStateFactory({
        filters,
      }),
    });
    expect(machine.filters(state)).toStrictEqual(filters);
  });

  it("can get filters loaded state", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        filtersLoaded: true,
      }),
    });
    expect(machine.filtersLoaded(state)).toBe(true);
  });

  it("can get filters loading state", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        filtersLoading: true,
      }),
    });
    expect(machine.filtersLoading(state)).toBe(true);
  });

  it("can get machine filter options", () => {
    const options = [{ key: "option1", label: "Option 1" }];
    const state = rootStateFactory({
      machine: machineStateFactory({
        filters: [
          machineFilterGroupFactory({
            key: FilterGroupKey.AgentName,
            options,
          }),
        ],
      }),
    });
    expect(
      machine.filterOptions(state, FilterGroupKey.AgentName)
    ).toStrictEqual(options);
  });

  it("sorts filter options", () => {
    const options = [
      { key: "option10", label: "Option 10" },
      { key: "anoption", label: "An option" },
      { key: "option1", label: "Option 1" },
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        filters: [
          machineFilterGroupFactory({
            key: FilterGroupKey.AgentName,
            options,
          }),
        ],
      }),
    });
    expect(
      machine.filterOptions(state, FilterGroupKey.AgentName)
    ).toStrictEqual([options[1], options[2], options[0]]);
  });

  it("can get filter options loaded state", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        filters: [
          machineFilterGroupFactory({
            key: FilterGroupKey.AgentName,
            loaded: true,
          }),
        ],
      }),
    });
    expect(machine.filterOptionsLoaded(state, FilterGroupKey.AgentName)).toBe(
      true
    );
  });

  it("can get filter options loading state", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        filters: [
          machineFilterGroupFactory({
            key: FilterGroupKey.AgentName,
            loading: true,
          }),
        ],
      }),
    });
    expect(machine.filterOptionsLoading(state, FilterGroupKey.AgentName)).toBe(
      true
    );
  });

  it("can get items in a list", () => {
    const machines = [machineFactory(), machineFactory()];
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: [...machines, machineFactory()],
        lists: {
          [callId]: machineStateListFactory({
            loading: true,
            groups: [
              machineStateListGroupFactory({
                items: machines.map(({ system_id }) => system_id),
              }),
            ],
          }),
        },
      }),
    });
    expect(machine.list(state, callId)).toStrictEqual(machines);
  });

  it("can get the count for a list", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        lists: {
          [callId]: machineStateListFactory({
            count: 5,
          }),
        },
      }),
    });
    expect(machine.listCount(state, callId)).toBe(5);
  });

  it("can get a group in a list", () => {
    const groups = [
      machineStateListGroupFactory({
        name: "admin1",
      }),
      machineStateListGroupFactory({
        name: "admin2",
      }),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        lists: {
          [callId]: machineStateListFactory({
            groups,
          }),
        },
      }),
    });
    expect(machine.listGroups(state, callId)).toStrictEqual(groups);
  });

  it("can get all groups in a list", () => {
    const groups = [
      machineStateListGroupFactory({
        name: "admin1",
      }),
      machineStateListGroupFactory({
        name: "admin2",
      }),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        lists: {
          [callId]: machineStateListFactory({
            groups,
          }),
        },
      }),
    });
    expect(machine.listGroup(state, callId, "admin2")).toStrictEqual(groups[1]);
  });

  it("can get a nullish group in a list", () => {
    const groups = [
      machineStateListGroupFactory({
        name: "admin1",
      }),
      machineStateListGroupFactory({
        name: "",
      }),
    ];
    const state = rootStateFactory({
      machine: machineStateFactory({
        lists: {
          [callId]: machineStateListFactory({
            groups,
          }),
        },
      }),
    });
    expect(machine.listGroup(state, callId, "")).toStrictEqual(groups[1]);
  });

  it("can get the loaded state for a list", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        lists: {
          [callId]: machineStateListFactory({
            loaded: true,
          }),
        },
      }),
    });
    expect(machine.listLoaded(state, callId)).toBe(true);
  });

  it("can get the loading state for a list", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        lists: {
          [callId]: machineStateListFactory({
            loading: true,
          }),
        },
      }),
    });
    expect(machine.listLoading(state, callId)).toBe(true);
  });

  it("can get an interface by id", () => {
    const nic = machineInterfaceFactory({
      type: NetworkInterfaceTypes.PHYSICAL,
    });
    const node = machineDetailsFactory({
      interfaces: [nic],
    });
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: [node],
      }),
    });
    expect(
      machine.getInterfaceById(state, node.system_id, nic.id)
    ).toStrictEqual(nic);
  });

  it("can get an interface by link id", () => {
    const link = networkLinkFactory();
    const nic = machineInterfaceFactory({
      links: [link],
      type: NetworkInterfaceTypes.PHYSICAL,
    });
    const node = machineDetailsFactory({
      interfaces: [nic],
    });
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: [node],
      }),
    });
    expect(
      machine.getInterfaceById(state, node.system_id, null, link.id)
    ).toStrictEqual(nic);
  });

  it("can get unused ids for a details request when the id is being used", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        details: {
          [callId]: machineStateDetailsItemFactory({
            system_id: "abc123",
          }),
          78910: machineStateDetailsItemFactory({
            system_id: "abc123",
          }),
        },
        lists: {
          [callId]: machineStateListFactory({
            groups: [
              machineStateListGroupFactory({
                items: ["abc123", "def456"],
              }),
            ],
          }),
        },
      }),
    });
    expect(machine.unusedIdsInCall(state, callId)).toStrictEqual([]);
  });

  it("can get unused ids for a details request when the id is not being used", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        details: {
          [callId]: machineStateDetailsItemFactory({
            system_id: "abc123",
          }),
        },
        lists: {
          [callId]: machineStateListFactory({
            groups: [
              machineStateListGroupFactory({
                items: ["def456", "ghi789"],
              }),
            ],
          }),
        },
      }),
    });
    expect(machine.unusedIdsInCall(state, callId)).toStrictEqual(["abc123"]);
  });

  it("can get unused ids for a list request when the ids are being used", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        details: {
          [callId]: machineStateDetailsItemFactory({
            system_id: "abc123",
          }),
        },
        lists: {
          111213: machineStateListFactory({
            groups: [
              machineStateListGroupFactory({
                items: ["abc123", "def456"],
              }),
            ],
          }),
          78910: machineStateListFactory({
            groups: [
              machineStateListGroupFactory({
                items: ["def456"],
              }),
            ],
          }),
        },
      }),
    });
    expect(machine.unusedIdsInCall(state, "111213")).toStrictEqual([]);
  });

  it("can get unused ids for a list request when the ids are not being used", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        details: {
          [callId]: machineStateDetailsItemFactory({
            system_id: "abc123",
          }),
        },
        lists: {
          111213: machineStateListFactory({
            groups: [
              machineStateListGroupFactory({
                items: ["def456", "ghi789"],
              }),
            ],
          }),
          78910: machineStateListFactory({
            groups: [
              machineStateListGroupFactory({
                items: ["jkl101112"],
              }),
            ],
          }),
        },
      }),
    });
    expect(machine.unusedIdsInCall(state, "111213")).toStrictEqual([
      "def456",
      "ghi789",
    ]);
  });
});
