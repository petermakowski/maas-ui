import { useEffect } from "react";

import { Spinner } from "@canonical/react-components";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom-v5-compat";

import LicenseKeyForm from "../LicenseKeyForm";

import { actions as licenseKeysActions } from "@/app/store/licensekeys";
import licenseKeysSelectors from "@/app/store/licensekeys/selectors";
import type { LicenseKeys } from "@/app/store/licensekeys/types";
import type { RootState } from "@/app/store/root/types";

export enum Labels {
  Loading = "Loading...",
  KeyNotFound = "License key not found",
}

export const LicenseKeyEdit = (): JSX.Element => {
  const dispatch = useDispatch();
  const { osystem, distro_series } = useParams<{
    osystem?: LicenseKeys["osystem"];
    distro_series?: LicenseKeys["distro_series"];
  }>();
  const loading = useSelector(licenseKeysSelectors.loading);

  const licenseKey = useSelector((state: RootState) =>
    licenseKeysSelectors.getByOsystemAndDistroSeries(
      state,
      osystem,
      distro_series
    )
  );

  useEffect(() => {
    dispatch(licenseKeysActions.fetch());
  }, [dispatch]);

  if (loading) {
    return <Spinner text={Labels.Loading} />;
  }
  if (!licenseKey) {
    return <h4>{Labels.KeyNotFound}</h4>;
  }
  return <LicenseKeyForm licenseKey={licenseKey} />;
};

export default LicenseKeyEdit;
