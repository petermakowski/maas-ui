import actionHandlers from "./actions";
import {
  watchAddMachineChassis,
  watchCheckAuthenticated,
  watchCreateLicenseKey,
  watchDeleteLicenseKey,
  watchExternalLogin,
  watchFetchLicenseKeys,
  watchLogin,
  watchLogout,
  watchUpdateLicenseKey,
  watchUploadScript,
  watchZonesFetch,
} from "./http";
import { watchWebSockets } from "./websockets";

export {
  actionHandlers,
  watchCheckAuthenticated,
  watchLogin,
  watchLogout,
  watchExternalLogin,
  watchWebSockets,
  watchCreateLicenseKey,
  watchUpdateLicenseKey,
  watchDeleteLicenseKey,
  watchFetchLicenseKeys,
  watchUploadScript,
  watchAddMachineChassis,
  watchZonesFetch,
};
