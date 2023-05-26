import MachineListHeader from "./MachineList/MachineListHeader";
import MachinesContainer from "./MachinesContainer";

import MainContentSection from "app/base/components/MainContentSection";
import MachineList from "app/machines/views/MachineList";

const Machines = (): JSX.Element => {
  return (
    <MachinesContainer>
      {({
        grouping,
        hiddenGroups,
        hiddenColumns,
        searchFilter,
        handleSetGrouping,
        setHiddenColumns,
        setHiddenGroups,
        setSearchFilter,
        setSidePanelContent,
        sidePanelContent,
      }) => (
        <MainContentSection
          header={
            <MachineListHeader
              grouping={grouping}
              hiddenColumns={hiddenColumns}
              searchFilter={searchFilter}
              setGrouping={handleSetGrouping}
              setHiddenColumns={setHiddenColumns}
              setHiddenGroups={setHiddenGroups}
              setSearchFilter={setSearchFilter}
              setSidePanelContent={setSidePanelContent}
              sidePanelContent={sidePanelContent}
            />
          }
        >
          <MachineList
            grouping={grouping}
            headerFormOpen={!!sidePanelContent}
            hiddenColumns={hiddenColumns}
            hiddenGroups={hiddenGroups}
            searchFilter={searchFilter}
            setHiddenGroups={setHiddenGroups}
          />
        </MainContentSection>
      )}
    </MachinesContainer>
  );
};

export default Machines;
