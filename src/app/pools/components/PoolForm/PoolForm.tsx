import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom-v5-compat";
import * as Yup from "yup";

import FormCard from "@/app/base/components/FormCard";
import FormikField from "@/app/base/components/FormikField";
import FormikForm from "@/app/base/components/FormikForm";
import { useAddMessage, useWindowTitle } from "@/app/base/hooks";
import urls from "@/app/base/urls";
import { actions as poolActions } from "@/app/store/resourcepool";
import poolSelectors from "@/app/store/resourcepool/selectors";
import type { ResourcePool } from "@/app/store/resourcepool/types";

type Props = {
  pool?: ResourcePool | null;
};

type PoolFormValues = {
  description: ResourcePool["description"];
  name: ResourcePool["name"];
};

export enum Labels {
  AddPoolTitle = "Add pool",
  EditPoolTitle = "Edit pool",
  SubmitLabel = "Save pool",
  PoolName = "Name (required)",
  PoolDescription = "Description",
}

const PoolSchema = Yup.object().shape({
  name: Yup.string().required("name is required"),
  description: Yup.string(),
});

export const PoolForm = ({ pool, ...props }: Props): JSX.Element => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const saved = useSelector(poolSelectors.saved);
  const saving = useSelector(poolSelectors.saving);
  const errors = useSelector(poolSelectors.errors);
  const [savingPool, setSaving] = useState<ResourcePool["name"] | null>();

  useAddMessage(
    saved,
    poolActions.cleanup,
    `${savingPool} ${pool ? "updated" : "added"} successfully.`,
    () => setSaving(null)
  );

  let initialValues: PoolFormValues;
  let title: string;
  if (pool) {
    title = Labels.EditPoolTitle;
    initialValues = {
      name: pool.name,
      description: pool.description,
    };
  } else {
    title = Labels.AddPoolTitle;
    initialValues = {
      name: "",
      description: "",
    };
  }

  useWindowTitle(title);

  return (
    <FormCard sidebar={false} title={title}>
      <FormikForm
        aria-label={title}
        cleanup={poolActions.cleanup}
        errors={errors}
        initialValues={initialValues}
        onCancel={() => navigate({ pathname: urls.pools.index })}
        onSaveAnalytics={{
          action: "Saved",
          category: "Resource pool",
          label: "Add pool form",
        }}
        onSubmit={(values) => {
          dispatch(poolActions.cleanup());
          if (pool) {
            dispatch(
              poolActions.update({
                ...values,
                id: pool.id,
              })
            );
          } else {
            dispatch(poolActions.create(values));
          }
          setSaving(values.name);
        }}
        saved={saved}
        savedRedirect={urls.pools.index}
        saving={saving}
        submitLabel={Labels.SubmitLabel}
        validationSchema={PoolSchema}
        {...props}
      >
        <FormikField label={Labels.PoolName} name="name" type="text" />
        <FormikField
          label={Labels.PoolDescription}
          name="description"
          type="text"
        />
      </FormikForm>
    </FormCard>
  );
};

export default PoolForm;
