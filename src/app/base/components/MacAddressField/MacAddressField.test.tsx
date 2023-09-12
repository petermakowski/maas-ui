import { Formik } from "formik";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";

import MacAddressField from "./MacAddressField";

import { rootState as rootStateFactory } from "testing/factories";
import { render, screen, userEvent } from "testing/utils";

const mockStore = configureStore();

describe("MacAddressField", () => {
  it("formats text as it is typed", async () => {
    const store = mockStore(rootStateFactory());
    render(
      <Provider store={store}>
        <Formik initialValues={{ mac_address: "" }} onSubmit={jest.fn()}>
          <MacAddressField label="MAC address" name="mac_address" />
        </Formik>
      </Provider>
    );
    const textbox = screen.getByRole("textbox", { name: "MAC address" });

    await userEvent.type(textbox, "1a2");

    expect(textbox).toHaveValue("1a:2");
  });
});
