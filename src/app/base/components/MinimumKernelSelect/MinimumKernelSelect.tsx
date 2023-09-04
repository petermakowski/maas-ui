import { useEffect } from "react";
import type { HTMLProps } from "react";

import { Select } from "@canonical/react-components";
import { useDispatch, useSelector } from "react-redux";

import FormikField from "@/app/base/components/FormikField";
import { actions as generalActions } from "@/app/store/general";
import { hweKernels as hweKernelsSelectors } from "@/app/store/general/selectors";

type Props = {
  disabled?: boolean;
  label?: string;
  name: string;
} & HTMLProps<HTMLSelectElement>;

export enum Labels {
  DefaultOption = "Select minimum kernel",
  NoneOption = "No minimum kernel",
  Select = "Minimum kernel",
}

export const MinimumKernelSelect = ({
  disabled = false,
  label = Labels.Select,
  name,
  ...props
}: Props): JSX.Element => {
  const dispatch = useDispatch();
  const hweKernels = useSelector(hweKernelsSelectors.get);
  const hweKernelsLoaded = useSelector(hweKernelsSelectors.loaded);

  useEffect(() => {
    dispatch(generalActions.fetchHweKernels());
  }, [dispatch]);

  return (
    <FormikField
      component={Select}
      disabled={!hweKernelsLoaded || disabled}
      label={label}
      name={name}
      options={[
        {
          label: Labels.DefaultOption,
          disabled: true,
        },
        { label: Labels.NoneOption, value: "" },
        ...hweKernels.map((kernel) => ({
          key: `kernel-${kernel[1]}`,
          label: kernel[1],
          value: kernel[0],
        })),
      ]}
      {...props}
    />
  );
};

export default MinimumKernelSelect;
