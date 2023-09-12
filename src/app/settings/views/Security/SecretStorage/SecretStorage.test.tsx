import SecretStorage from "./SecretStorage";

import {
  controller as controllerFactory,
  controllerState as controllerStateFactory,
  generalState as generalStateFactory,
  rootState as rootStateFactory,
  vaultEnabledState as vaultEnabledStateFactory,
} from "testing/factories";
import { renderWithBrowserRouter, screen } from "testing/utils";

it("displays loading text if Vault Status has not loaded", () => {
  const state = rootStateFactory({
    general: generalStateFactory({
      vaultEnabled: vaultEnabledStateFactory({
        data: false,
        loaded: false,
        loading: true,
      }),
    }),
  });
  renderWithBrowserRouter(<SecretStorage />, { state });

  expect(screen.getByText(/Loading.../)).toBeInTheDocument();
});

it("renders the Vault section", () => {
  const state = rootStateFactory({
    general: generalStateFactory({
      vaultEnabled: vaultEnabledStateFactory({
        data: false,
        loaded: true,
      }),
    }),
    controller: controllerStateFactory({
      loaded: true,
      items: [controllerFactory({ vault_configured: false })],
    }),
  });

  renderWithBrowserRouter(<SecretStorage />, { state });

  expect(screen.getByText(/Integrate with Vault/)).toBeInTheDocument();
});
