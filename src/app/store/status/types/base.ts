import type { APIError } from "app/base/types";

export type StatusState = {
  authenticated: boolean;
  authenticating: boolean;
  authenticationError: APIError;
  websocket: {
    connected: boolean;
    connecting: boolean;
    reconnectionCount: number;
  };
  error: APIError;
  externalAuthURL: string | null;
  externalLoginURL: string | null;
  noUsers: boolean;
};
