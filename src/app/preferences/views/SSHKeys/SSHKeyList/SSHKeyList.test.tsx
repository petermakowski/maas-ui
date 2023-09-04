import { MemoryRouter } from "react-router-dom";
import { CompatRouter } from "react-router-dom-v5-compat";

import SSHKeyList, { Label as SSHKeyListLabels } from "./SSHKeyList";

import type { RootState } from "@/app/store/root/types";
import {
  sshKey as sshKeyFactory,
  sshKeyState as sshKeyStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { screen, renderWithMockStore } from "testing/utils";

describe("SSHKeyList", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory({
      sshkey: sshKeyStateFactory({
        loading: false,
        loaded: true,
        items: [
          sshKeyFactory({
            id: 1,
            key: "ssh-rsa aabb",
            keysource: { protocol: "lp", auth_id: "koalaparty" },
          }),
          sshKeyFactory({
            id: 2,
            key: "ssh-rsa ccdd",
            keysource: { protocol: "gh", auth_id: "koalaparty" },
          }),
          sshKeyFactory({
            id: 3,
            key: "ssh-rsa eeff",
            keysource: { protocol: "lp", auth_id: "maaate" },
          }),
          sshKeyFactory({
            id: 4,
            key: "ssh-rsa gghh",
            keysource: { protocol: "gh", auth_id: "koalaparty" },
          }),
          sshKeyFactory({ id: 5, key: "ssh-rsa gghh" }),
        ],
      }),
    });
  });

  it("renders", () => {
    renderWithMockStore(
      <MemoryRouter
        initialEntries={[
          { pathname: "/account/prefs/ssh-keys", key: "testKey" },
        ]}
      >
        <CompatRouter>
          <SSHKeyList />
        </CompatRouter>
      </MemoryRouter>,
      { state }
    );
    expect(screen.getByRole("grid", { name: SSHKeyListLabels.Title }));
  });
});
