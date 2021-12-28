import React, { useEffect, useState } from 'react';

import { Container, Button, Row, Col, Alert } from 'reactstrap';

import useBackgroundConnection from '../../UseBackgroundConnection';
import IconWithFallBack from '../IconWithFallback';
import MyLoader from '../MyLoader';

function toBSVAmount(satoshis) {
  return parseFloat(satoshis / 1e8)
    .toFixed(8)
    .toString();
}

const SignTransactionNotification = () => {
  const [origin, setOrigin] = useState(null);
  const [favIconUrl, setfavIconUrl] = useState(null);
  const [transactionInfo, setTransactionInfo] = useState(null);

  const { isLoading, sendBackgroundCommand, state } = useBackgroundConnection();

  useEffect(() => {
    if (state.userData) {
      const {
        origin: _origin,
        favIconUrl: _favIconUrl,
        totalInputSats,
        totalOutputSats,
      } = state.userData || {};

      setOrigin(_origin);
      setfavIconUrl(_favIconUrl);

      setTransactionInfo({
        totalInputSats,
        totalOutputSats,
      });
    }
  }, [state]);

  const approve = () => {
    async function _sendBackgroundCommand() {
      await sendBackgroundCommand({
        command: 'signTransactionUserReply',
        result: true,
      });
    }

    _sendBackgroundCommand();
  };

  const reject = () => {
    async function _sendBackgroundCommand() {
      await sendBackgroundCommand({
        command: 'signTransactionUserReply',
        result: false,
      });
    }

    _sendBackgroundCommand();
  };

  if (isLoading) {
    return <MyLoader />;
  }

  if (origin === null || transactionInfo === null) {
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
            <h6>wants to sign a transaction</h6>
          </Col>
        </Row>
        <Row>
          <Col className="col-lg-3 mx-auto mt-3">
            <Alert color="info" className="small text-left">
              <strong>Total input amount:</strong>{' '}
              {toBSVAmount(transactionInfo.totalInputSats)} BSV
              <br />
              <br />
              <strong>Total output amount:</strong>{' '}
              {toBSVAmount(transactionInfo.totalOutputSats)} BSV
            </Alert>
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

export default SignTransactionNotification;
