import { isReleaseNotification, isUpgradeNotification } from "./utils";

import { NotificationIdent } from "@/app/store/notification/types";
import { notification as notificationFactory } from "testing/factories";

describe("utils", () => {
  describe("isReleaseNotification", () => {
    it("it identifies a release notification", () => {
      const notification = notificationFactory({
        ident: NotificationIdent.RELEASE,
      });
      expect(isReleaseNotification(notification)).toBe(true);
    });

    it("it handles other notifications", () => {
      const notification = notificationFactory({
        ident: NotificationIdent.UPGRADE_STATUS,
      });
      expect(isReleaseNotification(notification)).toBe(false);
    });
  });

  describe("isUpgradeNotification", () => {
    it("it identifies upgrade status as an upgrade notification", () => {
      const notification = notificationFactory({
        ident: NotificationIdent.UPGRADE_STATUS,
      });
      expect(isUpgradeNotification(notification)).toBe(true);
    });

    it("it identifies upgrade version issue as an upgrade notification", () => {
      const notification = notificationFactory({
        ident: NotificationIdent.UPGRADE_VERSION_ISSUE,
      });
      expect(isUpgradeNotification(notification)).toBe(true);
    });

    it("it handles other notifications", () => {
      const notification = notificationFactory({
        ident: NotificationIdent.RELEASE,
      });
      expect(isUpgradeNotification(notification)).toBe(false);
    });
  });
});
