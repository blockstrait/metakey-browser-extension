import React, { useEffect, Fragment } from 'react';

import { withRouter } from 'react-router-dom';

import MyLoader from './components/MyLoader';

import useBackgroundConnection from './UseBackgroundConnection';

const RedirectFromBackground = ({ history, children }) => {
  const { isLoading, state } = useBackgroundConnection();

  if (isLoading) {
    return <MyLoader />;
  }

  useEffect(() => {
    if (!isLoading) {
      history.push(state.route);
    }
  }, [isLoading, state]);

  return <Fragment>{children}</Fragment>;
};

export default withRouter(RedirectFromBackground);
