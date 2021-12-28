import { RequestRejectedError, UnexpectedError } from '../errors';
import Keyring from '../keyring';
import GetXpubProcedure from '../remote-procedures-handlers/get-xpub';

async function handleGetXpubUserReplyCommand(message, context) {
  const { ephemeralStore, contentScriptConnections, notificationQueue } =
    context;

  const notification = notificationQueue.getCurrentNotification();

  const { derivationPath, requestId } = notification.userData;

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
      const xpub = keyring.getXpubForOrigin(
        notification.origin,
        derivationPath
      );

      contentScriptConnection.wampSession.sendCallResult(requestId, [
        xpub.toString(),
      ]);
    } else {
      throw new RequestRejectedError('User rejected access to xpub');
    }

    await notificationQueue.currentNotificationProcessed();
  } catch (error) {
    console.log(error);

    contentScriptConnection.wampSession.callError(
      requestId,
      GetXpubProcedure.uri,
      error
    );

    await notificationQueue.currentNotificationProcessed();
  }
}

export default handleGetXpubUserReplyCommand;
