import React, { useEffect, useCallback } from "react";

import { ContextualMenu } from "@canonical/react-components";
import { useHistory } from "react-router";

import SubnetsTable from "./SubnetsTable";
import type { GroupByKey } from "./SubnetsTable/types";

import Section from "app/base/components/Section";
import SectionHeader from "app/base/components/SectionHeader";
import { useWindowTitle } from "app/base/hooks";
import { useQuery } from "app/base/hooks/urls";
import { SubnetForms, SubnetsUrlParams } from "app/subnets/enum";
import type { SubnetForm } from "app/subnets/types";
import FormActions from "app/subnets/views/FormActions";

const SubnetsList = (): JSX.Element => {
  useWindowTitle("Subnets");
  const [activeForm, setActiveForm] = React.useState<SubnetForm | null>(null);
  const query = useQuery();
  const history = useHistory();
  const groupBy = query.get(SubnetsUrlParams.By);
  const searchText = query.get(SubnetsUrlParams.Q) || "";
  const setGroupBy = useCallback(
    (group: GroupByKey) =>
      history.replace({
        pathname: "/networks",
        search: `?${SubnetsUrlParams.By}=${group}&${SubnetsUrlParams.Q}=${searchText}`,
      }),
    [history, searchText]
  );
  const setSearchText = useCallback(
    (searchText) =>
      history.replace({
        pathname: "/networks",
        search: `?${SubnetsUrlParams.By}=${groupBy}&${SubnetsUrlParams.Q}=${searchText}`,
      }),
    [history, groupBy]
  );

  const hasValidGroupBy = groupBy && ["fabric", "space"].includes(groupBy);

  useEffect(() => {
    if (!hasValidGroupBy) {
      setGroupBy("fabric");
    }
  }, [groupBy, setGroupBy, hasValidGroupBy]);

  return (
    <Section
      header={
        <>
          <SectionHeader
            title={activeForm ? `Add ${activeForm}` : "Subnets"}
            buttons={[
              <ContextualMenu
                toggleLabel="Add"
                toggleAppearance="positive"
                hasToggleIcon
                position="right"
                links={[
                  SubnetForms.Fabric,
                  SubnetForms.VLAN,
                  SubnetForms.Space,
                  SubnetForms.Subnet,
                ].map((children) => ({
                  children,
                  onClick: () => setActiveForm(children),
                }))}
              />,
            ]}
            headerContent={
              activeForm ? (
                <FormActions
                  activeForm={activeForm}
                  setActiveForm={setActiveForm}
                />
              ) : null
            }
          />
        </>
      }
    >
      {hasValidGroupBy ? (
        <SubnetsTable
          groupBy={groupBy as GroupByKey}
          setGroupBy={setGroupBy}
          searchText={searchText}
          setSearchText={setSearchText}
        />
      ) : null}
    </Section>
  );
};

export default SubnetsList;
