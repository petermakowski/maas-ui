import type { NotificationCategory, NotificationIdent } from "./enum";

import type { APIError } from "@/app/base/types";
import type { TimestampedModel } from "@/app/store/types/model";
import type { GenericState } from "@/app/store/types/state";
import type { User } from "@/app/store/user/types";

export type Notification = TimestampedModel & {
  ident: NotificationIdent | string;
  user: User;
  users: boolean;
  admins: boolean;
  message: string;
  category: NotificationCategory;
  dismissable: boolean;
};

export type NotificationState = GenericState<Notification, APIError>;
