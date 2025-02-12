import type { ReactNode, AriaAttributes, AriaRole } from "react";

export type NavItem = {
  adminOnly?: boolean;
  highlight?: string | string[];
  inHardwareMenu?: boolean;
  isLegacy?: boolean;
  label: string;
  url: string;
};

export type LinkType = {
  label: ReactNode;
  url: string;
};

export type GenerateLinkType = (
  link: LinkType,
  props: LinkProps,
  appendNewBase: boolean
) => ReactNode;

export type LinkProps = {
  className?: string;
  role?: AriaRole;
  "aria-current"?: AriaAttributes["aria-current"];
  "aria-label"?: AriaAttributes["aria-label"];
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export type GenerateNavLink = (link: NavItem, props?: LinkProps) => ReactNode;

export type ToggleVisible = (
  evt: React.MouseEvent,
  preventDefault?: boolean
) => void;
