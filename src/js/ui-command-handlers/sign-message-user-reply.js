import bsv from 'bsv';

import { RequestRejectedError, UnexpectedError } from '../errors';
import Keyring from '../keyring';

import SignMessageProcedure from '../remote-procedures-handlers/sign-message';

async function handleSignMessageUserReplyCommand(message, context) {
  const { ephemeralStore, contentScriptConnections, notificationQueue } =
    context;

  const notification = notificationQueue.getCurrentNotification();

  const {
    message: messageToSign,
    derivationPath,
    requestId,
  } = notification.userData;

  const contentScriptConnection = contentScriptConnections[notification.origin];

  if (contentScriptConnection === undefined) {
    throw new Error('Transport connection not found');
  }

  try {
    const keyring = await Keyring.fromStore(ephemeralStore);

    if (keyring === null) {
      throw new UnexpectedError('Keyring not found');
    }

    if (keyring.isLocked()) {
      throw new UnexpectedError('Keyring is locked; unlock it first');
    }

    if (message.result === true) {
      const hash = bsv.crypto.Hash.sha256(bsv.deps.Buffer.from(messageToSign));

      const privateKey = keyring.derivePrivateKeyForOrigin(
        notification.origin,
        derivationPath
      );

      const signature = bsv.crypto.ECDSA.sign(hash, privateKey);

      contentScriptConnection.wampSession.sendCallResult(requestId, [
        signature.toString(),
      ]);
    } else {
      throw new RequestRejectedError('User rejected signing the message');
    }

    await notificationQueue.currentNotificationProcessed();
  } catch (error) {
    console.log(error);

    contentScriptConnection.wampSession.callError(
      requestId,
      SignMessageProcedure.uri,
      error
    );

    await notificationQueue.currentNotificationProcessed();
  }
}

export default handleSignMessageUserReplyCommand;
