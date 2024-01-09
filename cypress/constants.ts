export type Page = { heading: string; headingLevel?: number; url: string };
export const pages: Page[] = [
  { heading: "Login", url: "/accounts/login" },
  { heading: "SSH keys for admin", headingLevel: 2, url: "/intro/user" },
  { heading: "Devices", url: "/devices" },
  { heading: "Controllers", url: "/controllers" },
  { heading: "Subnets", url: "/networks" },
  { heading: "Machines", url: "/machines" },
  { heading: "LXD", url: "/kvm/lxd" },
  { heading: "Images", url: "/images" },
  { heading: "DNS", url: "/domains" },
  { heading: "Availability zones", url: "/zones" },
  {
    heading: "Settings",
    headingLevel: 2,
    url: "/settings/configuration/general",
  },
  { heading: "My preferences", headingLevel: 2, url: "/account/prefs/details" },
];
// longer timeout that can be useful for slow commands
export const LONG_TIMEOUT = 30000;
