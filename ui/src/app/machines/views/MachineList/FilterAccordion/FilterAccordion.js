import { Accordion, Button, List, Loader } from "@canonical/react-components";
import { useSelector } from "react-redux";
import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useMemo } from "react";

import "./FilterAccordion.scss";
import {
  getCurrentFilters,
  isFilterActive,
  filtersToString,
  toggleFilter
} from "app/machines/search";
import { getMachineValue } from "app/utils";
import { machine as machineSelectors } from "app/base/selectors";
import ContextualMenu from "app/base/components/ContextualMenu";

const filterOrder = [
  "status",
  "owner",
  "pool",
  "architecture",
  "release",
  "tags",
  "storage_tags",
  "pod",
  "subnets",
  "fabrics",
  "zone",
  "numa_nodes_count",
  "sriov_support",
  "link_speeds"
];

const filterNames = new Map([
  ["architecture", "Architecture"],
  ["fabric", "Fabric"],
  ["fabrics", "Fabric"],
  ["numa_nodes_count", "NUMA nodes"],
  ["owner", "Owner"],
  ["pod", "KVM"],
  ["pool", "Resource pool"],
  ["rack", "Rack"],
  ["release", "OS/Release"],
  ["spaces", "Space"],
  ["sriov_support", "SR-IOV support"],
  ["status", "Status"],
  ["storage_tags", "Storage tags"],
  ["subnet", "Subnet"],
  ["subnets", "Subnet"],
  ["tags", "Tags"],
  ["vlan", "VLAN"],
  ["zone", "Zone"],
  ["link_speeds", "Link speed"]
]);

const formatSpeedUnits = speedInMbytes => {
  const megabytesInGigabyte = 1000;
  const gigabytesInTerabyte = 1000;

  if (
    speedInMbytes >= megabytesInGigabyte &&
    speedInMbytes < megabytesInGigabyte * gigabytesInTerabyte
  ) {
    return `${Math.round(speedInMbytes / megabytesInGigabyte)} Gbps`;
  }

  if (speedInMbytes >= megabytesInGigabyte * gigabytesInTerabyte) {
    return `${Math.round(
      speedInMbytes / megabytesInGigabyte / gigabytesInTerabyte
    )} Tbps`;
  }

  return `${speedInMbytes} Mbps`;
};

const getFilters = machines => {
  const filters = new Map();
  machines.forEach(machine => {
    filterOrder.forEach(filter => {
      let value = getMachineValue(machine, filter);
      // This is not a useful value so skip it.
      if (!value) {
        return;
      }
      // Turn everything into an array so we can loop over all values.
      if (!Array.isArray(value)) {
        value = [value];
      }
      let storedFilter = filters.get(filter);
      if (!storedFilter) {
        filters.set(filter, new Map());
        storedFilter = filters.get(filter);
      }
      value.forEach(filterValue => {
        let storedValue = storedFilter.get(filterValue);
        if (!storedValue) {
          storedFilter.set(filterValue, 0);
          storedValue = storedFilter.get(filterValue);
        }
        storedFilter.set(filterValue, storedValue + 1);
      });
    });
  });
  return filters;
};

const sortByFilterName = (a, b) => {
  a = a[0];
  b = b[0];
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

const FilterAccordion = ({ searchText, setSearchText }) => {
  const machines = useSelector(machineSelectors.all);
  const machinesLoaded = useSelector(machineSelectors.loaded);
  const filterOptions = useMemo(() => getFilters(machines), [machines]);
  const currentFilters = getCurrentFilters(searchText);
  let sections;
  if (machinesLoaded) {
    sections = filterOrder.reduce((options, filter) => {
      const filterValues = filterOptions.get(filter);
      if (filterValues) {
        options.push({
          title: filterNames.get(filter),
          content: (
            <List
              className="u-no-margin--bottom"
              items={Array.from(filterValues)
                .sort(sortByFilterName)
                .map(([filterValue, count]) => (
                  <Button
                    appearance="base"
                    className={classNames(
                      "u-align-text--left u-no-margin--bottom filter-accordion__item",
                      {
                        "is-active": isFilterActive(
                          currentFilters,
                          filter,
                          filterValue,
                          true
                        )
                      }
                    )}
                    onClick={() => {
                      const newFilters = toggleFilter(
                        currentFilters,
                        filter,
                        filterValue,
                        true
                      );
                      setSearchText(filtersToString(newFilters));
                    }}
                  >
                    {filter === "link_speeds"
                      ? formatSpeedUnits(filterValue)
                      : filterValue}{" "}
                    ({count})
                  </Button>
                ))}
            />
          )
        });
      }
      return options;
    }, []);
  }

  return (
    <ContextualMenu
      className="filter-accordion"
      constrainPanelWidth
      dropdownContent={
        machinesLoaded ? (
          <Accordion
            className="filter-accordion__dropdown"
            sections={sections}
          />
        ) : (
          <Loader text="Loading..." />
        )
      }
      hasToggleIcon
      position="left"
      toggleClassName="filter-accordion__toggle"
      toggleLabel="Filters"
    />
  );
};

FilterAccordion.propTypes = {
  searchText: PropTypes.string,
  setSearchText: PropTypes.func.isRequired
};

export default FilterAccordion;
