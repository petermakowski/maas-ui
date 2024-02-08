import { Redirect, useLocation } from "react-router-dom";
import { Route, Routes as ReactRouterRoutes } from "react-router-dom-v5-compat";

import PageContent from "@/app/base/components/PageContent";
import urls from "@/app/base/urls";
import NotFound from "@/app/base/views/NotFound";
import Commissioning from "@/app/settings/views/Configuration/Commissioning";
import Deploy from "@/app/settings/views/Configuration/Deploy";
import General from "@/app/settings/views/Configuration/General";
import KernelParameters from "@/app/settings/views/Configuration/KernelParameters";
import DhcpAdd from "@/app/settings/views/Dhcp/DhcpAdd";
import DhcpEdit from "@/app/settings/views/Dhcp/DhcpEdit";
import DhcpList from "@/app/settings/views/Dhcp/DhcpList";
import ThirdPartyDrivers from "@/app/settings/views/Images/ThirdPartyDrivers";
import VMWare from "@/app/settings/views/Images/VMWare";
import Windows from "@/app/settings/views/Images/Windows";
import LicenseKeyAdd from "@/app/settings/views/LicenseKeys/LicenseKeyAdd";
import LicenseKeyEdit from "@/app/settings/views/LicenseKeys/LicenseKeyEdit";
import LicenseKeyList from "@/app/settings/views/LicenseKeys/LicenseKeyList";
import DnsForm from "@/app/settings/views/Network/DnsForm";
import NetworkDiscoveryForm from "@/app/settings/views/Network/NetworkDiscoveryForm";
import NtpForm from "@/app/settings/views/Network/NtpForm";
import ProxyForm from "@/app/settings/views/Network/ProxyForm";
import SyslogForm from "@/app/settings/views/Network/SyslogForm";
import RepositoriesList from "@/app/settings/views/Repositories/RepositoriesList";
import RepositoryAdd from "@/app/settings/views/Repositories/RepositoryAdd";
import RepositoryEdit from "@/app/settings/views/Repositories/RepositoryEdit";
import ScriptsList from "@/app/settings/views/Scripts/ScriptsList";
import ScriptsUpload from "@/app/settings/views/Scripts/ScriptsUpload";
import IpmiSettings from "@/app/settings/views/Security/IpmiSettings";
import SecretStorage from "@/app/settings/views/Security/SecretStorage";
import SecurityProtocols from "@/app/settings/views/Security/SecurityProtocols";
import SessionTimeout from "@/app/settings/views/Security/SessionTimeout";
import StorageForm from "@/app/settings/views/Storage/StorageForm";
import UserAdd from "@/app/settings/views/Users/UserAdd";
import UserDelete from "@/app/settings/views/Users/UserDelete";
import UserEdit from "@/app/settings/views/Users/UserEdit";
import UsersList from "@/app/settings/views/Users/UsersList";
import { getRelativeRoute } from "@/app/utils";

const base = urls.settings.index;

const useSettingsSidePanel = () => {
  const location = useLocation();
  switch (location.pathname) {
    case urls.settings.users.add:
      return { content: <UserAdd />, title: "Add User" };
    case urls.settings.users.edit(null):
      return { content: <UserEdit />, title: "Edit User" };
    case urls.settings.users.delete(null):
      return { content: <UserDelete />, title: "Delete User" };
    case urls.settings.licenseKeys.add:
      return { content: <LicenseKeyAdd />, title: "Add License Key" };
    case urls.settings.licenseKeys.edit(null):
      return { content: <LicenseKeyEdit />, title: "Edit License Key" };
    case urls.settings.scripts.commissioning.upload:
      return {
        content: <ScriptsUpload type="commissioning" />,
        title: "Upload Commissioning Script",
      };
    case urls.settings.scripts.testing.upload:
      return {
        content: <ScriptsUpload type="testing" />,
        title: "Upload Testing Script",
      };
    case urls.settings.dhcp.edit(null):
      return { content: <DhcpEdit />, title: "Edit DHCP" };
    case urls.settings.repositories.add(null):
      return { content: <RepositoryAdd />, title: "Add Repository" };
    default:
      return { content: null, title: "" };
  }
};

