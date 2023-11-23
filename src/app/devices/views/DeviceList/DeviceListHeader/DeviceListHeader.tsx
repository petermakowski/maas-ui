import { MainToolbar } from "@canonical/maas-react-components";
import { Button } from "@canonical/react-components";
import { useSelector } from "react-redux";

import DeviceListControls from "../DeviceListControls";

import { ModelListTitle } from "app/base/components/ModelListTitle";
import NodeActionMenu from "app/base/components/NodeActionMenu";
import type { SetSearchFilter } from "app/base/types";
import { DeviceSidePanelViews } from "app/devices/constants";
import type { DeviceSetSidePanelContent } from "app/devices/types";
import deviceSelectors from "app/store/device/selectors";

type Props = {
  setSidePanelContent: DeviceSetSidePanelContent;
  setSearchFilter: SetSearchFilter;
  searchFilter: string;
};

const DeviceListHeader = ({
  setSidePanelContent,
  searchFilter,
  setSearchFilter,
}: Props): JSX.Element => {
  const devices = useSelector(deviceSelectors.all);
  const devicesLoaded = useSelector(deviceSelectors.loaded);
  const selectedDevices = useSelector(deviceSelectors.selected);

  return (
    <MainToolbar>
      <MainToolbar.Title>
        <ModelListTitle
          count={devices.length}
          isLoading={!devicesLoaded}
          model="device"
        />
      </MainToolbar.Title>
      <MainToolbar.Controls>
        <DeviceListControls filter={searchFilter} setFilter={setSearchFilter} />
        <Button
          data-testid="add-device-button"
          disabled={selectedDevices.length > 0}
          onClick={() =>
            setSidePanelContent({ view: DeviceSidePanelViews.ADD_DEVICE })
          }
        >
          Add device
        </Button>

        <NodeActionMenu
          filterActions
          hasSelection={selectedDevices.length > 0}
          nodeDisplay="device"
          nodes={selectedDevices}
          onActionClick={(action) => {
            const view = Object.values(DeviceSidePanelViews).find(
              ([, actionName]) => actionName === action
            );
            if (view) {
              setSidePanelContent({ view });
            }
          }}
          showCount
        />
      </MainToolbar.Controls>
    </MainToolbar>
  );
};

export default DeviceListHeader;
