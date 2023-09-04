import { useEffect, useState } from "react";

import { Notification } from "@canonical/react-components";
import { useDispatch, useSelector } from "react-redux";
import type { Dispatch } from "redux";

import TableActions from "@/app/base/components/TableActions";
import TableDeleteConfirm from "@/app/base/components/TableDeleteConfirm";
import { useAddMessage, useWindowTitle } from "@/app/base/hooks";
import urls from "@/app/base/urls";
import SettingsTable from "@/app/settings/components/SettingsTable";
import { actions as sslkeyActions } from "@/app/store/sslkey";
import sslkeySelectors from "@/app/store/sslkey/selectors";
import type { SSLKey, SSLKeyMeta, SSLKeyState } from "@/app/store/sslkey/types";

export enum Label {
  Title = "SSL keys",
  DeleteConfirm = "Confirm or cancel deletion of SSL key",
}

const generateRows = (
  sslkeys: SSLKey[],
  expandedId: SSLKey[SSLKeyMeta.PK] | null,
  setExpandedId: (id: SSLKey[SSLKeyMeta.PK] | null) => void,
  hideExpanded: () => void,
  dispatch: Dispatch,
  saved: SSLKeyState["saved"],
  saving: SSLKeyState["saving"]
) =>
  sslkeys.map(({ id, display, key }) => {
    const expanded = expandedId === id;
    return {
      "aria-label": key,
      className: expanded ? "p-table__row is-active" : null,
      columns: [
        {
          className: "u-truncate",
          content: display,
          role: "rowheader",
        },
        {
          content: (
            <TableActions copyValue={key} onDelete={() => setExpandedId(id)} />
          ),
          className: "u-align--right",
        },
      ],
      "data-testid": "sslkey-row",
      expanded: expanded,
      expandedContent: expanded && (
        <div aria-label={Label.DeleteConfirm}>
          <TableDeleteConfirm
            deleted={saved}
            deleting={saving}
            modelName={display}
            modelType="SSL key"
            onClose={hideExpanded}
            onConfirm={() => {
              dispatch(sslkeyActions.delete(id));
            }}
          />
        </div>
      ),
      key: id,
      sortData: {
        key: display,
      },
    };
  });

const SSLKeyList = (): JSX.Element => {
  const [expandedId, setExpandedId] = useState<SSLKey[SSLKeyMeta.PK] | null>(
    null
  );
  const sslkeyErrors = useSelector(sslkeySelectors.errors);
  const sslkeyLoading = useSelector(sslkeySelectors.loading);
  const sslkeyLoaded = useSelector(sslkeySelectors.loaded);
  const sslkeys = useSelector(sslkeySelectors.all);
  const saved = useSelector(sslkeySelectors.saved);
  const saving = useSelector(sslkeySelectors.saving);
  const dispatch = useDispatch();

  useWindowTitle(Label.Title);

  useAddMessage(saved, sslkeyActions.cleanup, "SSL key removed successfully.");

  const hideExpanded = () => {
    setExpandedId(null);
  };

  useEffect(() => {
    dispatch(sslkeyActions.fetch());
  }, [dispatch]);

  return (
    <>
      {sslkeyErrors && typeof sslkeyErrors === "string" && (
        <Notification severity="negative" title="Error:">
          {sslkeyErrors}
        </Notification>
      )}
      <SettingsTable
        aria-label={Label.Title}
        buttons={[{ label: "Add SSL key", url: urls.preferences.sslKeys.add }]}
        headers={[
          {
            content: "Key",
            sortKey: "key",
          },
          {
            content: "Actions",
            className: "u-align--right",
          },
        ]}
        loaded={sslkeyLoaded}
        loading={sslkeyLoading}
        rows={generateRows(
          sslkeys,
          expandedId,
          setExpandedId,
          hideExpanded,
          dispatch,
          saved,
          saving
        )}
        tableClassName="sslkey-list"
      />
    </>
  );
};

export default SSLKeyList;
