import React, { Fragment } from 'react';

import { CardBody, Card, Row, Col } from 'reactstrap';
import useBackgroundConnection from '../UseBackgroundConnection';
import IconWithFallBack from './IconWithFallback';
import MyLoader from './MyLoader';
import UnlockKeyring from './UnlockKeyring';

const Home = () => {
  const { isLoading, state } = useBackgroundConnection();

  if (isLoading) {
    return <MyLoader />;
  }

  return (
    <Fragment>
      {false && <UnlockKeyring />}
      {true && (
        <Fragment>
          {Object.keys(state.activeSessions).length > 0 ? (
            <h6>Connected websites:</h6>
          ) : (
            <h6>No websites connected</h6>
          )}
          <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 mt-2">
            {Object.keys(state.activeSessions).map(origin => (
              <Col key={origin}>
                <Card>
                  <CardBody className="text-center">
                    <IconWithFallBack
                      iconUrl={state.activeSessions[origin].favIconUrl}
                    />
                    <div className="mt-2">{origin}</div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        </Fragment>
      )}
    </Fragment>
  );
};

export default Home;
