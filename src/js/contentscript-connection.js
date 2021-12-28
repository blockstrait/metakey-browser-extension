import { MetakeyError, UnexpectedError } from './errors';
import WampSession from './wamp-session';

function randomid() {
  return Math.floor(Math.random() * Math.pow(2, 53));
}

class ContentScriptConnection {
  constructor(params) {
    let {
      state,
      id,
      port,
      onDisconnected,
      onWampSessionEstablished,
      onWampSessionClosed,
    } = params;

    if (id === undefined) {
      id = randomid();
    }

    if (state === undefined) {
      state = 'disconnected';
    }

    if (typeof id !== 'number') {
      throw new TypeError('`id` must be a number');
    }

    const validStates = ['disconnected', 'connecting', 'connected'];

    if (!validStates.includes(state)) {
      throw new TypeError('`state` must be a valid state');
    }

    if (typeof onWampSessionEstablished !== 'function') {
      throw new TypeError('`onWampSessionEstablished` must be a function');
    }

    if (typeof onWampSessionClosed !== 'function') {
      throw new TypeError('`onWampSessionClosed` must be a function');
    }

    if (typeof onDisconnected !== 'function') {
      throw new TypeError('`onDisconnected` must be a function');
    }

    this.state = state;
    this.id = id;
    this.port = port;

    this.wampSession = new WampSession({
      state: 'closed',
      contentScriptConnection: this,
      onWampSessionEstablished,
      onWampSessionClosed,
    });

    this.onDisconnected = onDisconnected;
  }

  connected() {
    const isConnecting = this.state === 'connecting';

    if (!isConnecting) {
      throw new Error('Transport connection is not in connecting state');
    }

    this.state = 'connected';

    this.port.postMessage({ command: 'connected' });
  }

  error(error) {
    let _error = error;

    if (!(error instanceof MetakeyError)) {
      _error = new UnexpectedError(error.message);
    }

    this.disconnected(_error);
  }

  disconnected(error) {
    const isConnected = this.state === 'connected';

    const isInCorrectState = isConnected;

    if (!isInCorrectState) {
      throw new Error('Transport connection is not in a expected state');
    }

    this.state = 'disconnected';

    this.wampSession.disconnected();

    this.onDisconnected(this);

    this.port.postMessage({ command: 'error', reason: error.externalMessage });
  }

  sendWampMessage(wampMessage) {
    this.port.postMessage({
      command: 'data',
      payload: wampMessage.serialize(),
    });
  }
}

export default ContentScriptConnection;
