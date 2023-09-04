import { Spinner } from "@canonical/react-components";
import { useDispatch, useSelector } from "react-redux";

import InterfaceForm from "../InterfaceForm";

import EditInterfaceTable from "./EditInterfaceTable";

import FormCard from "@/app/base/components/FormCard";
import { useCycled } from "@/app/base/hooks";
import { actions as deviceActions } from "@/app/store/device";
import deviceSelectors from "@/app/store/device/selectors";
import type {
  Device,
  DeviceMeta,
  DeviceNetworkInterface,
} from "@/app/store/device/types";
import { isDeviceDetails } from "@/app/store/device/utils";
import type { RootState } from "@/app/store/root/types";
import type {
  NetworkLink,
  UpdateInterfaceParams,
} from "@/app/store/types/node";
import { preparePayload } from "@/app/utils";

type Props = {
  closeForm: () => void;
  linkId?: NetworkLink["id"] | null;
  nicId?: DeviceNetworkInterface["id"] | null;
  systemId: Device[DeviceMeta.PK];
};

const EditInterface = ({
  closeForm,
  nicId,
  linkId,
  systemId,
}: Props): JSX.Element => {
  const dispatch = useDispatch();
  const device = useSelector((state: RootState) =>
    deviceSelectors.getById(state, systemId)
  );
  const nic = useSelector((state: RootState) =>
    deviceSelectors.getInterfaceById(state, systemId, nicId, linkId)
  );
  const updatingInterface = useSelector((state: RootState) =>
    deviceSelectors.getStatusForDevice(state, systemId, "updatingInterface")
  );
  const updateInterfaceErrored =
    useSelector((state: RootState) =>
      deviceSelectors.eventErrorsForDevices(state, systemId, "updateInterface")
    ).length > 0;
  const [updatedInterface, resetUpdatedInterface] = useCycled(
    !updatingInterface
  );
  const saved = updatedInterface && !updateInterfaceErrored;
  if (!isDeviceDetails(device) || !nic) {
    return <Spinner data-testid="loading-device-details" text="Loading..." />;
  }
  return (
    <FormCard sidebar={false} stacked title="Edit physical">
      <EditInterfaceTable linkId={linkId} nicId={nicId} systemId={systemId} />
      <InterfaceForm
        closeForm={closeForm}
        linkId={linkId}
        nicId={nicId}
        onSaveAnalytics={{
          action: "Update interface",
          category: "Device details networking",
          label: "Update interface form",
        }}
        onSubmit={(values) => {
          resetUpdatedInterface();
          dispatch(deviceActions.cleanup());
          const payload = preparePayload({
            ...values,
            interface_id: nic.id,
            system_id: device.system_id,
          }) as UpdateInterfaceParams;
          dispatch(deviceActions.updateInterface(payload));
        }}
        saved={saved}
        saving={updatingInterface}
        showTitles
        systemId={systemId}
      />
    </FormCard>
  );
};

export default EditInterface;
