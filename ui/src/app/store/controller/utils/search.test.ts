import { FilterControllers, getControllerValue } from "./search";

import type { Filters } from "app/utils/search/filter-handlers";
import { controller as controllerFactory } from "testing/factories";

describe("search", () => {
  describe("getControllerValue", () => {
    it("can get an attribute via a mapping function", () => {
      const controller = controllerFactory({
        domain: { id: 1, name: "danger" },
      });
      expect(getControllerValue(controller, "domain")).toBe("danger");
    });

    it("can get an attribute directly from the controller", () => {
      const controller = controllerFactory({ hostname: "miami-controller" });
      expect(getControllerValue(controller, "hostname")).toBe(
        "miami-controller"
      );
    });

    it("can get an attribute that is an array directly from the controller", () => {
      const controller = controllerFactory({ tags: [1, 2] });
      expect(getControllerValue(controller, "tags")).toStrictEqual([1, 2]);
    });
  });

  describe("FilterController", () => {
    const scenarios: {
      filters: Filters;
      input: string;
      output?: string;
    }[] = [
      {
        input: "free-text",
        filters: {
          q: ["free-text"],
        },
      },
      {
        input: "hostname:(miami)",
        filters: {
          q: [],
          hostname: ["miami"],
        },
      },
      {
        input: "tags:(tag1,tag2)",
        filters: {
          q: [],
          tags: ["tag1", "tag2"],
        },
      },
      {
        input: "free-text hostname:(miami) tags:(tag1,tag2)",
        filters: {
          q: ["free-text"],
          hostname: ["miami"],
          tags: ["tag1", "tag2"],
        },
      },
    ];

    scenarios.forEach((scenario) => {
      describe("input:" + scenario.input, () => {
        it("getCurrentFilters", () => {
          expect(FilterControllers.getCurrentFilters(scenario.input)).toEqual(
            scenario.filters
          );
        });
      });
    });
  });
});
