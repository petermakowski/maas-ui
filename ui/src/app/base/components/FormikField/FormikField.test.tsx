import { Textarea } from "@canonical/react-components";
import { mount } from "enzyme";
import { Formik } from "formik";

import FormikField from "./FormikField";

describe("FormikField", () => {
  it("can render", () => {
    const wrapper = mount(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <FormikField
          name="username"
          help="Required."
          id="username"
          label="Username"
          required={true}
          type="text"
        />
      </Formik>
    );
    expect(wrapper.find("FormikField")).toMatchSnapshot();
  });

  it("can set a different component", () => {
    const wrapper = mount(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <FormikField component={Textarea} name="username" />
      </Formik>
    );
    expect(wrapper.find("Textarea").exists()).toBe(true);
  });
});
