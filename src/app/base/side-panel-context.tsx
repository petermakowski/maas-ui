import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useState } from "react";

import { ControllerSidePanelViews } from "@/app/controllers/constants";
import type { ControllerSidePanelContent } from "@/app/controllers/types";
import {
  type DashboardSidePanelContent,
  DashboardSidePanelViews,
} from "@/app/dashboard/views/constants";
import { DeviceSidePanelViews } from "@/app/devices/constants";
import type { DeviceSidePanelContent } from "@/app/devices/types";
import {
  type DomainDetailsSidePanelContent,
  DomainDetailsSidePanelViews,
} from "@/app/domains/views/DomainDetails/constants";
import {
  type DomainListSidePanelContent,
  DomainListSidePanelViews,
} from "@/app/domains/views/DomainsList/constants";
import { KVMSidePanelViews } from "@/app/kvm/constants";
import type { KVMSidePanelContent } from "@/app/kvm/types";
import { MachineSidePanelViews } from "@/app/machines/constants";
import type { MachineSidePanelContent } from "@/app/machines/types";
import {
  type SubnetSidePanelContent,
  SubnetSidePanelViews,
} from "@/app/subnets/types";
import {
  type FabricDetailsSidePanelContent,
  FabricDetailsSidePanelViews,
} from "@/app/subnets/views/FabricDetails/FabricDetailsHeader/constants";
import {
  type SpaceDetailsSidePanelContent,
  SpaceDetailsSidePanelViews,
} from "@/app/subnets/views/SpaceDetails/constants";
import {
  type SubnetDetailsSidePanelContent,
  SubnetDetailsSidePanelViews,
} from "@/app/subnets/views/SubnetDetails/constants";
import {
  type VLANDetailsSidePanelContent,
  VLANDetailsSidePanelViews,
} from "@/app/subnets/views/VLANDetails/constants";
import { TagSidePanelViews } from "@/app/tags/constants";
import type { TagSidePanelContent } from "@/app/tags/types";
import {
  ZoneActionSidePanelViews,
  type ZoneSidePanelContent,
} from "@/app/zones/constants";

export type SidePanelContent =
  | MachineSidePanelContent
  | ControllerSidePanelContent
  | DeviceSidePanelContent
  | KVMSidePanelContent
  | TagSidePanelContent
  | ZoneSidePanelContent
  | SubnetSidePanelContent
  | DomainDetailsSidePanelContent
  | DomainListSidePanelContent
  | DashboardSidePanelContent
  | VLANDetailsSidePanelContent
  | FabricDetailsSidePanelContent
  | SubnetDetailsSidePanelContent
  | SpaceDetailsSidePanelContent
  | null;

export type SetSidePanelContent<T = SidePanelContent> = (
  sidePanelContent: T | null
) => void;

export type SidePanelSize = "narrow" | "regular" | "large" | "wide";
export type SidePanelContextType<T = SidePanelContent> = {
  sidePanelContent: T | null;
  sidePanelSize: SidePanelSize;
};

export const SidePanelViews = {
  ...ControllerSidePanelViews,
  ...MachineSidePanelViews,
  ...ControllerSidePanelViews,
  ...DeviceSidePanelViews,
  ...KVMSidePanelViews,
  ...TagSidePanelViews,
  ...ZoneActionSidePanelViews,
  ...SubnetSidePanelViews,
  ...DomainDetailsSidePanelViews,
  ...DomainListSidePanelViews,
  ...DashboardSidePanelViews,
  ...VLANDetailsSidePanelViews,
  ...FabricDetailsSidePanelViews,
  ...SubnetDetailsSidePanelViews,
  ...SpaceDetailsSidePanelViews,
} as const;

export type SetSidePanelContextType = {
  setSidePanelContent: SetSidePanelContent;
  setSidePanelSize: (size: SidePanelSize) => void;
};

export type SidePanelContentTypes<T = SidePanelContent> = {
  sidePanelContent: T | null;
  setSidePanelContent: SetSidePanelContent<T>;
};

const SidePanelContext = createContext<SidePanelContextType>({
  sidePanelContent: null,
  sidePanelSize: "regular",
});

const SetSidePanelContext = createContext<SetSidePanelContextType>({
  setSidePanelContent: () => {
    throw new Error("setSidePanelContent function must be overridden");
  },
  setSidePanelSize: () => {
    throw new Error("setSidePanelSize function must be overridden");
  },
});

const useSidePanelContext = (): SidePanelContextType =>
  useContext(SidePanelContext);

const useSetSidePanelContext = (): SetSidePanelContextType =>
  useContext(SetSidePanelContext);

export const useSidePanel = (): SidePanelContextType &
  SetSidePanelContextType => {
  const { sidePanelSize, sidePanelContent } = useSidePanelContext();
  const { setSidePanelContent, setSidePanelSize } = useSetSidePanelContext();
  const setSidePanelContentWithSizeReset = useCallback(
    (content: SidePanelContent | null): void => {
      if (content === null) {
        setSidePanelSize("regular");
      }
      setSidePanelContent(content);
    },
    [setSidePanelContent, setSidePanelSize]
  );

  return {
    sidePanelContent,
    setSidePanelContent: setSidePanelContentWithSizeReset,
    sidePanelSize,
    setSidePanelSize,
  };
};

const SidePanelContextProvider = ({
  children,
  initialSidePanelContent = null,
  initialSidePanelSize = "regular",
}: PropsWithChildren<{
  initialSidePanelContent?: SidePanelContent;
  initialSidePanelSize?: SidePanelSize;
}>): React.ReactElement => {
  const [sidePanelContent, setSidePanelContent] = useState<SidePanelContent>(
    initialSidePanelContent
  );
  const [sidePanelSize, setSidePanelSize] =
    useState<SidePanelSize>(initialSidePanelSize);

  return (
    <SetSidePanelContext.Provider
      value={{
        setSidePanelContent,
        setSidePanelSize,
      }}
    >
      <SidePanelContext.Provider
        value={{
          sidePanelContent,
          sidePanelSize,
        }}
      >
        {children}
      </SidePanelContext.Provider>
    </SetSidePanelContext.Provider>
  );
};

export default SidePanelContextProvider;
