import type { HTMLProps, ReactNode } from "react";

import ErrorBoundary from "../ErrorBoundary/ErrorBoundary";
import MainContentSection from "../MainContentSection";

import type { AppSidePanelProps } from "app/base/components/AppSidePanel";

export type Props = {
  children?: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  secondaryNav?: ReactNode;
  sidePanelContent: AppSidePanelProps["content"];
  sidePanelSize?: AppSidePanelProps["size"];
  sidePanelTitle: AppSidePanelProps["title"];
} & HTMLProps<HTMLDivElement>;

const PageContent = ({
  children,
  header,
  sidebar,
  sidePanelContent,
  sidePanelTitle,
  secondaryNav,
  ...props
}: Props): JSX.Element => {
  return (
    <>
      <main className="l-main">
        {secondaryNav}
        <div className="l-main__content" id="main-content">
          <MainContentSection header={header} {...props}>
            <ErrorBoundary>{children}</ErrorBoundary>
          </MainContentSection>
        </div>
      </main>
    </>
  );
};

export default PageContent;
