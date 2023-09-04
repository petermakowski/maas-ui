import { useCallback } from "react";

import { usePrevious } from "@canonical/react-components/dist/hooks";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";

import FetchImagesFormFields from "./FetchImagesFormFields";

import FormikForm from "@/app/base/components/FormikForm";
import type { APIError } from "@/app/base/types";
import { actions as bootResourceActions } from "@/app/store/bootresource";
import bootResourceSelectors from "@/app/store/bootresource/selectors";
import { BootResourceSourceType } from "@/app/store/bootresource/types";
import type { BootResourceUbuntuSource } from "@/app/store/bootresource/types";

const FetchImagesSchema = Yup.object()
  .shape({
    keyring_data: Yup.string(),
    keyring_filename: Yup.string(),
    source_type: Yup.string().required("Source type is required"),
    url: Yup.string().when("source_type", {
      is: (val: string) => val === BootResourceSourceType.CUSTOM,
      then: Yup.string().required("URL is required for custom sources"),
    }),
  })
  .defined();

export enum Labels {
  SubmitLabel = "Connect",
}

export type FetchImagesValues = {
  keyring_data: string;
  keyring_filename: string;
  source_type: BootResourceSourceType;
  url: string;
};

type Props = {
  closeForm: (() => void) | null;
  setSource: (source: BootResourceUbuntuSource) => void;
};

const FetchImagesForm = ({ closeForm, setSource }: Props): JSX.Element => {
  const dispatch = useDispatch();
  const errors = useSelector(bootResourceSelectors.fetchError);
  const saving = useSelector(bootResourceSelectors.fetching);
  const previousSaving = usePrevious(saving);
  const cleanup = useCallback(() => bootResourceActions.cleanup(), []);
  // Consider the connection established if fetching was started, then stopped
  // without any errors.
  const saved = !saving && previousSaving && !errors;

  return (
    <FormikForm<FetchImagesValues>
      allowUnchanged
      cleanup={cleanup}
      errors={errors as APIError}
      initialValues={{
        keyring_data: "",
        keyring_filename: "",
        source_type: BootResourceSourceType.MAAS_IO,
        url: "",
      }}
      onCancel={closeForm}
      onSubmit={(values) => {
        dispatch(cleanup());
        dispatch(bootResourceActions.fetch(values));
      }}
      onSuccess={(values) => {
        setSource(values);
      }}
      saved={saved}
      saving={saving}
      submitLabel={Labels.SubmitLabel}
      validationSchema={FetchImagesSchema}
    >
      <FetchImagesFormFields />
    </FormikForm>
  );
};

export default FetchImagesForm;
