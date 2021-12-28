import ContentScriptConnection from '../contentscript-connection';
import Keyring from '../keyring';

async function handleEnterPasswordCommand(message, context, sendResponse) {
  const {
    contentScriptConnections,
    notificationQueue,
    ephemeralStore,
    persistentStore,
    onKeyringUnlocked,
  } = context;

  let contentScriptConnection = null;

  const notification = notificationQueue.getCurrentNotification();

  try {
    contentScriptConnection = contentScriptConnections[notification.origin];

    if (!(contentScriptConnection instanceof ContentScriptConnection)) {
      throw Error('Could not retrieve expected transport connection');
    }

    let keyring = await Keyring.fromStore(ephemeralStore);

    let keyringLoadedFromEphemeralStore = true;

    if (keyring === null) {
      // try persistent store
      keyring = await Keyring.fromStore(persistentStore);

      keyringLoadedFromEphemeralStore = false;
    }

    if (keyring === null) {
      return sendResponse({ status: 'error', reason: 'Keyring not found' });
    }

    if (!keyring.isLocked() && keyringLoadedFromEphemeralStore) {
      return sendResponse({ status: 'success' });
    }

    try {
      await keyring.unlock(message.password);
    } catch (error) {
      return sendResponse({
        status: 'error',
        reason: 'Invalid password provided',
      });
    }

    await ephemeralStore.save('keyring', keyring.serialize());

    onKeyringUnlocked();

    sendResponse({ status: 'success' });

    await notificationQueue.currentNotificationProcessed();
  } catch (error) {
    if (contentScriptConnection) {
      contentScriptConnection.error(error);
    }

    await notificationQueue.currentNotificationProcessed();
  }
}

export default handleEnterPasswordCommand;
