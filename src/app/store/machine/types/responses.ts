import type { FilterGroup, Machine, MachineStateListGroup } from "./base";

export type FilterGroupResponse = Omit<FilterGroup, "options">;

// TODO: rename to MachineListResponseGroup
export type FetchResponseGroup = Omit<MachineStateListGroup, "items"> & {
  items: Machine[];
};

// TODO: rename to MachineListResponse
export type FetchResponse = {
  count: number;
  cur_page: number;
  num_pages: number;
  groups: FetchResponseGroup[];
};

export type MachineListIdsResponseGroup = Omit<
  MachineStateListGroup,
  "items"
> & {
  items: {
    id: Machine["system_id"];
    actions: Machine["actions"];
    permissions: Machine["permissions"];
  }[];
};

export type MachineListIdsResponse = {
  count: number;
  cur_page: number;
  num_pages: number;
  groups: MachineListIdsResponseGroup[];
};
