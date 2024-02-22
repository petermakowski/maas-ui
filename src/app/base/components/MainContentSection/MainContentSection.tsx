import type { HTMLProps, ReactNode } from "react";

import { Col, Row } from "@canonical/react-components";
import type { ColSize } from "@canonical/react-components";

import NotificationList from "@/app/base/components/NotificationList";
import { COL_SIZES } from "@/app/base/constants";

export type Props = {
  children?: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  isNotificationListHidden?: boolean;
} & HTMLProps<HTMLDivElement>;

export const MAIN_CONTENT_SECTION_ID = "main-content-section";

const MainContentSection = ({
  children,
  header,
  sidebar,
  isNotificationListHidden = false,
  ...props
}: Props): JSX.Element => {
  const { SIDEBAR, TOTAL } = COL_SIZES;
  return (
    <div {...props} id={MAIN_CONTENT_SECTION_ID}>
      <div>
        {header ? (
          <header aria-label="main content" className="row">
            <Col size={12}>{header}</Col>
          </header>
        ) : null}
        <Row>
          {sidebar && (
            <Col className="section__sidebar" element="aside" size={SIDEBAR}>
              {sidebar}
            </Col>
          )}
          <Col size={(sidebar ? TOTAL - SIDEBAR : TOTAL) as ColSize}>
            <NotificationList />
            {children}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default MainContentSection;
