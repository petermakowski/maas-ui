import { useEffect, useState } from "react";

import {
  Col,
  MainTable,
  Notification,
  Row,
  Spinner,
} from "@canonical/react-components";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom-v5-compat";
import type { Dispatch } from "redux";

import TableActions from "@/app/base/components/TableActions";
import TableDeleteConfirm from "@/app/base/components/TableDeleteConfirm";
import { useAddMessage, useWindowTitle } from "@/app/base/hooks";
import urls from "@/app/base/urls";
import { FilterMachines } from "@/app/store/machine/utils";
import { actions as resourcePoolActions } from "@/app/store/resourcepool";
import resourcePoolSelectors from "@/app/store/resourcepool/selectors";
import type {
  ResourcePool,
  ResourcePoolState,
} from "@/app/store/resourcepool/types";
import { formatErrors } from "@/app/utils";

export enum Label {
  Title = "Pool list",
}

const getMachinesLabel = (row: ResourcePool) => {
  if (row.machine_total_count === 0) {
    return "Empty pool";
  }
  const filters = FilterMachines.filtersToQueryString({
    pool: [`=${row.name}`],
  });
  return (
    <Link to={`${urls.machines.index}${filters}`}>
      {`${row.machine_ready_count} of ${row.machine_total_count} ready`}
    </Link>
  );
};

const generateRows = (
  rows: ResourcePool[],
  expandedId: ResourcePool["id"] | null,
  setExpandedId: (expandedId: ResourcePool["id"] | null) => void,
  dispatch: Dispatch,
  setDeleting: (deleting: ResourcePool["name"] | null) => void,
  saved: ResourcePoolState["saved"],
  saving: ResourcePoolState["saving"]
) =>
  rows.map((row) => {
    const expanded = expandedId === row.id;
    return {
      "aria-label": row.name,
      className: expanded ? "p-table__row is-active" : null,
      columns: [
        {
          content: row.name,
        },
        {
          content: getMachinesLabel(row),
        },
        {
          content: row.description,
        },
        {
          content: (
            <TableActions
              deleteDisabled={
                !row.permissions.includes("delete") ||
                row.is_default ||
                row.machine_total_count > 0
              }
              deleteTooltip={
                (row.is_default && "The default pool may not be deleted.") ||
                (row.machine_total_count > 0 &&
                  "Cannot delete a pool that contains machines.") ||
                null
              }
              editDisabled={!row.permissions.includes("edit")}
              editPath={urls.pools.edit({ id: row.id })}
              onDelete={() => setExpandedId(row.id)}
            />
          ),
          className: "u-align--right",
        },
      ],
      expanded: expanded,
      expandedContent: expanded && (
        <TableDeleteConfirm
          aria-label="Confirm pool deletion"
          deleted={saved}
          deleting={saving}
          modelName={row.name}
          modelType="resourcepool"
          onClose={() => setExpandedId(null)}
          onConfirm={() => {
            dispatch(resourcePoolActions.delete(row.id));
            setDeleting(row.name);
          }}
          sidebar={false}
        />
      ),
      key: row.name,
      sortData: {
        name: row.name,
        machines: row.machine_total_count,
        description: row.description,
      },
    };
  });

const Pools = (): JSX.Element => {
  useWindowTitle("Pools");
  const dispatch = useDispatch();

  const [expandedId, setExpandedId] = useState<ResourcePool["id"] | null>(null);
  const [deletingPool, setDeleting] = useState<ResourcePool["name"] | null>(
    null
  );

  const poolsLoaded = useSelector(resourcePoolSelectors.loaded);
  const poolsLoading = useSelector(resourcePoolSelectors.loading);
  const saved = useSelector(resourcePoolSelectors.saved);
  const saving = useSelector(resourcePoolSelectors.saving);
  const errors = useSelector(resourcePoolSelectors.errors);
  const errorMessage = formatErrors(errors);

  useAddMessage(
    saved,
    resourcePoolActions.cleanup,
    `${deletingPool} removed successfully.`,
    () => setDeleting(null)
  );

  useEffect(() => {
    dispatch(resourcePoolActions.fetch());
  }, [dispatch]);

  const resourcePools = useSelector(resourcePoolSelectors.all);

  return (
    <div aria-label={Label.Title}>
      {errorMessage ? (
        <Row>
          <Col size={12}>
            <Notification
              onDismiss={() => dispatch(resourcePoolActions.cleanup())}
              severity="negative"
            >
              {errorMessage}
            </Notification>
          </Col>
        </Row>
      ) : null}
      <Row>
        <Col size={12}>
          <div>
            {poolsLoading && (
              <div className="u-align--center">
                <Spinner text="Loading..." />
              </div>
            )}
            {poolsLoaded && (
              <MainTable
                className="p-table-expanding--light"
                defaultSortDirection="ascending"
                expanding={true}
                headers={[
                  {
                    content: "Name",
                    sortKey: "name",
                  },
                  {
                    content: "Machines",
                    sortKey: "machines",
                  },
                  {
                    content: "Description",
                    sortKey: "description",
                  },
                  {
                    content: "Actions",
                    className: "u-align--right",
                  },
                ]}
                paginate={50}
                rows={generateRows(
                  resourcePools,
                  expandedId,
                  setExpandedId,
                  dispatch,
                  setDeleting,
                  saved,
                  saving
                )}
                sortable
              />
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Pools;
