import React, { useEffect, useState } from 'react';

import { Container, Button, Row, Col, Alert } from 'reactstrap';

import useBackgroundConnection from '../../UseBackgroundConnection';
import IconWithFallBack from '../IconWithFallback';
import MyLoader from '../MyLoader';

const SignMessageNotification = () => {
  const [origin, setOrigin] = useState(null);
  const [favIconUrl, setfavIconUrl] = useState(null);
  const [messageToSign, setMessageToSign] = useState(null);

  const { isLoading, sendBackgroundCommand, state } = useBackgroundConnection();

  useEffect(() => {
    if (state.userData) {
      setOrigin(state.userData.origin);
      setfavIconUrl(state.userData.favIconUrl);
      setMessageToSign(state.userData.message);
    }
  }, [state]);

  const approve = () => {
    async function _sendBackgroundCommand() {
      await sendBackgroundCommand({
        command: 'signMessageUserReply',
        result: true,
      });
    }

    _sendBackgroundCommand();
  };

  const reject = () => {
    async function _sendBackgroundCommand() {
      await sendBackgroundCommand({
        command: 'signMessageUserReply',
        result: false,
      });
    }

    _sendBackgroundCommand();
  };

  if (isLoading) {
    return <MyLoader />;
  }

  if (origin === null) {
    return '';
  }

  return (
    <Container>
      <div className="mt-5 text-center">
        <IconWithFallBack iconUrl={favIconUrl} />
        <Row className="mt-2">
          <Col className="col-lg-12 mx-auto">
            <h6 className="font-weight-light">{origin}</h6>
          </Col>
        </Row>
        <Row>
          <Col className="col-lg-3 mx-auto mt-3">
            <h6>wants to sign the following message:</h6>
          </Col>
        </Row>
        <Row>
          <Col className="col-lg-3 mx-auto mt-3">
            <Alert color="info">{messageToSign}</Alert>
          </Col>
        </Row>
        <Col className="d-grid gap-2 col-lg-3 mx-auto mt-3">
          <Button
            color="primary"
            block={true}
            className="px-4 py-2"
            onClick={() => approve()}
          >
            ACCEPT
          </Button>
          <Button
            color="primary"
            block={true}
            outline={true}
            className="px-4 py-2"
            onClick={() => reject()}
          >
            REJECT
          </Button>
        </Col>
      </div>
    </Container>
  );
};

export default SignMessageNotification;
