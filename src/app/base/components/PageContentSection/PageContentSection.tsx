import { ContentSection } from "@canonical/maas-react-components";

import NotificationList from "../NotificationList";

const PageContentSection = ({ ...props }) => <ContentSection {...props} />;
PageContentSection.Title = ContentSection.Title;
PageContentSection.Content = ({ children, ...props }) => (
  <ContentSection.Content {...props}>
    <NotificationList />
    {children}
  </ContentSection.Content>
);

export default PageContentSection;