const SettingsPageContent = ({
  children,
}: {
  children: React.ReactNode;
  title: string;
}): JSX.Element => {
  const { content, title } = useSettingsSidePanel();
  return (
    <PageContent sidePanelContent={content} sidePanelTitle={title}>
      {children}
    </PageContent>
  );
};

const Routes = (): JSX.Element => {
  return (
    <>
      <ReactRouterRoutes>
        <Route
          element={
            <SettingsPageContent>
              <General />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.configuration.general, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <Commissioning />
            </SettingsPageContent>
          }
          path={getRelativeRoute(
            urls.settings.configuration.commissioning,
            base
          )}
        />
        <Route
          element={
            <SettingsPageContent>
              <KernelParameters />
            </SettingsPageContent>
          }
          path={getRelativeRoute(
            urls.settings.configuration.kernelParameters,
            base
          )}
        />
        <Route
          element={
            <SettingsPageContent>
              <Deploy />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.configuration.deploy, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <Redirect to={urls.settings.configuration.index} />
            </SettingsPageContent>
          }
          path="/"
        />
        <Route
          element={
            <SettingsPageContent>
              <Redirect to={urls.settings.configuration.general} />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.configuration.index, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <SecurityProtocols />
            </SettingsPageContent>
          }
          path={getRelativeRoute(
            urls.settings.security.securityProtocols,
            base
          )}
        />
        <Route
          element={
            <SettingsPageContent>
              <SecretStorage />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.security.secretStorage, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <SessionTimeout />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.security.sessionTimeout, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <IpmiSettings />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.security.ipmiSettings, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <Redirect to={urls.settings.security.securityProtocols} />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.security.index, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <UsersList />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.users.index, base) + "/*"}
        />
        <Route
          element={
            <SettingsPageContent>
              <UserEdit />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.users.edit(null), base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <LicenseKeyList />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.licenseKeys.index, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <LicenseKeyAdd />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.licenseKeys.add, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <LicenseKeyEdit />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.licenseKeys.edit(null), base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <StorageForm />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.storage, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <ProxyForm />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.network.proxy, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <DnsForm />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.network.dns, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <NtpForm />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.network.ntp, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <SyslogForm />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.network.syslog, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <NetworkDiscoveryForm />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.network.networkDiscovery, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <Redirect to={urls.settings.network.proxy} />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.network.index, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <ScriptsList type="commissioning" />
            </SettingsPageContent>
          }
          path={getRelativeRoute(
            urls.settings.scripts.commissioning.index,
            base
          )}
        />
        <Route
          element={
            <SettingsPageContent>
              <ScriptsUpload type="commissioning" />
            </SettingsPageContent>
          }
          path={getRelativeRoute(
            urls.settings.scripts.commissioning.upload,
            base
          )}
        />
        <Route
          element={
            <SettingsPageContent>
              <ScriptsList type="testing" />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.scripts.testing.index, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <ScriptsUpload type="testing" />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.scripts.testing.upload, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <DhcpList />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.dhcp.index, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <DhcpAdd />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.dhcp.add, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <DhcpEdit />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.dhcp.edit(null), base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <RepositoriesList />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.repositories.index, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <RepositoryAdd />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.repositories.add(null), base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <RepositoryEdit />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.repositories.edit(null), base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <Windows />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.images.windows, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <VMWare />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.images.vmware, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <ThirdPartyDrivers />
            </SettingsPageContent>
          }
          path={getRelativeRoute(urls.settings.images.ubuntu, base)}
        />
        <Route
          element={
            <SettingsPageContent>
              <NotFound />
            </SettingsPageContent>
          }
          path="*"
        />
      </ReactRouterRoutes>
    </>
  );
};
export default Routes;
