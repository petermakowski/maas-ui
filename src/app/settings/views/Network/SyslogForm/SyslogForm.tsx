import { useEffect } from "react";

import { Col, Spinner, Row } from "@canonical/react-components";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";

import FormikField from "@/app/base/components/FormikField";
import FormikForm from "@/app/base/components/FormikForm";
import { useWindowTitle } from "@/app/base/hooks";
import { actions as configActions } from "@/app/store/config";
import configSelectors from "@/app/store/config/selectors";

const SyslogSchema = Yup.object().shape({
  remote_syslog: Yup.string(),
});

const SyslogForm = (): JSX.Element => {
  const dispatch = useDispatch();
  const updateConfig = configActions.update;

  const loaded = useSelector(configSelectors.loaded);
  const loading = useSelector(configSelectors.loading);
  const saved = useSelector(configSelectors.saved);
  const saving = useSelector(configSelectors.saving);

  const remoteSyslog = useSelector(configSelectors.remoteSyslog);

  useWindowTitle("Syslog");

  useEffect(() => {
    if (!loaded) {
      dispatch(configActions.fetch());
    }
  }, [dispatch, loaded]);

  return (
    <Row>
      <Col size={6}>
        {loading && <Spinner text="Loading..." />}
        {loaded && (
          <FormikForm
            buttonsAlign="left"
            buttonsBordered={false}
            initialValues={{
              remote_syslog: remoteSyslog || "",
            }}
            onSaveAnalytics={{
              action: "Saved",
              category: "Network settings",
              label: "Syslog form",
            }}
            onSubmit={(values, { resetForm }) => {
              dispatch(updateConfig(values));
              resetForm({ values });
            }}
            saved={saved}
            saving={saving}
            validationSchema={SyslogSchema}
          >
            <FormikField
              help="A remote syslog server that MAAS will set on enlisting, commissioning, testing, and deploying machines to send all log messages. Clearing this value will restore the default behaviour of forwarding syslog to MAAS."
              label="Remote syslog server to forward machine logs"
              name="remote_syslog"
              type="text"
            />
          </FormikForm>
        )}
      </Col>
    </Row>
  );
};

export default SyslogForm;
