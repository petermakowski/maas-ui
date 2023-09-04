import { useState } from "react";

import type { PropsWithSpread, StripProps } from "@canonical/react-components";
import {
  Button,
  Col,
  Icon,
  Row,
  Strip,
  Tooltip,
} from "@canonical/react-components";
import { useSelector } from "react-redux";

import ChangeSource from "./ChangeSource";
import OtherImages from "./OtherImages";
import UbuntuCoreImages from "./UbuntuCoreImages";
import UbuntuImages from "./UbuntuImages";

import bootResourceSelectors from "@/app/store/bootresource/selectors";
import type { BootResourceUbuntuSource } from "@/app/store/bootresource/types";
import { BootResourceSourceType } from "@/app/store/bootresource/types";

const getImageSyncText = (sources: BootResourceUbuntuSource[]) => {
  if (sources.length === 1) {
    const mainSource = sources[0];
    if (mainSource.source_type === BootResourceSourceType.MAAS_IO) {
      return "maas.io";
    }
    return mainSource.url;
  }
  return "sources";
};

export enum Labels {
  ChangeSource = "Change source",
  SyncedFrom = "Showing images synced from",
}

type Props = PropsWithSpread<
  {
    formInCard?: boolean;
  },
  Partial<StripProps>
>;

const SyncedImages = ({
  formInCard = true,
  ...stripProps
}: Props): JSX.Element | null => {
  const ubuntu = useSelector(bootResourceSelectors.ubuntu);
  const resources = useSelector(bootResourceSelectors.resources);
  const sources = ubuntu?.sources || [];
  const hasSources = sources.length !== 0;
  const [showChangeSource, setShowChangeSource] = useState(!hasSources);

  if (!ubuntu) {
    return null;
  }

  const canChangeSource = resources.every((resource) => !resource.downloading);
  return (
    <Strip shallow {...stripProps}>
      <Row>
        <Col size={12}>
          {showChangeSource ? (
            <ChangeSource
              closeForm={hasSources ? () => setShowChangeSource(false) : null}
              inCard={formInCard}
            />
          ) : (
            <>
              <div className="u-flex--between">
                <h4 data-testid="image-sync-text">
                  {Labels.SyncedFrom}{" "}
                  <strong>{getImageSyncText(sources)}</strong>
                </h4>
                <Button
                  data-testid="change-source-button"
                  disabled={!canChangeSource}
                  onClick={() => setShowChangeSource(true)}
                >
                  {Labels.ChangeSource}
                  {!canChangeSource && (
                    <Tooltip
                      className="u-nudge-right--small"
                      message="Cannot change source while images are downloading."
                      position="top-right"
                    >
                      <Icon name="information" />
                    </Tooltip>
                  )}
                </Button>
              </div>
              <p>
                Select images to be imported and kept in sync daily. Images will
                be available for deploying to machines managed by MAAS.
              </p>
              <UbuntuImages sources={sources} />
              <UbuntuCoreImages />
              <OtherImages />
            </>
          )}
        </Col>
      </Row>
    </Strip>
  );
};

export default SyncedImages;
