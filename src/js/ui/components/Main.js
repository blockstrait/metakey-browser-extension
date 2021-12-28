import React, { Fragment } from 'react';

import useBackgroundConnection from '../UseBackgroundConnection';
import Home from './Home';
import MyLoader from './MyLoader';
import NewKeychain from './NewKeychain';

const Main = () => {
  const { isLoading, state } = useBackgroundConnection();

  if (isLoading) {
    return <MyLoader />;
  }

  return (
    <Fragment>{state.isKeychainPresent ? <Home /> : <NewKeychain />}</Fragment>
  );
};

export default Main;
