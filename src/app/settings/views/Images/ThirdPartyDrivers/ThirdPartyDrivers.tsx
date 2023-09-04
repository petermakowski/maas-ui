import { useEffect } from "react";

import { Col, Spinner, Row } from "@canonical/react-components";
import { useDispatch, useSelector } from "react-redux";

import ThirdPartyDriversForm from "../ThirdPartyDriversForm";

import { useWindowTitle } from "@/app/base/hooks";
import { actions as configActions } from "@/app/store/config";
import configSelectors from "@/app/store/config/selectors";

export enum Labels {
  Loading = "Loading...",
}

const ThirdPartyDrivers = (): JSX.Element => {
  const loaded = useSelector(configSelectors.loaded);
  const loading = useSelector(configSelectors.loading);
  const dispatch = useDispatch();

  useWindowTitle("Ubuntu");

  useEffect(() => {
    if (!loaded) {
      dispatch(configActions.fetch());
    }
  }, [dispatch, loaded]);

  return (
    <Row>
      <Col size={6}>
        {loading && <Spinner text="Loading..." />}
        {loaded && <ThirdPartyDriversForm />}
      </Col>
    </Row>
  );
};

export default ThirdPartyDrivers;
