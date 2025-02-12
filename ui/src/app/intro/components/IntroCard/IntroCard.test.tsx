import { mount } from "enzyme";

import IntroCard from "./IntroCard";

describe("IntroCard", () => {
  it("displays a title link if supplied", () => {
    const wrapper = mount(
      <IntroCard
        titleLink={
          <a href="#help" data-testid="help-link">
            Help!
          </a>
        }
        title="Setup MAAS"
      >
        Card content
      </IntroCard>
    );
    expect(wrapper.find("[data-testid='help-link']").exists()).toBe(true);
  });

  it("can display a green tick icon", () => {
    const wrapper = mount(
      <IntroCard title="Setup MAAS" complete>
        Card content
      </IntroCard>
    );
    expect(wrapper.find("Icon[name='success']").exists()).toBe(true);
  });

  it("can display an error icon", () => {
    const wrapper = mount(
      <IntroCard title="Setup MAAS" hasErrors>
        Card content
      </IntroCard>
    );
    expect(wrapper.find("Icon[name='error']").exists()).toBe(true);
  });

  it("can display a grey tick icon", () => {
    const wrapper = mount(
      <IntroCard complete={false} title="Setup MAAS">
        Card content
      </IntroCard>
    );
    expect(wrapper.find("Icon[name='success-grey']").exists()).toBe(true);
  });
});
