import { Wamp } from '@blockstrait/metakey-core';

import Keyring from '../keyring';
import { NewSessionNotification } from '../notifications';

async function helloMessageHandler(helloMessage, context) {
  const {
    origin,
    contentScriptConnection,
    notificationQueue,
    persistentStore,
  } = context;

  const keyring = await Keyring.fromStore(persistentStore);

  if (keyring === null) {
    // The user has not configured the keyring yet

    const abortMessage = new Wamp.AbortMessage({
      errorMessage:
        'Received HELLO message before the user has configured a keychain',
      reason: 'wamp.close.close_realm',
    });

    return contentScriptConnection.wampSession.abort(abortMessage);
  }

  if (contentScriptConnection.wampSession.state !== 'closed') {
    const abortMessage = new Wamp.AbortMessage({
      errorMessage:
        'Received HELLO message after a WAMP session has been established',
      reason: 'wamp.error.protocol_violation',
    });

    return contentScriptConnection.wampSession.abort(abortMessage);
  }

  contentScriptConnection.wampSession.establishing();

  const notification = new NewSessionNotification(origin);

  notificationQueue.add(notification);
}

export default helloMessageHandler;
