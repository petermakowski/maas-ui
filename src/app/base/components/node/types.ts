import type { AnyAction } from "redux";

import type { ActionState, CommonActionFormProps } from "@/app/base/types";
import type { SelectedMachines } from "@/app/store/machine/types";
import type { Node } from "@/app/store/types/node";

export type NodeActionFormProps<E = null> = CommonActionFormProps<E> & {
  cleanup?: () => AnyAction;
  modelName: string;
  submitDisabled?: boolean;
  actionStatus?: ActionState["status"];
} & (
    | {
        nodes: Node[];
        processingCount: number;
        selectedMachines?: never;
        searchFilter?: never;
        selectedCount?: never;
      }
    | {
        selectedMachines?: SelectedMachines | null;
        processingCount?: never;
        selectedCount?: number | null;
        searchFilter?: string;
        nodes?: never;
      }
  );
