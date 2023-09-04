import { Icon } from "@canonical/react-components";
import { useSelector } from "react-redux";

import TooltipButton from "@/app/base/components/TooltipButton";
import ControllerStatus from "@/app/controllers/components/ControllerStatus";
import controllerSelectors from "@/app/store/controller/selectors";
import type { Controller, ControllerMeta } from "@/app/store/controller/types";
import type { RootState } from "@/app/store/root/types";

type Props = {
  systemId: Controller[ControllerMeta.PK];
};

export const StatusColumn = ({ systemId }: Props): JSX.Element | null => {
  const controller = useSelector((state: RootState) =>
    controllerSelectors.getById(state, systemId)
  );

  if (!controller) {
    return null;
  }
  // Map the issue id to the type of issue.
  const issues = (controller.versions?.issues || []).map((issue) =>
    issue.replace("different-", "")
  );
  const issue = issues.length
    ? `Different ${issues.join(" and ")} detected.`
    : null;

  return issue ? (
    <span data-testid="version-error">
      <Icon name="error" />{" "}
      <TooltipButton
        message={
          <>
            {issue}
            <br />
            <a
              className="is-on-dark"
              href="https://discourse.maas.io/t/4555"
              rel="noreferrer noopener"
              target="_blank"
            >
              More info
            </a>
          </>
        }
        position="top-center"
      />
    </span>
  ) : (
    <ControllerStatus systemId={systemId} />
  );
};

export default StatusColumn;
