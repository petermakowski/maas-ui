import { Col, Link, Row, Select, Textarea } from "@canonical/react-components";
import type { ColSize } from "@canonical/react-components";
import { useFormikContext } from "formik";

import type { SSHKeyFormValues } from "../types";

import FormikField from "@/app/base/components/FormikField";
import TooltipButton from "@/app/base/components/TooltipButton";
import { COL_SIZES } from "@/app/base/constants";
import docsUrls from "@/app/base/docsUrls";

type Props = {
  cols?: number;
};

export const SSHKeyFormFields = ({
  cols = COL_SIZES.TOTAL,
}: Props): JSX.Element => {
  const { values } = useFormikContext<SSHKeyFormValues>();
  const { protocol } = values;
  const uploadSelected = protocol === "upload";
  const colSize = cols / 2;

  return (
    <>
      <Row>
        <Col size={Math.ceil(colSize) as ColSize}>
          <FormikField
            component={Select}
            label="Source"
            name="protocol"
            options={[
              { value: "", label: "Select source" },
              { value: "lp", label: "Launchpad" },
              { value: "gh", label: "GitHub" },
              { value: "upload", label: "Upload" },
            ]}
          />
          {protocol && !uploadSelected && (
            <FormikField
              label={protocol === "lp" ? "Launchpad ID" : "GitHub username"}
              name="auth_id"
              required={true}
              type="text"
            />
          )}
          {uploadSelected && (
            <FormikField
              aria-label="Public key"
              component={Textarea}
              help="Usually at ~/.ssh/id_rsa.pub, ~/.ssh/id_dsa.pub, or ~/.ssh/id_ecdsa.pub"
              label={
                <>
                  Public key{" "}
                  <TooltipButton
                    iconName="help"
                    message={`Begins with 'ssh-rsa', 'ssh-dss', 'ssh-ed25519',
                    'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', or
                    'ecdsa-sha2-nistp521`}
                    position="btm-left"
                  />
                </>
              }
              name="key"
              style={{ minHeight: "10rem" }}
            />
          )}
        </Col>
        <Col size={Math.floor(colSize) as ColSize}>
          <p className="form-card__help">
            Before you can deploy a machine you must import at least one public
            SSH key into MAAS, so the deployed machine can be accessed.
          </p>
        </Col>
      </Row>
      <Link href={docsUrls.sshKeys} rel="noreferrer noopener" target="_blank">
        About SSH keys
      </Link>
    </>
  );
};

export default SSHKeyFormFields;
