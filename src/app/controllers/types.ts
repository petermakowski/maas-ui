import type { ValueOf } from "@canonical/react-components";

import type { SidePanelContent, SetSidePanelContent } from "app/base/types";
import type { ControllerHeaderViews } from "app/controllers/constants";
import type { Controller } from "app/store/controller/types";

export type ControllerSidePanelContent =
  | SidePanelContent<
      ValueOf<typeof ControllerHeaderViews>,
      { controllers: Controller[] }
    >
  | SidePanelContent<typeof ControllerHeaderViews.ADD_CONTROLLER>;

export type ControllerSetSidePanelContent =
  SetSidePanelContent<ControllerSidePanelContent>;
