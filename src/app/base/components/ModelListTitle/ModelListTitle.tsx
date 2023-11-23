import pluralize from "pluralize";

import Placeholder from "../Placeholder";

type Props = {
  count?: number;
  isLoading: boolean;
  model:
    | "machine"
    | "controller"
    | "device"
    | "subnet"
    | "pool"
    | "fabric"
    | "kvm"
    | "user";
};

export enum TestIds {
  Title = "model-list-title",
}

export const ModelListTitle = ({
  count,
  isLoading,
  model,
}: Props): JSX.Element => {
  return (
    <Placeholder loading={isLoading && !count}>
      <span data-testid={TestIds.Title}>{pluralize(model, count, true)}</span>
    </Placeholder>
  );
};
