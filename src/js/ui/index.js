import React from 'react';

import { render } from 'react-dom';

import { Route, HashRouter, Switch } from 'react-router-dom';

import BackgroundConnectionProvider from './BackgroundConnectionProvider';
import Main from './components/Main';
import NavBar from './components/NavBar';
import EnterPasswordNotification from './components/notifications/EnterPasswordNotification';
import GetXpubNotification from './components/notifications/GetXpubNotification';
import NewSessionNotification from './components/notifications/NewSessionNotification';
import SignMessageNotification from './components/notifications/SignMessageNotification';
import SignTransactionNotification from './components/notifications/SignTransactionNotification';

import RedirectFromBackground from './RedirectFromBackground';

import '../../scss/main.scss';

const Routes = () => {
  return (
    <Switch>
      <Route path={'/'} component={Main} exact />
      <Route path={'/newSession'} component={NewSessionNotification} />
      <Route path={'/signMessage'} component={SignMessageNotification} />
      <Route
        path={'/signTransaction'}
        component={SignTransactionNotification}
      />
      <Route path={'/enterPassword'} component={EnterPasswordNotification} />
      <Route path={'/getXpub'} component={GetXpubNotification} />
    </Switch>
  );
};

const Index = () => {
  return (
    <BackgroundConnectionProvider>
      <HashRouter hashType="noslash">
        <RedirectFromBackground>
          <NavBar />
          <div className="mx-4 my-4">
            <Routes />
          </div>
        </RedirectFromBackground>
      </HashRouter>
    </BackgroundConnectionProvider>
  );
};

render(<Index />, document.getElementById('content'));
