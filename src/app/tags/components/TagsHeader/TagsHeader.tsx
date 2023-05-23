import { Button } from "@canonical/react-components";

import type { AppContextType, SidePanelContent } from "app/base/app-context";
import MachinesHeader from "app/base/components/node/MachinesHeader";
import { useFetchMachineCount } from "app/store/machine/utils/hooks";
import TagHeaderForms from "app/tags/components/TagsHeader/TagHeaderForms";
import { TagHeaderViews } from "app/tags/constants";
import { TagViewState } from "app/tags/types";

export type Props = AppContextType & {
  tagViewState?: TagViewState | null;
};

export enum Label {
  CreateButton = "Create new tag",
  Header = "Tags header",
}

export const getHeaderTitle = (sidePanelContent: SidePanelContent): string => {
  if (sidePanelContent) {
    const [, name] = sidePanelContent.view;
    switch (name) {
      case TagHeaderViews.AddTag[1]:
        return "Create new tag";
      case TagHeaderViews.DeleteTag[1]:
        return "Delete tag";
    }
  }
  return "Tags";
};

export const TagsHeader = ({
  sidePanelContent,
  setSidePanelContent,
  tagViewState,
}: Props): JSX.Element => {
  const { machineCount } = useFetchMachineCount();
  return (
    <MachinesHeader
      aria-label={Label.Header}
      buttons={
        tagViewState === TagViewState.Updating
          ? null
          : [
              <Button
                appearance="positive"
                onClick={() =>
                  setSidePanelContent({ view: TagHeaderViews.AddTag })
                }
              >
                {Label.CreateButton}
              </Button>,
            ]
      }
      machineCount={machineCount}
      sidePanelContent={
        sidePanelContent && (
          <TagHeaderForms
            setSidePanelContent={setSidePanelContent}
            sidePanelContent={sidePanelContent}
          />
        )
      }
      sidePanelTitle={getHeaderTitle(sidePanelContent)}
      title="Tags"
    />
  );
};

export default TagsHeader;
