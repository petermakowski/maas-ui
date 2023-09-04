import { Formik } from "formik";

import HashPolicySelect from "./HashPolicySelect";

import { BondXmitHashPolicy } from "@/app/store/general/types";
import type { RootState } from "@/app/store/root/types";
import {
  generalState as generalStateFactory,
  bondOptions as bondOptionsFactory,
  bondOptionsState as bondOptionsStateFactory,
  rootState as rootStateFactory,
} from "testing/factories";
import { screen, within, renderWithMockStore } from "testing/utils";

describe("HashPolicySelect", () => {
  let state: RootState;
  beforeEach(() => {
    state = rootStateFactory({
      general: generalStateFactory({
        bondOptions: bondOptionsStateFactory({
          data: bondOptionsFactory({
            xmit_hash_policies: [
              [BondXmitHashPolicy.LAYER2, BondXmitHashPolicy.LAYER2],
              [BondXmitHashPolicy.LAYER2_3, BondXmitHashPolicy.LAYER2_3],
              [BondXmitHashPolicy.LAYER3_4, BondXmitHashPolicy.LAYER3_4],
              [BondXmitHashPolicy.ENCAP2_3, BondXmitHashPolicy.ENCAP2_3],
              [BondXmitHashPolicy.ENCAP3_4, BondXmitHashPolicy.ENCAP3_4],
            ],
          }),
          loaded: true,
        }),
      }),
    });
  });

  it("shows a spinner if the bond options haven't loaded", () => {
    state.general.bondOptions.loaded = false;
    renderWithMockStore(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <HashPolicySelect name="xmitHashPolicy" />
      </Formik>,
      { state }
    );
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("displays the options", () => {
    renderWithMockStore(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <HashPolicySelect name="xmitHashPolicy" />
      </Formik>,
      { state }
    );
    const hashPolicySelect = screen.getByRole("combobox", {
      name: "Hash policy",
    });
    const hashPolicyOptions = within(hashPolicySelect).getAllByRole("option");
    const expectedOptions = [
      { label: "Select XMIT hash policy", value: "" },
      {
        label: BondXmitHashPolicy.LAYER2,
        value: BondXmitHashPolicy.LAYER2,
      },
      {
        label: BondXmitHashPolicy.LAYER2_3,
        value: BondXmitHashPolicy.LAYER2_3,
      },
      {
        label: BondXmitHashPolicy.LAYER3_4,
        value: BondXmitHashPolicy.LAYER3_4,
      },
      {
        label: BondXmitHashPolicy.ENCAP2_3,
        value: BondXmitHashPolicy.ENCAP2_3,
      },
      {
        label: BondXmitHashPolicy.ENCAP3_4,
        value: BondXmitHashPolicy.ENCAP3_4,
      },
    ];

    for (var i = 0; i < expectedOptions.length; i++) {
      expect(hashPolicyOptions[i]).toHaveValue(expectedOptions[i].value);
      expect(hashPolicyOptions[i]).toHaveTextContent(expectedOptions[i].label);
    }
  });

  it("can display a default option", () => {
    const defaultOption = {
      label: "Default",
      value: "99",
    };
    renderWithMockStore(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <HashPolicySelect defaultOption={defaultOption} name="xmitHashPolicy" />
      </Formik>,
      { state }
    );
    const hashPolicySelect = screen.getByRole("combobox", {
      name: "Hash policy",
    });
    const hashPolicyOptions = within(hashPolicySelect).getAllByRole("option");

    expect(hashPolicyOptions[0]).toHaveValue(defaultOption.value);
    expect(hashPolicyOptions[0]).toHaveTextContent(defaultOption.label);
  });

  it("can hide the default option", () => {
    state.general.bondOptions = bondOptionsStateFactory({
      data: undefined,
      loaded: true,
    });
    renderWithMockStore(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <HashPolicySelect defaultOption={null} name="xmitHashPolicy" />
      </Formik>,
      { state }
    );
    const hashPolicySelect = screen.getByRole("combobox", {
      name: "Hash policy",
    });
    const hashPolicyOptions = within(hashPolicySelect).queryAllByRole("option");

    expect(hashPolicyOptions).toHaveLength(0);
  });
});
