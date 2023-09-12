import { Formik } from "formik";

import { MaasIntroSchema } from "../MaasIntro";

import ConnectivityCard, {
  Labels as ConnectivityCardLabels,
} from "./ConnectivityCard";

import { render, screen, userEvent } from "testing/utils";

const renderTestCase = () =>
  render(
    <Formik
      initialValues={{
        httpProxy: "http://www.website.com",
        mainArchiveUrl: "http://www.mainarchive.com",
        portsArchiveUrl: "http://www.portsarchive.com",
        upstreamDns: "8.8.8.8",
      }}
      onSubmit={jest.fn()}
      validationSchema={MaasIntroSchema}
    >
      <ConnectivityCard />
    </Formik>
  );

describe("ConnectivityCard", () => {
  it("displays a tick when there are no errors", () => {
    renderTestCase();
    const icon = screen.getByLabelText("success");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("p-icon--success");
  });

  it("displays an error icon when there are errors", async () => {
    renderTestCase();
    await userEvent.clear(
      screen.getByRole("textbox", {
        name: ConnectivityCardLabels.MainArchiveUrl,
      })
    );
    await userEvent.tab();
    const icon = screen.getByLabelText("error");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("p-icon--error");
  });

  it("displays HTTP proxy field", () => {
    renderTestCase();
    expect(
      screen.getByLabelText("APT & HTTP/HTTPS proxy server")
    ).toBeInTheDocument();
  });
});
