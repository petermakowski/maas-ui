import reducers from "./slice";

import type { UserState } from "@/app/store/user/types";
import {
  authState as authStateFactory,
  user as userFactory,
  userState as userStateFactory,
} from "testing/factories";

describe("auth", () => {
  let userState: UserState;

  beforeEach(() => {
    userState = userStateFactory();
  });

  it("should return the initial state", () => {
    expect(reducers(undefined, { type: "" })).toStrictEqual({
      auth: authStateFactory({
        errors: null,
        loaded: false,
        loading: false,
        saved: false,
        saving: false,
        user: null,
      }),
    });
  });

  it("should correctly reduce auth/fetchStart", () => {
    const user = userFactory();
    expect(
      reducers(
        {
          ...userState,
          auth: authStateFactory({
            loading: false,
            user,
          }),
        },
        {
          type: "auth/fetchStart",
        }
      )
    ).toStrictEqual({
      ...userState,
      auth: authStateFactory({
        loading: true,
        user,
      }),
    });
  });

  it("should correctly reduce auth/fetchSuccess", () => {
    const user = userFactory();
    expect(
      reducers(
        {
          ...userState,
          auth: authStateFactory({
            loaded: false,
            loading: true,
          }),
        },
        {
          payload: user,
          type: "auth/fetchSuccess",
        }
      )
    ).toStrictEqual({
      ...userState,
      auth: authStateFactory({
        loaded: true,
        loading: false,
        user,
      }),
    });
  });

  it("should correctly reduce auth/changePasswordStart", () => {
    const auth = authStateFactory({
      saved: true,
      saving: false,
    });
    expect(
      reducers(
        {
          ...userState,
          auth,
        },
        {
          payload: { password: "pass1" },
          type: "auth/changePasswordStart",
        }
      )
    ).toStrictEqual({
      ...userState,
      auth: authStateFactory({
        ...auth,
        saved: false,
        saving: true,
      }),
    });
  });

  it("should correctly reduce auth/changePasswordError", () => {
    const auth = authStateFactory({
      saved: true,
      saving: true,
    });
    expect(
      reducers(
        {
          ...userState,
          auth,
        },
        {
          error: true,
          payload: { password: "Passwords don't match" },
          type: "auth/changePasswordError",
        }
      )
    ).toStrictEqual({
      ...userState,
      auth: authStateFactory({
        ...auth,
        errors: { password: "Passwords don't match" },
        saved: false,
        saving: false,
      }),
    });
  });

  it("should correctly reduce auth/changePasswordSuccess", () => {
    const auth = authStateFactory({
      errors: { password: "Passwords don't match" },
      saved: false,
      saving: true,
    });
    expect(
      reducers(
        {
          ...userState,
          auth,
        },
        {
          type: "auth/changePasswordSuccess",
        }
      )
    ).toStrictEqual({
      ...userState,
      auth: authStateFactory({
        ...auth,
        errors: null,
        saved: true,
        saving: false,
      }),
    });
  });

  it("should correctly reduce user/createNotify", () => {
    const user = userFactory({ id: 707, username: "wallaby-created" });
    expect(
      reducers(
        {
          ...userState,
          auth: authStateFactory({
            user: userFactory({ id: 707, username: "wallaby" }),
          }),
        },
        {
          payload: user,
          type: "user/createNotify",
        }
      )
    ).toStrictEqual({
      ...userState,
      auth: authStateFactory({
        user,
      }),
    });
  });

  it("should correctly reduce user/updateNotify", () => {
    const user = userFactory({ id: 707, username: "wallaby-updated" });
    expect(
      reducers(
        {
          ...userState,
          auth: authStateFactory({
            user: userFactory({ id: 707, username: "wallaby" }),
          }),
        },
        {
          payload: user,
          type: "user/createNotify",
        }
      )
    ).toStrictEqual({
      ...userState,
      auth: authStateFactory({
        user,
      }),
    });
  });

  it("does not reduce user/updateNotify for other users", () => {
    const initialState = {
      ...userState,
      auth: authStateFactory({
        user: userFactory(),
      }),
    };
    expect(
      reducers(initialState, {
        payload: userFactory({
          id: 909,
          username: "admin2",
        }),
        type: "user/createNotify",
      })
    ).toStrictEqual(initialState);
  });

  it("reduces auth/cleanup", () => {
    const auth = authStateFactory({
      errors: { password: "Passwords don't match" },
      saved: true,
      saving: true,
    });
    expect(
      reducers(
        {
          ...userState,
          auth,
        },
        {
          type: "auth/cleanup",
        }
      )
    ).toStrictEqual({
      ...userState,
      auth: authStateFactory({
        ...auth,
        errors: null,
        saved: false,
        saving: false,
      }),
    });
  });
});
