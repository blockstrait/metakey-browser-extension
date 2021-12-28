import { Wamp } from '@blockstrait/metakey-core';

import ContentScriptConnection from './contentscript-connection';

import { MetakeyError, UnexpectedError } from './errors';

function randomid() {
  return Math.floor(Math.random() * Math.pow(2, 53));
}

class WampSession {
  constructor(params) {
    let {
      state,
      id,
      contentScriptConnection,
      onWampSessionEstablished,
      onWampSessionClosed,
    } = params;

    if (state === undefined) {
      state = 'closed';
    }

    if (id === undefined) {
      id = state === 'established' ? randomid() : null;
    }

    if (id !== null && typeof id !== 'number') {
      throw new TypeError('`id` must be a number');
    }

    if (!(contentScriptConnection instanceof ContentScriptConnection)) {
      throw new TypeError(
        '`contentScriptConnection` must be an instance of ContentScriptConnection'
      );
    }

    const validStates = [
      'closed',
      'establishing',
      'established',
      'shutting-down',
      'closing',
    ];

    if (!validStates.includes(state)) {
      throw new TypeError('`state` must be a valid state');
    }

    if (typeof onWampSessionEstablished !== 'function') {
      throw new TypeError('`onWampSessionEstablished` must be a function');
    }

    if (typeof onWampSessionClosed !== 'function') {
      throw new TypeError('`onWampSessionClosed` must be a function');
    }

    this.state = state;
    this.id = id;
    this.contentScriptConnection = contentScriptConnection;
    this.onWampSessionEstablished = onWampSessionEstablished;
    this.onWampSessionClosed = onWampSessionClosed;
  }

  establishing() {
    const isClosed = this.state === 'closed';

    if (!isClosed) {
      throw new Error('Session not in closed state');
    }

    this.state = 'establishing';
  }

  established() {
    const isEstablishing = this.state === 'establishing';

    if (!isEstablishing) {
      throw new Error('Session not in establishing state');
    }

    this.id = randomid();
    this.state = 'established';

    const welcomeMessage = new Wamp.WelcomeMessage({
      session: randomid(),
      roles: ['dealer'],
    });

    this.contentScriptConnection.sendWampMessage(welcomeMessage);

    this.onWampSessionEstablished(this);
  }

  callError(requestId, procedureName, error) {
    let _error = error;

    if (!(error instanceof MetakeyError)) {
      _error = new UnexpectedError(error.message);
    }

    const callErrorMessage = new Wamp.CallErrorMessage({
      requestId,
      details: {},
      errorUri: `metakey.error.${procedureName}`,
      args: [_error.externalMessage],
    });

    this.contentScriptConnection.sendWampMessage(callErrorMessage);
  }

  sendCallResult(requestId, args, kwArgs) {
    const resultMessage = new Wamp.ResultMessage({
      requestId,
      args,
      kwArgs,
    });

    this.contentScriptConnection.sendWampMessage(resultMessage);
  }

  abort(abortMessage) {
    const isEstablishing = this.state === 'establishing';
    const isEstablished = this.state === 'established';
    const isClosed = this.state === 'closed';

    const isInCorrectState = isEstablishing || isEstablished || isClosed;

    if (!isInCorrectState) {
      throw new Error('Session not in establishing or established state');
    }

    this.contentScriptConnection.sendWampMessage(abortMessage);
  }

  disconnect(reason) {
    this.state = 'shutting-down';

    const goodbyeMessage = new Wamp.GoodbyeMessage({
      reason,
    });

    this.contentScriptConnection.sendWampMessage(goodbyeMessage);
  }

  disconnectAcknowledged() {
    const isShuttingDown = this.state === 'shutting-down';

    if (!isShuttingDown) {
      throw new Error('Session not in shutting-down state');
    }

    this.disconnected();
  }

  disconnected() {
    const isEstablishing = this.state === 'establishing';
    const isShuttingDown = this.state === 'shutting-down';
    const isEstablished = this.state === 'established';
    const isClosed = this.state === 'closed';

    const isInCorrectState =
      isEstablishing || isEstablished || isShuttingDown || isClosed;

    if (!isInCorrectState) {
      throw new Error('Session not in a expected state');
    }

    this.state = 'closed';

    this.onWampSessionClosed(this);
  }
}

export default WampSession;
