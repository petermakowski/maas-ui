import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import type { ControllerSidePanelContent } from "app/controllers/types";
import type { DashboardSidePanelContent } from "app/dashboard/views/constants";
import type { DeviceSidePanelContent } from "app/devices/types";
import type { DomainListSidePanelContent } from "app/domains/views/DomainsList/constants";
import type { KVMSidePanelContent } from "app/kvm/types";
import type { MachineSidePanelContent } from "app/machines/types";
import type { SubnetSidePanelContent } from "app/subnets/types";
import type { TagSidePanelContent } from "app/tags/types";
import type { ZoneSidePanelContent } from "app/zones/constants";

export type SidePanelContent =
  | MachineSidePanelContent
  | ControllerSidePanelContent
  | DeviceSidePanelContent
  | KVMSidePanelContent
  | TagSidePanelContent
  | ZoneSidePanelContent
  | SubnetSidePanelContent
  | DomainListSidePanelContent
  | DashboardSidePanelContent
  | null;

export type SetSidePanelContent = (sidePanelContent: SidePanelContent) => void;

export type AppContextType = {
  sidePanelContent: SidePanelContent;
  setSidePanelContent: SetSidePanelContent;
};

const AppContext = createContext<AppContextType>({
  sidePanelContent: null,
  setSidePanelContent: () => {},
});

export const useAppContext = (): AppContextType => useContext(AppContext);

export const useSidePanel = (): AppContextType => {
  const appContext = useContext(AppContext);
  // close side panel on unmount
  useEffect(() => {
    return () => {
      appContext.setSidePanelContent(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return appContext;
};

const AppContextProvider = ({
  children,
  value = null,
}: PropsWithChildren<{ value?: SidePanelContent }>): React.ReactElement => {
  const [sidePanelContent, setSidePanelContent] =
    useState<SidePanelContent>(value);

  return (
    <AppContext.Provider
      value={{
        sidePanelContent,
        setSidePanelContent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
