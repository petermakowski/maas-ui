import StatusColumn from "./StatusColumn";

import { PowerState } from "@/app/store/types/enum";
import { NodeStatusCode } from "@/app/store/types/node";
import {
  generalState as generalStateFactory,
  machine as machineFactory,
  machineState as machineStateFactory,
  osInfo as osInfoFactory,
  osInfoState as osInfoStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { renderWithMockStore, screen } from "testing/utils";

describe("StatusColumn", () => {
  it("shows a spinner if the machine is still loading", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: [],
      }),
    });
    renderWithMockStore(<StatusColumn systemId="abc123" />, { state });

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("shows a spinner if the VM is in a transient state", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: [
          machineFactory({
            status_code: NodeStatusCode.COMMISSIONING,
            system_id: "abc123",
          }),
        ],
      }),
    });
    renderWithMockStore(<StatusColumn systemId="abc123" />, { state });

    const loadingIcon = screen.getByLabelText(/Loading/i);
    expect(loadingIcon).toBeInTheDocument();
    expect(loadingIcon).toHaveClass("u-animation--spin");
  });

  it("shows a power icon if the VM is not in a transient state", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        items: [
          machineFactory({
            power_state: PowerState.OFF,
            status_code: NodeStatusCode.READY,
            system_id: "abc123",
          }),
        ],
      }),
    });
    renderWithMockStore(<StatusColumn systemId="abc123" />, { state });

    const offIcon = screen.getByLabelText(/off/i);
    expect(offIcon).toBeInTheDocument();
    expect(offIcon).toHaveClass("p-icon--power-off");
  });

  it("can show a VM's OS info", () => {
    const state = rootStateFactory({
      general: generalStateFactory({
        osInfo: osInfoStateFactory({
          data: osInfoFactory({
            releases: [["ubuntu/focal", 'Ubuntu 20.04 LTS "Focal Fossa"']],
          }),
        }),
      }),
      machine: machineStateFactory({
        items: [
          machineFactory({
            distro_series: "focal",
            osystem: "ubuntu",
            status_code: NodeStatusCode.DEPLOYED,
            system_id: "abc123",
          }),
        ],
      }),
    });
    renderWithMockStore(<StatusColumn systemId="abc123" />, { state });

    expect(screen.getByTestId("secondary").textContent).toBe(
      "Ubuntu 20.04 LTS"
    );
  });
});
