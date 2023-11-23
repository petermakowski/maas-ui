import { SearchBox } from "@canonical/react-components";
import type { Meta } from "@storybook/react";

import SectionHeader from "./SectionHeader";

export default {
  title: "Components/SectionHeader",
  component: SectionHeader,
} as Meta;

export const Default = {
  args: {
    title: "Section Title",
    subtitle: "Section Subtitle",
  },
};

export const WithButtons = {
  args: {
    title: "Section Title",
    buttons: [
      <button key="1">Button 1</button>,
      <button key="2">Button 2</button>,
    ],
    children: <SearchBox />,
  },
};

export const Loading = {
  args: {
    title: "Section Title",
    loading: true,
  },
};
