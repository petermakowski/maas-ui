import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Button, MainTable, Spinner } from "@canonical/react-components";
import { useDispatch, useSelector } from "react-redux";
import type { Dispatch } from "redux";

import AddStaticRouteForm from "./AddStaticRouteForm";
import EditStaticRouteForm from "./EditStaticRouteForm";

import FormCard from "@/app/base/components/FormCard";
import SubnetLink from "@/app/base/components/SubnetLink";
import TableActions from "@/app/base/components/TableActions";
import TableDeleteConfirm from "@/app/base/components/TableDeleteConfirm";
import TitledSection from "@/app/base/components/TitledSection";
import authSelectors from "@/app/store/auth/selectors";
import { actions as staticRouteActions } from "@/app/store/staticroute";
import staticRouteSelectors from "@/app/store/staticroute/selectors";
import type {
  StaticRoute,
  StaticRouteMeta,
} from "@/app/store/staticroute/types";
import { actions as subnetActions } from "@/app/store/subnet";
import subnetSelectors from "@/app/store/subnet/selectors";
import type { Subnet, SubnetMeta } from "@/app/store/subnet/types";
import { getSubnetDisplay } from "@/app/store/subnet/utils";

export type Props = {
  subnetId: Subnet[SubnetMeta.PK];
};

export enum Labels {
  GatewayIp = "Gateway IP",
  Destination = "Destination",
  Metric = "Metric",
  Actions = "Actions",
}

export enum ExpandedType {
  Create,
  Delete,
  Update,
}

type Expanded = {
  id?: StaticRoute[StaticRouteMeta.PK];
  type: ExpandedType;
};

const toggleExpanded = (
  id: StaticRoute[StaticRouteMeta.PK],
  expanded: Expanded | null,
  expandedType: ExpandedType,
  setExpanded: (expanded: Expanded | null) => void
) =>
  setExpanded(
    expanded?.id === id && expanded.type === expandedType
      ? null
      : {
          id,
          type: expandedType,
        }
  );

const generateRows = (
  dispatch: Dispatch,
  staticRoutes: StaticRoute[],
  subnets: Subnet[],
  expanded: Expanded | null,
  setExpanded: (expanded: Expanded | null) => void,
  saved: boolean,
  saving: boolean
) =>
  staticRoutes.map((staticRoute: StaticRoute) => {
    const subnet = subnets.find(
      (subnet) => subnet.id === staticRoute.destination
    );
    const isExpanded = expanded?.id === staticRoute.id;
    let expandedContent: ReactNode | null = null;
    const onClose = () => setExpanded(null);
    if (expanded?.type === ExpandedType.Delete) {
      expandedContent = (
        <TableDeleteConfirm
          deleted={saved}
          deleting={saving}
          message="Are you sure you want to remove this static route?"
          onClose={onClose}
          onConfirm={() => {
            dispatch(staticRouteActions.delete(staticRoute.id));
          }}
          sidebar={false}
        />
      );
    } else if (expanded?.type === ExpandedType.Update) {
      expandedContent = (
        <EditStaticRouteForm
          handleDismiss={() =>
            toggleExpanded(
              staticRoute.id,
              expanded,
              ExpandedType.Update,
              setExpanded
            )
          }
          staticRouteId={staticRoute.id}
        />
      );
    }
    return {
      className: isExpanded ? "p-table__row is-active" : null,
      columns: [
        {
          "aria-label": Labels.GatewayIp,
          content: staticRoute.gateway_ip,
        },
        {
          "aria-label": Labels.Destination,
          content: <SubnetLink id={staticRoute.destination} />,
        },
        {
          "aria-label": Labels.Metric,
          content: staticRoute.metric,
        },
        {
          "aria-label": Labels.Actions,
          content: (
            <TableActions
              onDelete={() => {
                toggleExpanded(
                  staticRoute.id,
                  expanded,
                  ExpandedType.Delete,
                  setExpanded
                );
              }}
              onEdit={() => {
                toggleExpanded(
                  staticRoute.id,
                  expanded,
                  ExpandedType.Update,
                  setExpanded
                );
              }}
            />
          ),
          className: "u-align--right",
        },
      ],
      expanded: isExpanded,
      expandedContent: expandedContent,
      key: staticRoute.id,
      sortData: {
        destination: getSubnetDisplay(subnet),
        gateway_ip: staticRoute.gateway_ip,
        metric: staticRoute.metric,
      },
    };
  });

const StaticRoutes = ({ subnetId }: Props): JSX.Element | null => {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState<Expanded | null>(null);
  const staticRoutesLoading = useSelector(staticRouteSelectors.loading);
  const saved = useSelector(staticRouteSelectors.saved);
  const saving = useSelector(staticRouteSelectors.saving);
  const staticRoutes = useSelector(staticRouteSelectors.all).filter(
    (staticRoute) => staticRoute.source === subnetId
  );
  const subnets = useSelector(subnetSelectors.all);
  const subnetsLoading = useSelector(subnetSelectors.loading);
  const isAdmin = useSelector(authSelectors.isAdmin);
  const loading = staticRoutesLoading || subnetsLoading;
  const isAddStaticRouteOpen = expanded?.type === ExpandedType.Create;

  useEffect(() => {
    dispatch(staticRouteActions.fetch());
    dispatch(subnetActions.fetch());
  }, [dispatch]);

  return (
    <TitledSection
      buttons={
        isAdmin ? (
          <Button
            disabled={isAddStaticRouteOpen}
            onClick={() => {
              setExpanded({ type: ExpandedType.Create });
            }}
          >
            Add static route
          </Button>
        ) : null
      }
      title="Static routes"
    >
      <MainTable
        className="static-routes-table p-table-expanding--light"
        defaultSort="gateway_ip"
        defaultSortDirection="ascending"
        emptyStateMsg={
          loading ? (
            <Spinner text="Loading..." />
          ) : (
            "No static routes for this subnet."
          )
        }
        expanding
        headers={[
          {
            content: Labels.GatewayIp,
            sortKey: "gateway_ip",
          },
          {
            content: Labels.Destination,
            sortKey: "destination",
          },
          {
            content: Labels.Metric,
            sortKey: "metric",
          },
          {
            content: Labels.Actions,
            className: "u-align--right",
          },
        ]}
        responsive
        rows={generateRows(
          dispatch,
          staticRoutes,
          subnets,
          expanded,
          setExpanded,
          saved,
          saving
        )}
        sortable
      />
      {isAddStaticRouteOpen ? (
        <FormCard sidebar={false}>
          <AddStaticRouteForm
            handleDismiss={() => setExpanded(null)}
            subnetId={subnetId}
          />
        </FormCard>
      ) : null}
    </TitledSection>
  );
};

export default StaticRoutes;
