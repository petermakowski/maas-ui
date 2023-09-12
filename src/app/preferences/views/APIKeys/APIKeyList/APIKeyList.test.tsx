import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";

import APIKeyList, { Label as APIKeyListLabels } from "./APIKeyList";

import type { RootState } from "@/app/store/root/types";
import {
  rootState as rootStateFactory,
  token as tokenFactory,
  tokenState as tokenStateFactory,
} from "testing/factories";
import { renderWithMockStore, screen } from "testing/utils";

describe("APIKeyList", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory({
      token: tokenStateFactory({
        items: [
          tokenFactory({
            id: 1,
            key: "ssh-rsa aabb",
            consumer: { key: "abc", name: "Name" },
          }),
          tokenFactory({
            id: 2,
            key: "ssh-rsa ccdd",
            consumer: { key: "abc", name: "Name" },
          }),
        ],
      }),
    });
  });

  it("can render the table", () => {
    renderWithMockStore(
      <MemoryRouter
        initialEntries={[
          { pathname: "/account/prefs/api-keys", key: "testKey" },
        ]}
      >
        <CompatRouter>
          <APIKeyList />
        </CompatRouter>
      </MemoryRouter>,
      { state }
    );
    expect(
      screen.getByRole("grid", { name: APIKeyListLabels.Title })
    ).toBeInTheDocument();
  });
});
