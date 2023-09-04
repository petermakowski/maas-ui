import { useState } from "react";

import { MainTable, ContextualMenu } from "@canonical/react-components";
import classNames from "classnames";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom-v5-compat";

import TableConfirm from "@/app/base/components/TableConfirm";
import urls from "@/app/base/urls";
import { actions as domainActions } from "@/app/store/domain";
import domainSelectors from "@/app/store/domain/selectors";
import type { Domain, DomainMeta } from "@/app/store/domain/types";

export enum Labels {
  Domain = "Domain",
  Authoritative = "Authoritative",
  Hosts = "Hosts",
  TotalRecords = "Total records",
  Actions = "Actions",
  AreYouSure = "Setting this domain as the default will update all existing machines (in Ready state) with the new default domain. Are you sure?",
  SetDefault = "Set default...",
  ConfirmSetDefault = "Set default",
  TableAction = "Table action",
  ContextualMenu = "Actions",
  TableLable = "Domains table",
}

const DomainsTable = (): JSX.Element => {
  const dispatch = useDispatch();
  const domains = useSelector(domainSelectors.all);
  const errors = useSelector(domainSelectors.errors);
  const saving = useSelector(domainSelectors.saving);
  const saved = useSelector(domainSelectors.saved);
  const [expandedID, setExpandedID] = useState<Domain[DomainMeta.PK] | null>();
  const headers = [
    {
      content: "Domain",
      sortKey: "name",
      "data-testid": "domain-name-header",
    },
    {
      content: "Authoritative",
      sortKey: "authoritative",
    },
    {
      content: "Hosts",
      sortKey: "hosts",
      className: "u-align--right",
    },
    {
      content: "Total records",
      sortKey: "records",
      className: "u-align--right",
    },
    {
      content: "Actions",
      className: "u-align--right",
    },
  ];

  const rows = domains.map((domain) => {
    const isActive = expandedID === domain.id;
    return {
      // making sure we don't pass id directly as a key because of
      // https://github.com/canonical/react-components/issues/476
      key: `domain-row-${domain.id}`,
      "aria-label": domain.name,
      className: classNames("p-table__row", { "is-active": isActive }),
      columns: [
        {
          content: (
            <Link to={urls.domains.details({ id: domain.id })}>
              {domain.is_default ? `${domain.name} (default)` : domain.name}
            </Link>
          ),
          "data-testid": "domain-name",
        },
        {
          content: domain.authoritative ? "Yes" : "No",
        },
        {
          content: domain.hosts,
          className: "u-align--right",
        },
        {
          content: domain.resource_count,
          className: "u-align--right",
        },
        {
          content: (
            <div aria-label={Labels.Actions}>
              <ContextualMenu
                hasToggleIcon={true}
                links={[
                  {
                    children: Labels.SetDefault,
                    onClick: () => {
                      dispatch(domainActions.cleanup());
                      setExpandedID(domain.id);
                    },
                  },
                ]}
                toggleAppearance="base"
                toggleClassName="u-no-margin--bottom is-small is-dense"
                toggleDisabled={domain.is_default}
              />
            </div>
          ),
          className: "u-align--right",
        },
      ],
      expanded: isActive,
      expandedContent: (
        <div aria-label={Labels.TableAction}>
          <TableConfirm
            confirmAppearance="positive"
            confirmLabel={Labels.ConfirmSetDefault}
            errorKey="domain"
            errors={errors}
            finished={saved}
            inProgress={saving}
            message={<>{Labels.AreYouSure}</>}
            onClose={() => {
              dispatch(domainActions.cleanup());
              setExpandedID(null);
            }}
            onConfirm={() => {
              dispatch(domainActions.setDefault(domain.id));
            }}
            sidebar={false}
          />
        </div>
      ),
      sortData: {
        name: domain.name,
        authoritative: domain.authoritative,
        hosts: domain.hosts,
        records: domain.resource_count,
      },
    };
  });

  return (
    <MainTable
      aria-label={Labels.TableLable}
      className="p-table-expanding--light"
      data-testid="domains-table"
      defaultSort="name"
      defaultSortDirection="ascending"
      expanding={true}
      headers={headers}
      paginate={50}
      rows={rows}
      sortable
    />
  );
};

export default DomainsTable;
