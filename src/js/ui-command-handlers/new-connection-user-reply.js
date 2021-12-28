import ContentScriptConnection from '../contentscript-connection';

async function handleNewConnectionUserReplyCommand(message, context) {
  const { contentScriptConnections, notificationQueue } = context;

  const notification = notificationQueue.getCurrentNotification();

  let contentScriptConnection = null;

  try {
    contentScriptConnection = contentScriptConnections[notification.origin];

    if (!(contentScriptConnection instanceof ContentScriptConnection)) {
      throw Error('Could not retrieve expected transport connection');
    }

    if (message.result === true) {
      contentScriptConnection.wampSession.established();
    } else {
      contentScriptConnection.wampSession.abort('User rejected the connection');
    }

    await notificationQueue.currentNotificationProcessed();
  } catch (error) {
    console.log(error);

    if (contentScriptConnection) {
      contentScriptConnection.error(error);
    }

    await notificationQueue.currentNotificationProcessed();
  }
}

export default handleNewConnectionUserReplyCommand;
