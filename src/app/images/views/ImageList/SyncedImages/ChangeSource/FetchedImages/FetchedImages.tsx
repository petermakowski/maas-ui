import { useCallback, useEffect } from "react";

import { usePrevious } from "@canonical/react-components/dist/hooks";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";

import FormikForm from "@/app/base/components/FormikForm";
import UbuntuImageSelect from "@/app/images/components/UbuntuImageSelect";
import type { ImageValue } from "@/app/images/types";
import { actions as bootResourceActions } from "@/app/store/bootresource";
import bootResourceSelectors from "@/app/store/bootresource/selectors";
import type {
  BootResourceUbuntuSource,
  OsystemParam,
} from "@/app/store/bootresource/types";
import { BootResourceAction } from "@/app/store/bootresource/types";
import configSelectors from "@/app/store/config/selectors";

export const DEFAULT_ARCH = "amd64";

export enum Labels {
  SubmitLabel = "Update selection",
}

const FetchedImagesSchema = Yup.object()
  .shape({
    images: Yup.array().of(
      Yup.object().shape({
        arch: Yup.string(),
        os: Yup.string(),
        release: Yup.string(),
        title: Yup.string(),
      })
    ),
  })
  .defined();

export type FetchedImagesValues = {
  images: ImageValue[];
};

type Props = {
  closeForm: () => void;
  source: BootResourceUbuntuSource;
};

const FetchedImages = ({ closeForm, source }: Props): JSX.Element | null => {
  const dispatch = useDispatch();
  const commissioningReleaseName = useSelector(
    configSelectors.commissioningDistroSeries
  );
  const resources = useSelector(bootResourceSelectors.ubuntuResources);
  const fetchedImages = useSelector(bootResourceSelectors.fetchedImages);
  const saving = useSelector(bootResourceSelectors.savingUbuntu);
  const previousSaving = usePrevious(saving);
  const eventErrors = useSelector(bootResourceSelectors.eventErrors);
  const error = eventErrors.find(
    (error) => error.event === BootResourceAction.SAVE_UBUNTU
  )?.error;
  const cleanup = useCallback(() => bootResourceActions.cleanup(), []);
  const saved = previousSaving && !saving && !error;

  useEffect(() => {
    return () => {
      dispatch(bootResourceActions.clearFetchedImages());
    };
  }, [dispatch]);

  if (
    !fetchedImages ||
    !fetchedImages.arches.length ||
    !fetchedImages.releases.length
  ) {
    closeForm();
    return null;
  }

  const { arches, releases } = fetchedImages;
  const commissioningRelease = releases.find(
    (release) => release.name === commissioningReleaseName
  );
  const defaultArch = arches.find((arch) => arch.name === DEFAULT_ARCH);

  return (
    <>
      <h4>
        Showing images fetched from <strong>{source.url || "maas.io"}</strong>
      </h4>
      <hr />
      <FormikForm<FetchedImagesValues>
        allowUnchanged
        buttonsBordered={false}
        cleanup={cleanup}
        enableReinitialize
        errors={error}
        initialValues={{
          images: [
            {
              arch: defaultArch?.name || arches[0].name,
              release: commissioningRelease?.name || releases[0].name,
              os: "ubuntu",
              title: commissioningRelease?.title || releases[0].title,
            },
          ],
        }}
        onCancel={closeForm}
        onSubmit={(values) => {
          dispatch(cleanup());
          const osystems = values.images.reduce<OsystemParam[]>(
            (osystems, image) => {
              const existingOsystem = osystems.find(
                (os) => os.osystem === image.os && os.release === image.release
              );
              if (existingOsystem) {
                existingOsystem.arches.push(image.arch);
              } else {
                osystems.push({
                  arches: [image.arch],
                  osystem: image.os,
                  release: image.release,
                });
              }
              return osystems;
            },
            []
          );
          const params = {
            osystems,
            ...source,
          };
          dispatch(bootResourceActions.saveUbuntu(params));
        }}
        onSuccess={() => {
          dispatch(bootResourceActions.poll({ continuous: false }));
          closeForm();
        }}
        saved={saved}
        saving={saving}
        submitLabel={Labels.SubmitLabel}
        validationSchema={FetchedImagesSchema}
      >
        <UbuntuImageSelect
          arches={arches}
          releases={releases}
          resources={resources}
        />
      </FormikForm>
    </>
  );
};

export default FetchedImages;
