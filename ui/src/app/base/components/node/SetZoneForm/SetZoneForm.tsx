import { Col, Row } from "@canonical/react-components";
import * as Yup from "yup";

import type { NodeActionFormProps } from "../types";

import ActionForm from "app/base/components/ActionForm";
import ZoneSelect from "app/base/components/ZoneSelect";
import { NodeActions } from "app/store/types/node";
import type { Zone } from "app/store/zone/types";
import { capitaliseFirst } from "app/utils";

type Props<E = null> = NodeActionFormProps<E> & {
  onSubmit: (zoneID: Zone["id"]) => void;
};

export type SetZoneFormValues = {
  zone: Zone["id"] | "";
};

const SetZoneSchema = Yup.object().shape({
  zone: Yup.number().required("Zone is required"),
});

export const SetZoneForm = <E,>({
  clearHeaderContent,
  cleanup,
  errors,
  nodes,
  modelName,
  onSubmit,
  processingCount,
  viewingDetails,
}: Props<E>): JSX.Element => {
  return (
    <ActionForm<SetZoneFormValues, E>
      actionName={NodeActions.SET_ZONE}
      cleanup={cleanup}
      errors={errors}
      initialValues={{ zone: "" }}
      modelName={modelName}
      onCancel={clearHeaderContent}
      onSaveAnalytics={{
        action: "Submit",
        category: `${capitaliseFirst(modelName)} ${
          viewingDetails ? "details" : "list"
        } action form`,
        label: "Set zone",
      }}
      onSubmit={(values) => {
        if (values.zone || values.zone === 0) {
          onSubmit(values.zone);
        }
      }}
      onSuccess={clearHeaderContent}
      processingCount={processingCount}
      selectedCount={nodes.length}
      validationSchema={SetZoneSchema}
    >
      <Row>
        <Col size={6}>
          <ZoneSelect name="zone" required valueKey="id" />
        </Col>
      </Row>
    </ActionForm>
  );
};

export default SetZoneForm;
