import type { ReactNode } from "react";

import { MainToolbar } from "@canonical/maas-react-components";
import type { ClassName } from "@canonical/react-components";
import { Spinner, Tabs } from "@canonical/react-components";
import type { TabLink } from "@canonical/react-components/dist/components/Tabs/Tabs";
import classNames from "classnames";
import type { LinkProps } from "react-router-dom";

import type { DataTestElement } from "app/base/types";

export type Props<P = LinkProps> = {
  actionMenuGroup?: JSX.Element | null;
  buttons?: JSX.Element[] | null;
  className?: ClassName;
  renderButtons?: () => ReactNode;
  headerSize?: "wide";
  loading?: boolean;
  subtitle?: ReactNode;
  subtitleClassName?: string;
  subtitleLoading?: boolean;
  tabLinks?: DataTestElement<TabLink<P>>[];
  title?: ReactNode;
  titleClassName?: string;
  titleElement?: keyof JSX.IntrinsicElements;
};

const generateSubtitle = (
  subtitle: Props["subtitle"],
  subtitleClassName: Props["subtitleClassName"],
  subtitleLoading: Props["subtitleLoading"],
  titleLoading: Props["loading"]
) => {
  if (titleLoading || !(subtitle || subtitleLoading)) {
    return null;
  }
  let content = subtitle;
  if (subtitleLoading) {
    content = (
      <Spinner
        className="u-text--muted"
        data-testid="section-header-subtitle-spinner"
        text="Loading..."
      />
    );
  } else if (typeof subtitle === "string") {
    content = <span className="u-text--muted">{subtitle}</span>;
  }
  return (
    <div
      className={classNames(
        "section-header__subtitle u-flex--grow",
        subtitleClassName
      )}
      data-testid="section-header-subtitle"
    >
      {content}
    </div>
  );
};

const SectionHeader = <P,>({
  actionMenuGroup,
  buttons = [],
  renderButtons,
  className,
  headerSize,
  loading,
  subtitle,
  subtitleClassName,
  subtitleLoading,
  tabLinks,
  title,
  titleClassName,
  titleElement: TitleElement = "h1",
  ...props
}: Props<P>): JSX.Element | null => {
  return (
    <div className={classNames("section-header", className)} {...props}>
      <MainToolbar>
        <MainToolbar.Title>
          {loading ? (
            <Spinner aria-hidden="true" text="Loading..." />
          ) : title ? (
            title
          ) : null}
        </MainToolbar.Title>
        <MainToolbar.Controls>
          {buttons?.length ? buttons.map((button, i) => button) : null}
          {renderButtons && typeof renderButtons === "function"
            ? renderButtons()
            : null}
          {actionMenuGroup ? <>{actionMenuGroup}</> : null}
        </MainToolbar.Controls>
      </MainToolbar>
      {tabLinks?.length ? (
        <div className="section-header__tabs" data-testid="section-header-tabs">
          <Tabs links={tabLinks} listClassName="u-no-margin--bottom" />
        </div>
      ) : null}
    </div>
  );
};

export default SectionHeader;
