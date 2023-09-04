import NodePowerDefinitions from "@/app/base/components/node/NodePowerParameters/NodePowerDefinitions";
import NodePowerNotifications from "@/app/base/components/node/NodePowerParameters/NodePowerNotifications";
import type { ControllerDetails } from "@/app/store/controller/types";
import type { MachineDetails } from "@/app/store/machine/types";

type Props = {
  node: MachineDetails | ControllerDetails;
};

const NodePowerParameters = ({ node }: Props): JSX.Element => {
  return (
    <div data-testid="node-power-parameters">
      <NodePowerNotifications node={node} />
      <NodePowerDefinitions node={node} />
    </div>
  );
};

export default NodePowerParameters;
