import { isDomainDetails } from "./utils";

import {
  domainDetails as domainDetailsFactory,
  domain as domainFactory,
} from "testing/factories";

describe("domain utils", () => {
  describe("isDomainDetails", () => {
    it("identifies domain details", () => {
      expect(isDomainDetails(domainDetailsFactory())).toBe(true);
    });

    it("handles a base domain", () => {
      expect(isDomainDetails(domainFactory())).toBe(false);
    });

    it("handles no domain", () => {
      expect(isDomainDetails()).toBe(false);
    });

    it("handles null", () => {
      expect(isDomainDetails(null)).toBe(false);
    });
  });
});
