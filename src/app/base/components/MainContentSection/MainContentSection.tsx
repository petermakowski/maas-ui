import type { HTMLProps, ReactNode } from "react";

import { Col, Strip } from "@canonical/react-components";
import type { ColSize } from "@canonical/react-components";

import NotificationList from "app/base/components/NotificationList";
import { COL_SIZES } from "app/base/constants";

export type Props = {
  children?: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
} & HTMLProps<HTMLDivElement>;

const MainContentSection = ({
  children,
  header,
  sidebar,
  ...props
}: Props): JSX.Element => {
  const { SIDEBAR, TOTAL } = COL_SIZES;
  return (
    <div {...props} id="main-content-section">
      <div>
        {header ? (
          <header aria-label="main content" className="row">
            <Col size={12}>{header}</Col>
          </header>
        ) : null}
        <Strip element="section" includeCol={false} shallow>
          {sidebar && (
            <Col className="section__sidebar" element="aside" size={SIDEBAR}>
              {sidebar}
            </Col>
          )}
          <Col size={(sidebar ? TOTAL - SIDEBAR : TOTAL) as ColSize}>
            <NotificationList />
            {children}
          </Col>
        </Strip>
      </div>
    </div>
  );
};

export default MainContentSection;
