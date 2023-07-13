import { produce } from "immer";

import reducers, {
  DEFAULT_COUNT_STATE,
  DEFAULT_LIST_STATE,
  actions,
} from "./slice";
import type { SelectedMachines } from "./types";
import { FilterGroupKey, FilterGroupType } from "./types";
import { FetchGroupKey } from "./types/actions";

import {
  NodeActions,
  NodeStatus,
  NodeStatusCode,
  FetchNodeStatus,
} from "app/store/types/node";
import { callId, enableCallIdMocks } from "testing/callId-mock";
import {
  filterGroup as filterGroupFactory,
  machine as machineFactory,
  machineDetails as machineDetailsFactory,
  machineEventError as machineEventErrorFactory,
  machineStateList as machineStateListFactory,
  machineStateListGroup as machineStateListGroupFactory,
  machineState as machineStateFactory,
  machineStateCount as machineStateCountFactory,
  machineStateDetailsItem as machineStateDetailsItemFactory,
  machineStatus as machineStatusFactory,
} from "testing/factories";

enableCallIdMocks();

describe("machine reducer", () => {
  const NOW = 1000;
  beforeEach(() => {
    jest.spyOn(Date, "now").mockImplementation(() => NOW);
  });
  afterEach(() => {
    jest.spyOn(Date, "now").mockRestore();
  });
  it("should return the initial state", () => {
    expect(reducers(undefined, { type: "" })).toEqual({
      actions: {},
      active: null,
      errors: null,
      counts: {},
      details: {},
      eventErrors: [],
      filters: [],
      filtersLoaded: false,
      filtersLoading: false,
      items: [],
      lists: {},
      loaded: false,
      loading: false,
      saved: false,
      saving: false,
      selected: null,
      statuses: {},
    });
  });

  describe("count", () => {
    it("reduces countError", () => {
      const initialState = machineStateFactory({
        counts: {
          [callId]: machineStateCountFactory({
            loading: true,
          }),
        },
      });
      expect(
        reducers(
          initialState,
          actions.countError(callId, "Could not count machines")
        )
      ).toEqual(
        machineStateFactory({
          counts: {
            [callId]: machineStateCountFactory({
              errors: "Could not count machines",
              loading: false,
            }),
          },
          eventErrors: [
            machineEventErrorFactory({
              error: "Could not count machines",
              event: "count",
              id: null,
            }),
          ],
        })
      );
    });

    it("reduces countStart for initial fetch", () => {
      const initialState = machineStateFactory({ loading: false });
      expect(reducers(initialState, actions.countStart(callId))).toEqual(
        machineStateFactory({
          counts: {
            [callId]: machineStateCountFactory({
              loading: true,
              fetchedAt: NOW,
            }),
          },
        })
      );
    });

    it("reduces countStart for subsequent fetch", () => {
      const initialState = machineStateFactory({
        counts: {
          [callId]: {
            ...DEFAULT_COUNT_STATE,
            loading: false,
            fetchedAt: NOW,
          },
        },
      });

      jest.spyOn(Date, "now").mockImplementation(() => NOW + 1);

      const updatedState = reducers(initialState, actions.countStart(callId));

      expect(updatedState.counts[callId]).toEqual({
        ...DEFAULT_COUNT_STATE,
        loading: false,
        refetching: true,
        fetchedAt: expect.any(Number),
        refetchedAt: expect.any(Number),
      });

      expect(updatedState.counts[callId].refetchedAt).toBeGreaterThan(
        initialState.counts[callId].fetchedAt as number
      );
    });

    it("reduces countSuccess", () => {
      const payload = { count: 10 };
      const initialState = machineStateFactory({
        counts: {
          [callId]: {
            ...DEFAULT_COUNT_STATE,
            loading: true,
          },
        },
      });

      const updatedState = reducers(
        initialState,
        actions.countSuccess(callId, payload)
      );

      expect(updatedState.counts[callId]).toEqual({
        ...DEFAULT_COUNT_STATE,
        loading: false,
        loaded: true,
        count: payload.count,
      });
    });

    it("ignores calls that don't exist when reducing countSuccess", () => {
      const initialState = machineStateFactory({
        counts: {},
      });
      expect(
        reducers(
          initialState,
          actions.countSuccess(callId, {
            count: 11,
          })
        )
      ).toEqual(
        machineStateFactory({
          counts: {},
        })
      );
    });
  });

  describe("fetch", () => {
    it("reduces fetchStart", () => {
      const initialState = machineStateFactory({ loading: false });

      expect(reducers(initialState, actions.fetchStart(callId))).toEqual(
        machineStateFactory({
          lists: {
            [callId]: machineStateListFactory({
              loading: true,
              fetchedAt: NOW,
            }),
          },
        })
      );
    });

    it("reduces fetchStart for subsequent fetch for the same callId", () => {
      jest.spyOn(Date, "now").mockImplementation(() => NOW + 1);

      const initialState = machineStateFactory({
        lists: {
          [callId]: {
            ...DEFAULT_LIST_STATE,
            loading: false,
            fetchedAt: NOW,
          },
        },
      });

      const updatedState = reducers(initialState, actions.fetchStart(callId));

      expect(updatedState.lists[callId]).toEqual(
        expect.objectContaining({
          ...initialState.lists[callId],
          loading: false,
          refetching: true,
          refetchedAt: expect.any(Number),
        })
      );

      expect(updatedState.lists[callId].refetchedAt).toBeGreaterThan(
        initialState.lists[callId].fetchedAt!
      );
    });

    it("reduces fetchSuccess", () => {
      const initialState = machineStateFactory({
        items: [],
        lists: {
          [callId]: machineStateListFactory({
            loaded: false,
            loading: true,
          }),
        },
        statuses: {},
      });
      const fetchedMachines = [
        machineFactory({ system_id: "abc123" }),
        machineFactory({ system_id: "def456" }),
      ];

      expect(
        reducers(
          initialState,
          actions.fetchSuccess(callId, {
            count: 1,
            cur_page: 2,
            groups: [
              {
                collapsed: true,
                count: 4,
                items: fetchedMachines,
                name: "admin",
                value: "admin1",
              },
            ],
            num_pages: 3,
          })
        )
      ).toEqual(
        machineStateFactory({
          items: fetchedMachines,
          lists: {
            [callId]: machineStateListFactory({
              count: 1,
              cur_page: 2,
              groups: [
                machineStateListGroupFactory({
                  collapsed: true,
                  count: 4,
                  items: ["abc123", "def456"],
                  name: "admin",
                  value: "admin1",
                }),
              ],
              num_pages: 3,
              loaded: true,
              loading: false,
            }),
          },
          statuses: {
            abc123: machineStatusFactory(),
            def456: machineStatusFactory(),
          },
        })
      );
    });
  });

  it("reduces invalidateQueries", () => {
    const initialState = machineStateFactory({
      loading: false,
      counts: {
        [callId]: machineStateCountFactory({
          loaded: true,
          stale: false,
        }),
      },
      lists: {
        [callId]: machineStateListFactory({
          loaded: true,
          stale: false,
        }),
      },
    });
    expect(reducers(initialState, actions.invalidateQueries())).toEqual(
      machineStateFactory({
        counts: {
          [callId]: machineStateCountFactory({
            loaded: true,
            stale: true,
          }),
        },
        lists: {
          [callId]: machineStateListFactory({
            loaded: true,
            stale: true,
          }),
        },
      })
    );
  });

  describe("updateNotify", () => {
    it("marks filtered machine counts as stale", () => {
      const initialState = machineStateFactory({
        loading: false,
        counts: {
          [callId]: machineStateCountFactory({
            loaded: true,
            stale: false,
            params: { filter: { status: FetchNodeStatus.NEW } },
          }),
        },
      });
      expect(
        reducers(initialState, actions.updateNotify(machineFactory()))
      ).toEqual({
        ...initialState,
        counts: { [callId]: { ...initialState.counts[callId], stale: true } },
      });
    });

    it("doesn't mark unfiltered machine counts as stale", () => {
      const initialState = machineStateFactory({
        loading: false,
        counts: {
          [callId]: machineStateCountFactory({
            loaded: true,
            stale: false,
          }),
        },
      });
      expect(
        reducers(initialState, actions.updateNotify(machineFactory()))
      ).toEqual(initialState);
    });
  });

  it("marks count requests as stale on delete notify", () => {
    const initialState = machineStateFactory({
      loading: false,
      counts: {
        [callId]: machineStateCountFactory({
          loaded: true,
          stale: false,
        }),
      },
    });
    expect(reducers(initialState, actions.deleteNotify("abc123"))).toEqual(
      machineStateFactory({
        counts: {
          [callId]: machineStateCountFactory({
            loaded: true,
            stale: true,
          }),
        },
      })
    );
  });

  it("updates selected machines on delete notify", () => {
    const initialState = machineStateFactory({
      selected: { items: ["abc123"] },
    });
    expect(reducers(initialState, actions.deleteNotify("abc123"))).toEqual(
      machineStateFactory({
        selected: { items: [] },
      })
    );
  });

  it("reduces machine action with filter", () => {
    const initialState = machineStateFactory();

    expect(
      reducers(
        initialState,
        actions.delete({ filter: { id: "abc123" }, callId: "123456" })
      )
    ).toEqual(initialState);
  });

  it("ignores calls that don't exist when reducing fetchSuccess", () => {
    const initialState = machineStateFactory({
      items: [],
      lists: {},
      statuses: {},
    });
    const fetchedMachines = [
      machineFactory({ system_id: "abc123" }),
      machineFactory({ system_id: "def456" }),
    ];

    expect(
      reducers(
        initialState,
        actions.fetchSuccess(callId, {
          count: 1,
          cur_page: 2,
          groups: [
            {
              collapsed: true,
              count: 4,
              items: fetchedMachines,
              name: "admin",
              value: "admin1",
            },
          ],
          num_pages: 3,
        })
      )
    ).toEqual(
      machineStateFactory({
        items: [],
        lists: {},
        statuses: {},
      })
    );
  });

  it("does not update existing machine details items when reducing fetchSuccess", () => {
    const existingMachine = machineDetailsFactory({
      id: 1,
      system_id: "abc123",
    });
    const initialState = machineStateFactory({
      items: [existingMachine],
      lists: {
        [callId]: machineStateListFactory(),
      },
      statuses: {
        abc123: machineStatusFactory(),
      },
    });
    const fetchedMachines = [
      machineFactory({ id: 1, system_id: "abc123" }),
      machineFactory({ id: 2, system_id: "def456" }),
    ];

    expect(
      reducers(
        initialState,
        actions.fetchSuccess(callId, {
          count: 1,
          cur_page: 2,
          groups: [
            {
              collapsed: true,
              count: 4,
              items: fetchedMachines,
              name: "admin",
              value: "admin1",
            },
          ],
          num_pages: 3,
        })
      )
    ).toEqual(
      machineStateFactory({
        items: [existingMachine, fetchedMachines[1]],
        lists: {
          [callId]: machineStateListFactory({
            count: 1,
            cur_page: 2,
            groups: [
              machineStateListGroupFactory({
                collapsed: true,
                count: 4,
                items: ["abc123", "def456"],
                name: "admin",
                value: "admin1",
              }),
            ],
            num_pages: 3,
            loaded: true,
            loading: false,
          }),
        },
        statuses: {
          abc123: machineStatusFactory(),
          def456: machineStatusFactory(),
        },
      })
    );
  });

  it("updates existing machine items when reducing fetchSuccess", () => {
    const existingMachine = machineFactory({
      id: 1,
      hostname: "old-hostname",
      system_id: "abc123",
    });
    const updatedExistingMachine = {
      ...existingMachine,
      hostname: "updated-hostname",
    };
    const initialState = machineStateFactory({
      items: [existingMachine],
      lists: {
        [callId]: machineStateListFactory(),
      },
      statuses: {
        abc123: machineStatusFactory(),
      },
    });
    const fetchedMachines = [
      updatedExistingMachine,
      machineFactory({ id: 2, system_id: "def456" }),
    ];

    expect(
      reducers(
        initialState,
        actions.fetchSuccess(callId, {
          count: 1,
          cur_page: 2,
          groups: [
            {
              collapsed: true,
              count: 4,
              items: fetchedMachines,
              name: "admin",
              value: "admin1",
            },
          ],
          num_pages: 3,
        })
      )
    ).toEqual(
      machineStateFactory({
        items: fetchedMachines,
        lists: {
          [callId]: machineStateListFactory({
            count: 1,
            cur_page: 2,
            groups: [
              machineStateListGroupFactory({
                collapsed: true,
                count: 4,
                items: ["abc123", "def456"],
                name: "admin",
                value: "admin1",
              }),
            ],
            num_pages: 3,
            loaded: true,
            loading: false,
          }),
        },
        statuses: {
          abc123: machineStatusFactory(),
          def456: machineStatusFactory(),
        },
      })
    );
  });

  it("reduces fetchError", () => {
    const initialState = machineStateFactory({
      lists: {
        [callId]: machineStateListFactory({
          loading: true,
        }),
      },
    });

    expect(
      reducers(
        initialState,
        actions.fetchError(callId, "Could not fetch machines")
      )
    ).toEqual(
      machineStateFactory({
        lists: {
          [callId]: machineStateListFactory({
            errors: "Could not fetch machines",
            loading: false,
          }),
        },
        eventErrors: [
          machineEventErrorFactory({
            error: "Could not fetch machines",
            event: "fetch",
            id: null,
          }),
        ],
      })
    );
  });

  it("reduces filterGroupsStart", () => {
    const initialState = machineStateFactory({ filtersLoading: false });

    expect(reducers(initialState, actions.filterGroupsStart())).toEqual(
      machineStateFactory({
        filtersLoading: true,
      })
    );
  });

  it("reduces filterGroupsSuccess", () => {
    const initialState = machineStateFactory({
      filters: [],
      filtersLoaded: false,
      filtersLoading: true,
    });
    const filterGroup = filterGroupFactory();
    const fetchedGroups = [filterGroup];

    expect(
      reducers(initialState, actions.filterGroupsSuccess(fetchedGroups))
    ).toEqual(
      machineStateFactory({
        filters: fetchedGroups,
        filtersLoaded: true,
        filtersLoading: false,
      })
    );
  });

  it("reduces filterGroupsError", () => {
    const initialState = machineStateFactory({
      eventErrors: [],
      filtersLoading: true,
    });

    expect(
      reducers(
        initialState,
        actions.filterGroupsError("Could not fetch filter groups")
      )
    ).toEqual(
      machineStateFactory({
        errors: "Could not fetch filter groups",
        eventErrors: [
          machineEventErrorFactory({
            error: "Could not fetch filter groups",
            event: "filterGroups",
            id: null,
          }),
        ],
        filtersLoading: false,
      })
    );
  });

  it("reduces filterOptionsStart", () => {
    const initialState = machineStateFactory({
      filters: [
        filterGroupFactory({
          key: FilterGroupKey.Owner,
          loading: false,
        }),
      ],
    });
    expect(
      reducers(initialState, actions.filterOptionsStart(FilterGroupKey.Owner))
    ).toEqual(
      machineStateFactory({
        filters: [
          filterGroupFactory({
            key: FilterGroupKey.Owner,
            loading: true,
          }),
        ],
      })
    );
  });

  it("reduces filterOptionsError", () => {
    const initialState = machineStateFactory({
      eventErrors: [],
      filters: [
        filterGroupFactory({
          key: FilterGroupKey.Owner,
          loading: true,
        }),
      ],
    });
    expect(
      reducers(
        initialState,
        actions.filterOptionsError(
          FilterGroupKey.Owner,
          "Could not fetch filter groups"
        )
      )
    ).toEqual(
      machineStateFactory({
        eventErrors: [
          machineEventErrorFactory({
            error: "Could not fetch filter groups",
            event: "filterOptions",
            id: undefined,
          }),
        ],
        filters: [
          filterGroupFactory({
            errors: "Could not fetch filter groups",
            key: FilterGroupKey.Owner,
            loading: false,
          }),
        ],
      })
    );
  });

  it("reduces filterOptionsSuccess for bool options", () => {
    const initialState = machineStateFactory({
      filters: [
        filterGroupFactory({
          key: FilterGroupKey.AgentName,
          options: null,
          loaded: false,
          loading: true,
          type: FilterGroupType.Bool,
        }),
      ],
    });
    const fetchedOptions = [
      { key: true, label: "On" },
      { key: false, label: "Off" },
    ];
    expect(
      reducers(
        initialState,
        actions.filterOptionsSuccess(FilterGroupKey.AgentName, fetchedOptions)
      )
    ).toEqual(
      machineStateFactory({
        filters: [
          filterGroupFactory({
            key: FilterGroupKey.AgentName,
            options: fetchedOptions,
            loaded: true,
            loading: false,
            type: FilterGroupType.Bool,
          }),
        ],
      })
    );
  });

  it("reduces filterOptionsSuccess for float options", () => {
    const initialState = machineStateFactory({
      filters: [
        filterGroupFactory({
          key: FilterGroupKey.Mem,
          options: null,
          loaded: false,
          loading: true,
          type: FilterGroupType.Float,
        }),
      ],
    });
    const fetchedOptions = [
      { key: 1024.1, label: "1024.1" },
      { key: 1024.2, label: "2024.2" },
    ];
    expect(
      reducers(
        initialState,
        actions.filterOptionsSuccess(FilterGroupKey.Mem, fetchedOptions)
      )
    ).toEqual(
      machineStateFactory({
        filters: [
          filterGroupFactory({
            key: FilterGroupKey.Mem,
            options: fetchedOptions,
            loaded: true,
            loading: false,
            type: FilterGroupType.Float,
          }),
        ],
      })
    );
  });

  it("reduces filterOptionsSuccess for lists of float options", () => {
    const initialState = machineStateFactory({
      filters: [
        filterGroupFactory({
          key: FilterGroupKey.Mem,
          options: null,
          loaded: false,
          loading: true,
          type: FilterGroupType.FloatList,
        }),
      ],
    });
    const fetchedOptions = [
      { key: 1024.1, label: "1024.1" },
      { key: 1024.2, label: "2024.2" },
    ];
    expect(
      reducers(
        initialState,
        actions.filterOptionsSuccess(FilterGroupKey.Mem, fetchedOptions)
      )
    ).toEqual(
      machineStateFactory({
        filters: [
          filterGroupFactory({
            key: FilterGroupKey.Mem,
            options: fetchedOptions,
            loaded: true,
            loading: false,
            type: FilterGroupType.FloatList,
          }),
        ],
      })
    );
  });

  it("reduces filterOptionsSuccess for int options", () => {
    const initialState = machineStateFactory({
      filters: [
        filterGroupFactory({
          key: FilterGroupKey.Status,
          options: null,
          loaded: false,
          loading: true,
          type: FilterGroupType.Int,
        }),
      ],
    });
    const fetchedOptions = [
      { key: 1, label: "New" },
      { key: 2, label: "Ready" },
    ];
    expect(
      reducers(
        initialState,
        actions.filterOptionsSuccess(FilterGroupKey.Status, fetchedOptions)
      )
    ).toEqual(
      machineStateFactory({
        filters: [
          filterGroupFactory({
            key: FilterGroupKey.Status,
            options: fetchedOptions,
            loaded: true,
            loading: false,
            type: FilterGroupType.Int,
          }),
        ],
      })
    );
  });

  it("reduces filterOptionsSuccess for lists of int options", () => {
    const initialState = machineStateFactory({
      filters: [
        filterGroupFactory({
          key: FilterGroupKey.Status,
          options: null,
          loaded: false,
          loading: true,
          type: FilterGroupType.IntList,
        }),
      ],
    });
    const fetchedOptions = [
      { key: 1, label: "New" },
      { key: 2, label: "Ready" },
    ];
    expect(
      reducers(
        initialState,
        actions.filterOptionsSuccess(FilterGroupKey.Status, fetchedOptions)
      )
    ).toEqual(
      machineStateFactory({
        filters: [
          filterGroupFactory({
            key: FilterGroupKey.Status,
            options: fetchedOptions,
            loaded: true,
            loading: false,
            type: FilterGroupType.IntList,
          }),
        ],
      })
    );
  });

  it("reduces filterOptionsSuccess for string options", () => {
    const initialState = machineStateFactory({
      filters: [
        filterGroupFactory({
          key: FilterGroupKey.Tags,
          options: null,
          loaded: false,
          loading: true,
          type: FilterGroupType.String,
        }),
      ],
    });
    const fetchedOptions = [
      { key: "tag1", label: "Tag 1" },
      { key: "tag2", label: "Tag 2" },
    ];
    expect(
      reducers(
        initialState,
        actions.filterOptionsSuccess(FilterGroupKey.Tags, fetchedOptions)
      )
    ).toEqual(
      machineStateFactory({
        filters: [
          filterGroupFactory({
            key: FilterGroupKey.Tags,
            options: fetchedOptions,
            loaded: true,
            loading: false,
            type: FilterGroupType.String,
          }),
        ],
      })
    );
  });

  it("reduces filterOptionsSuccess for dict options", () => {
    const initialState = machineStateFactory({
      filters: [
        filterGroupFactory({
          key: FilterGroupKey.AgentName,
          options: null,
          loaded: false,
          loading: true,
          type: FilterGroupType.Dict,
        }),
      ],
    });
    const fetchedOptions = [
      { key: "iface:name=eth0", label: "name=eth0" },
      { key: "iface:name=eth1", label: "name=eth1" },
    ];
    expect(
      reducers(
        initialState,
        actions.filterOptionsSuccess(FilterGroupKey.AgentName, fetchedOptions)
      )
    ).toEqual(
      machineStateFactory({
        filters: [
          filterGroupFactory({
            key: FilterGroupKey.AgentName,
            options: fetchedOptions,
            loaded: true,
            loading: false,
            type: FilterGroupType.Dict,
          }),
        ],
      })
    );
  });

  it("reduces filterOptionsSuccess for lists of string options", () => {
    const initialState = machineStateFactory({
      filters: [
        filterGroupFactory({
          key: FilterGroupKey.Owner,
          options: null,
          loaded: false,
          loading: true,
          type: FilterGroupType.StringList,
        }),
      ],
    });
    const fetchedOptions = [
      { key: "admin", label: "Admin" },
      { key: "admin2", label: "Admin2" },
    ];
    expect(
      reducers(
        initialState,
        actions.filterOptionsSuccess(FilterGroupKey.Owner, fetchedOptions)
      )
    ).toEqual(
      machineStateFactory({
        filters: [
          filterGroupFactory({
            key: FilterGroupKey.Owner,
            options: fetchedOptions,
            loaded: true,
            loading: false,
            type: FilterGroupType.StringList,
          }),
        ],
      })
    );
  });

  it("reduces getStart", () => {
    const initialState = machineStateFactory({ loading: false });

    expect(
      reducers(initialState, actions.getStart({ system_id: "abc123" }, callId))
    ).toEqual(
      machineStateFactory({
        details: {
          [callId]: machineStateDetailsItemFactory({
            loading: true,
            system_id: "abc123",
          }),
        },
      })
    );
  });

  it("reduces getError", () => {
    const initialState = machineStateFactory({
      details: {
        [callId]: machineStateDetailsItemFactory({
          system_id: "abc123",
        }),
      },
      errors: null,
    });

    expect(
      reducers(
        initialState,
        actions.getError({ system_id: "abc123" }, callId, {
          system_id: "id was not supplied",
        })
      )
    ).toEqual(
      machineStateFactory({
        details: {
          [callId]: machineStateDetailsItemFactory({
            errors: { system_id: "id was not supplied" },
            system_id: "abc123",
          }),
        },
        errors: null,
        eventErrors: [
          machineEventErrorFactory({
            error: { system_id: "id was not supplied" },
            event: "get",
            id: "abc123",
          }),
        ],
      })
    );
  });

  it("should update if machine exists on getSuccess", () => {
    const initialState = machineStateFactory({
      details: {
        [callId]: machineStateDetailsItemFactory({
          loading: true,
          system_id: "abc123",
        }),
      },
      items: [machineFactory({ system_id: "abc123", hostname: "machine1" })],
      statuses: {
        abc123: machineStatusFactory(),
      },
    });
    const updatedMachine = machineDetailsFactory({
      system_id: "abc123",
      hostname: "machine1-newname",
    });

    expect(
      reducers(
        initialState,
        actions.getSuccess({ system_id: "abc123" }, callId, updatedMachine)
      )
    ).toEqual(
      machineStateFactory({
        details: {
          [callId]: machineStateDetailsItemFactory({
            loaded: true,
            loading: false,
            system_id: "abc123",
          }),
        },
        items: [updatedMachine],
        loading: false,
        statuses: {
          abc123: machineStatusFactory(),
        },
      })
    );
  });

  it("reduces getSuccess", () => {
    const initialState = machineStateFactory({
      details: {
        [callId]: machineStateDetailsItemFactory({
          loading: true,
          system_id: "abc123",
        }),
      },
      items: [machineFactory({ system_id: "abc123" })],
      statuses: {
        abc123: machineStatusFactory(),
      },
    });
    const newMachine = machineDetailsFactory({ system_id: "def456" });

    expect(
      reducers(
        initialState,
        actions.getSuccess({ system_id: "abc123" }, callId, newMachine)
      )
    ).toEqual(
      machineStateFactory({
        details: {
          [callId]: machineStateDetailsItemFactory({
            loaded: true,
            loading: false,
            system_id: "abc123",
          }),
        },
        items: [...initialState.items, newMachine],
        loading: false,
        statuses: {
          abc123: machineStatusFactory(),
          def456: machineStatusFactory(),
        },
      })
    );
  });

  it("ignores calls that don't exist when reducing getSuccess", () => {
    const initialState = machineStateFactory({
      details: {},
      items: [],
      statuses: {},
    });
    const newMachine = machineDetailsFactory({ system_id: "def456" });

    expect(
      reducers(
        initialState,
        actions.getSuccess({ system_id: "abc123" }, callId, newMachine)
      )
    ).toEqual(
      machineStateFactory({
        details: {},
        items: [],
        statuses: {},
      })
    );
  });

  it("reduces setActiveSuccess", () => {
    const initialState = machineStateFactory({ active: null });

    expect(
      reducers(
        initialState,
        actions.setActiveSuccess(machineDetailsFactory({ system_id: "abc123" }))
      )
    ).toEqual(machineStateFactory({ active: "abc123" }));
  });

  it("reduces setActiveError", () => {
    const initialState = machineStateFactory({
      active: "abc123",
      errors: null,
    });

    expect(
      reducers(initialState, actions.setActiveError("Machine does not exist"))
    ).toEqual(
      machineStateFactory({
        active: null,
        errors: "Machine does not exist",
        eventErrors: [
          machineEventErrorFactory({
            error: "Machine does not exist",
            event: "setActive",
            id: null,
          }),
        ],
      })
    );
  });

  it("reduces createStart", () => {
    const initialState = machineStateFactory({ saved: true, saving: false });

    expect(reducers(initialState, actions.createStart())).toEqual(
      machineStateFactory({
        saved: false,
        saving: true,
      })
    );
  });

  it("reduces createError", () => {
    const initialState = machineStateFactory({
      errors: null,
      saved: false,
      saving: true,
    });

    expect(
      reducers(
        initialState,
        actions.createError({ name: "name already exists" })
      )
    ).toEqual(
      machineStateFactory({
        errors: { name: "name already exists" },
        eventErrors: [
          machineEventErrorFactory({
            error: { name: "name already exists" },
            event: "create",
            id: null,
          }),
        ],
        saved: false,
        saving: false,
      })
    );
  });

  it("reduces deleteNotify", () => {
    const machines = [
      machineFactory({ id: 1, system_id: "abc123", hostname: "node1" }),
      machineFactory({ id: 2, system_id: "def456", hostname: "node2" }),
    ];
    const initialList = machineStateListFactory({
      count: 20,
      cur_page: 1,
      groups: [
        machineStateListGroupFactory({
          // count can be higher than items.length due to pagination
          count: 15,
          items: ["abc123", "def456"],
        }),
      ],
    });
    const initialState = machineStateFactory({
      lists: {
        callId: initialList,
      },
      items: machines,
      selected: { items: ["abc123"] },
      statuses: {
        abc123: machineStatusFactory(),
        def456: machineStatusFactory(),
      },
    });
    const nextState = produce(initialState, (draft) => {
      const list = draft.lists.callId;
      list.count = 19;
      list.groups![0].count = 14;
      list.groups![0].items = ["def456"];
      draft.items = [initialState.items[1]];
      draft.selected = { items: [] };
      delete draft.statuses.abc123;
    });
    expect(reducers(initialState, actions.deleteNotify("abc123"))).toEqual(
      nextState
    );
  });

  it("reduces deleteNotify when last machine in a group is removed", () => {
    const machines = [
      machineFactory({
        id: 1,
        system_id: "abc123",
        hostname: "node1",
        status: NodeStatus.NEW,
        status_code: NodeStatusCode.NEW,
      }),
      machineFactory({
        id: 2,
        system_id: "def456",
        hostname: "node2",
        status: NodeStatus.FAILED_COMMISSIONING,
        status_code: NodeStatusCode.FAILED_COMMISSIONING,
      }),
    ];
    const newGroup = machineStateListGroupFactory({
      name: "New",
      value: "new",
      items: ["abc123"],
      count: 1,
    });
    const failedCommissioningGroup = machineStateListGroupFactory({
      name: "Failed commissioning",
      value: "failed_commissioning",
      items: ["def456"],
      count: 1,
    });
    const initialState = machineStateFactory({
      lists: {
        callId: machineStateListFactory({
          groups: [newGroup, failedCommissioningGroup],
        }),
      },
      items: machines,
      selected: { items: ["def456"] },
      statuses: {
        abc123: machineStatusFactory(),
        def456: machineStatusFactory(),
        ghi789: machineStatusFactory(),
      },
    });
    const nextState = produce(initialState, (draft) => {
      draft.lists.callId.groups = [newGroup];
      draft.items = [initialState.items[0]];
      draft.selected = { items: [] };
      delete draft.statuses.def456;
    });
    expect(reducers(initialState, actions.deleteNotify("def456"))).toEqual(
      nextState
    );
  });

  it("reduces deleteNotify with groups of machines", () => {
    const machines = [
      machineFactory({
        id: 1,
        system_id: "abc123",
        hostname: "node1",
        status: NodeStatus.NEW,
        status_code: NodeStatusCode.NEW,
      }),
      machineFactory({
        id: 3,
        system_id: "def456",
        hostname: "node3",
        status: NodeStatus.NEW,
        status_code: NodeStatusCode.NEW,
      }),
    ];
    const group = machineStateListGroupFactory({
      name: "New",
      value: "new",
      items: ["abc123", "def456"],
      count: 2,
    });
    const initialState = machineStateFactory({
      lists: {
        callId: machineStateListFactory({
          count: 2,
          groups: [group],
        }),
      },
      items: machines,
      selected: { items: ["abc123"] },
      statuses: {
        abc123: machineStatusFactory(),
        def456: machineStatusFactory(),
      },
    });
    const nextState = produce(initialState, (draft) => {
      const list = draft.lists.callId;
      list.count = 1;
      list.groups = [{ ...group, count: 1, items: ["def456"] }];
      draft.items = [initialState.items[1]];
      draft.selected = { items: [] };
      delete draft.statuses.abc123;
    });
    expect(reducers(initialState, actions.deleteNotify("abc123"))).toEqual(
      nextState
    );
  });

  it("reduces updateNotify", () => {
    const machines = [
      machineFactory({ id: 1, system_id: "abc123", hostname: "node1" }),
      machineFactory({ id: 2, system_id: "def456", hostname: "node2" }),
    ];
    const initialState = machineStateFactory({
      lists: {
        [callId]: machineStateListFactory({
          groups: [
            machineStateListGroupFactory({
              items: machines.map((machine) => machine.system_id),
            }),
          ],
        }),
      },
      items: machines,
    });
    const updatedMachine = machineFactory({
      id: 1,
      system_id: "abc123",
      hostname: "node1v2",
    });

    expect(
      reducers(initialState, actions.updateNotify(updatedMachine))
    ).toEqual(
      machineStateFactory({
        lists: {
          [callId]: { ...initialState.lists[callId] },
        },
        items: [updatedMachine, initialState.items[1]],
      })
    );
  });

  describe("updateNotify", () => {
    it("reduces updateNotify for machine moved to a group that's not in the current list", () => {
      const abc123 = machineFactory({
        id: 1,
        system_id: "abc123",
        hostname: "node1",
        status: NodeStatus.COMMISSIONING,
      });
      const initialState = machineStateFactory({
        items: [
          abc123,
          machineFactory({
            id: 2,
            system_id: "def456",
            hostname: "node2",
            status: NodeStatus.COMMISSIONING,
          }),
        ],
        lists: {
          [callId]: machineStateListFactory({
            count: 2,
            cur_page: 2,
            groups: [
              machineStateListGroupFactory({
                collapsed: false,
                count: 2,
                items: ["abc123", "def456"],
                name: NodeStatus.COMMISSIONING,
                value: FetchNodeStatus.COMMISSIONING,
              }),
            ],
            num_pages: 3,
            loaded: true,
            loading: false,
            params: { group_key: FetchGroupKey.Status },
          }),
        },
      });
      const updatedMachine = machineFactory({
        ...abc123,
        status: NodeStatus.FAILED_COMMISSIONING,
      });

      expect(
        reducers(initialState, actions.updateNotify(updatedMachine))
      ).toEqual(
        machineStateFactory({
          items: [updatedMachine, initialState.items[1]],
          lists: {
            [callId]: {
              ...initialState.lists[callId],
              groups: [
                machineStateListGroupFactory({
                  collapsed: false,
                  count: 1,
                  items: ["def456"],
                  name: NodeStatus.COMMISSIONING,
                  value: FetchNodeStatus.COMMISSIONING,
                }),
                machineStateListGroupFactory({
                  collapsed: false,
                  count: null,
                  items: ["abc123"],
                  name: NodeStatus.FAILED_COMMISSIONING,
                  value: FetchNodeStatus.FAILED_COMMISSIONING,
                }),
              ],
            },
          },
        })
      );
    });
  });

  it("reduces checkPowerError", () => {
    const machines = [
      machineFactory({ id: 1, system_id: "abc123", hostname: "node1" }),
    ];
    const initialState = machineStateFactory({
      items: machines,
      statuses: { abc123: machineStatusFactory({ checkingPower: true }) },
    });

    expect(
      reducers(
        initialState,
        actions.checkPowerError({
          item: machines[0],
          payload: "Uh oh!",
        })
      )
    ).toEqual(
      machineStateFactory({
        errors: "Uh oh!",
        eventErrors: [
          machineEventErrorFactory({
            error: "Uh oh!",
            event: "checkPower",
            id: "abc123",
          }),
        ],
        items: machines,
        statuses: { abc123: machineStatusFactory({ checkingPower: false }) },
      })
    );
  });

  it("reduces setSelected", () => {
    const initialState = machineStateFactory({
      selected: [] as SelectedMachines,
    });

    expect(
      reducers(initialState, actions.setSelected({ items: ["abcde", "fghij"] }))
    ).toEqual(
      machineStateFactory({
        selected: { items: ["abcde", "fghij"] },
      })
    );
  });

  describe("setPool", () => {
    it("reduces setPoolStart", () => {
      const machines = [
        machineFactory({ id: 1, system_id: "abc123", hostname: "node1" }),
      ];
      const initialState = machineStateFactory({
        items: machines,
        statuses: { abc123: machineStatusFactory({ settingPool: false }) },
      });

      expect(
        reducers(
          initialState,
          actions.setPoolStart({
            item: machines[0],
          })
        )
      ).toEqual(
        machineStateFactory({
          items: machines,
          statuses: {
            abc123: machineStatusFactory({
              settingPool: true,
            }),
          },
        })
      );
    });

    it("reduces setPoolSuccess", () => {
      const machines = [
        machineFactory({ id: 1, system_id: "abc123", hostname: "node1" }),
      ];
      const initialState = machineStateFactory({
        items: machines,
        statuses: { abc123: machineStatusFactory({ settingPool: true }) },
      });

      expect(
        reducers(
          initialState,
          actions.setPoolSuccess({
            item: machines[0],
          })
        )
      ).toEqual(
        machineStateFactory({
          items: machines,
          statuses: {
            abc123: machineStatusFactory({
              settingPool: false,
            }),
          },
        })
      );
    });

    it("reduces setPoolError", () => {
      const machines = [
        machineFactory({ id: 1, system_id: "abc123", hostname: "node1" }),
      ];
      const initialState = machineStateFactory({
        errors: null,
        items: machines,
        statuses: { abc123: machineStatusFactory({ settingPool: true }) },
      });

      expect(
        reducers(
          initialState,
          actions.setPoolError({
            item: machines[0],
            payload: "Uh oh",
          })
        )
      ).toEqual(
        machineStateFactory({
          errors: "Uh oh",
          eventErrors: [
            machineEventErrorFactory({
              error: "Uh oh",
              event: "setPool",
              id: "abc123",
            }),
          ],
          items: machines,
          statuses: {
            abc123: machineStatusFactory({
              settingPool: false,
            }),
          },
        })
      );
    });
  });

  it("reduces updateStart", () => {
    const initialState = machineStateFactory({ saved: true, saving: false });

    expect(reducers(initialState, actions.updateStart())).toEqual(
      machineStateFactory({
        saved: false,
        saving: true,
      })
    );
  });

  describe("clone", () => {
    it("reduces cloneStart", () => {
      const machine = machineFactory({ system_id: "abc123" });
      const initialState = machineStateFactory({
        items: [machine],
        statuses: { abc123: machineStatusFactory({ cloning: false }) },
      });

      expect(
        reducers(
          initialState,
          actions.cloneStart({
            item: machine,
          })
        )
      ).toEqual(
        machineStateFactory({
          items: [machine],
          statuses: {
            abc123: machineStatusFactory({
              cloning: true,
            }),
          },
        })
      );
    });

    it("reduces cloneSuccess", () => {
      const machine = machineFactory({ system_id: "abc123" });
      const initialState = machineStateFactory({
        items: [machine],
        statuses: { abc123: machineStatusFactory({ cloning: true }) },
      });

      expect(
        reducers(
          initialState,
          actions.cloneSuccess({
            item: machine,
          })
        )
      ).toEqual(
        machineStateFactory({
          items: [machine],
          statuses: {
            abc123: machineStatusFactory({
              cloning: false,
            }),
          },
        })
      );
    });

    it("reduces cloneError", () => {
      const machine = machineFactory({ system_id: "abc123" });
      const initialState = machineStateFactory({
        items: [machine],
        statuses: { abc123: machineStatusFactory({ cloning: true }) },
      });

      expect(
        reducers(
          initialState,
          actions.cloneError({
            item: machine,
            payload: "Cloning failed.",
          })
        )
      ).toEqual(
        machineStateFactory({
          errors: "Cloning failed.",
          eventErrors: [
            machineEventErrorFactory({
              error: "Cloning failed.",
              event: NodeActions.CLONE,
              id: "abc123",
            }),
          ],
          items: [machine],
          statuses: {
            abc123: machineStatusFactory({
              cloning: false,
            }),
          },
        })
      );
    });
  });

  describe("untag", () => {
    it("reduces untagStart", () => {
      const machine = machineFactory({ system_id: "abc123" });
      const initialState = machineStateFactory({
        items: [machine],
        statuses: { abc123: machineStatusFactory({ untagging: false }) },
      });

      expect(
        reducers(
          initialState,
          actions.untagStart({
            item: machine,
          })
        )
      ).toEqual(
        machineStateFactory({
          items: [machine],
          statuses: {
            abc123: machineStatusFactory({
              untagging: true,
            }),
          },
        })
      );
    });

    it("reduces untagSuccess", () => {
      const machine = machineFactory({ system_id: "abc123" });
      const initialState = machineStateFactory({
        items: [machine],
        statuses: { abc123: machineStatusFactory({ untagging: true }) },
      });

      expect(
        reducers(
          initialState,
          actions.untagSuccess({
            item: machine,
          })
        )
      ).toEqual(
        machineStateFactory({
          items: [machine],
          statuses: {
            abc123: machineStatusFactory({
              untagging: false,
            }),
          },
        })
      );
    });

    it("reduces untagError", () => {
      const machine = machineFactory({ system_id: "abc123" });
      const initialState = machineStateFactory({
        items: [machine],
        statuses: { abc123: machineStatusFactory({ untagging: true }) },
      });

      expect(
        reducers(
          initialState,
          actions.untagError({
            item: machine,
            payload: "Untagging failed.",
          })
        )
      ).toEqual(
        machineStateFactory({
          errors: "Untagging failed.",
          eventErrors: [
            machineEventErrorFactory({
              error: "Untagging failed.",
              event: NodeActions.UNTAG,
              id: "abc123",
            }),
          ],
          items: [machine],
          statuses: {
            abc123: machineStatusFactory({
              untagging: false,
            }),
          },
        })
      );
    });
  });

  it("reduces unsubscribeStart", () => {
    const items = [
      machineFactory({ system_id: "abc123" }),
      machineFactory({ system_id: "def456" }),
    ];
    expect(
      reducers(
        machineStateFactory({
          items,
          statuses: {
            abc123: machineStatusFactory(),
            def456: machineStatusFactory(),
          },
        }),
        actions.unsubscribeStart(["abc123"])
      )
    ).toEqual(
      machineStateFactory({
        items,
        statuses: {
          abc123: machineStatusFactory({ unsubscribing: true }),
          def456: machineStatusFactory(),
        },
      })
    );
  });

  it("reduces unsubscribeStart for removed statuses", () => {
    const items = [
      machineFactory({ system_id: "abc123" }),
      machineFactory({ system_id: "def456" }),
    ];
    expect(
      reducers(
        machineStateFactory({
          items,
          statuses: {
            def456: machineStatusFactory(),
          },
        }),
        actions.unsubscribeStart(["abc123"])
      )
    ).toEqual(
      machineStateFactory({
        items,
        statuses: {
          def456: machineStatusFactory(),
        },
      })
    );
  });

  it("reduces unsubscribeSuccess", () => {
    const initialState = machineStateFactory({
      items: [
        machineFactory({ system_id: "abc123" }),
        machineFactory({ system_id: "def456" }),
      ],
      selected: { items: ["abc123"] },
      statuses: {
        abc123: machineStatusFactory(),
        def456: machineStatusFactory(),
      },
    });
    expect(
      reducers(initialState, actions.unsubscribeSuccess(["abc123"]))
    ).toEqual(
      machineStateFactory({
        ...initialState,
        statuses: { def456: machineStatusFactory() },
      })
    );
  });

  it("reduces removeRequest for a details request", () => {
    const initialState = machineStateFactory({
      details: {
        [callId]: machineStateDetailsItemFactory(),
      },
    });
    expect(reducers(initialState, actions.removeRequest(callId))).toEqual(
      machineStateFactory({
        details: {},
      })
    );
  });
});
