import {
  Button,
  MainTable,
  Spinner,
  Tooltip,
  Link as VanillaLink,
} from "@canonical/react-components";
import type { MainTableProps } from "@canonical/react-components";
import classNames from "classnames";
import { Link } from "react-router-dom-v5-compat";

import SearchBox from "@/app/base/components/SearchBox";

export type TableButtons = {
  disabled?: boolean;
  label: string;
  tooltip?: string | null;
  url: string;
};

export type Props = {
  buttons?: TableButtons[];
  defaultSort?: string;
  headers?: MainTableProps["headers"];
  helpLabel?: string;
  helpLink?: string;
  loaded?: boolean;
  loading?: boolean;
  rows?: MainTableProps["rows"];
  searchOnChange?: (inputValue: string) => void;
  searchPlaceholder?: string;
  searchText?: string;
  tableClassName?: string;
};

export const SettingsTable = ({
  buttons,
  defaultSort,
  headers,
  helpLabel,
  helpLink,
  loaded,
  loading,
  rows,
  searchOnChange,
  searchPlaceholder,
  searchText,
  tableClassName,
  ...tableProps
}: Props): JSX.Element => {
  return (
    <div className="settings-table">
      <div className="p-table-actions">
        {searchOnChange ? (
          <SearchBox
            onChange={searchOnChange}
            placeholder={searchPlaceholder}
            value={searchText}
          />
        ) : (
          <div className="p-table-actions__space-left"></div>
        )}
        {buttons?.map(({ label, url, disabled = false, tooltip }) =>
          tooltip ? (
            <Tooltip key={url} message={tooltip} position="left">
              <Button disabled={disabled} element={Link} to={url}>
                {label}
              </Button>
            </Tooltip>
          ) : (
            <Button disabled={disabled} element={Link} key={url} to={url}>
              {label}
            </Button>
          )
        )}
      </div>
      {loading && (
        <div className="settings-table__loader">
          <Spinner />
        </div>
      )}
      <MainTable
        className={classNames("p-table-expanding--light", tableClassName, {
          "u-no-padding--bottom": loading && !loaded,
        })}
        defaultSort={defaultSort}
        defaultSortDirection="ascending"
        expanding={true}
        headers={headers}
        paginate={20}
        rows={loaded ? rows : undefined}
        sortable
        {...tableProps}
      />
      {loading && !loaded && <div className="settings-table__lines"></div>}
      {helpLink && helpLabel ? (
        <p className="u-no-margin--bottom settings-table__help">
          <VanillaLink
            href={helpLink}
            rel="noopener noreferrer"
            target="_blank"
          >
            {helpLabel}
          </VanillaLink>
        </p>
      ) : null}
    </div>
  );
};

export default SettingsTable;
