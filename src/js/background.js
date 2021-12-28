import { Wamp } from '@blockstrait/metakey-core';

import ContentScriptConnection from './contentscript-connection';
import { UnexpectedError } from './errors';
import Keyring from './keyring';
import NotificationQueue from './notification-queue';
import portNamesMap from './port-names';
import Store from './store';
import uiCommandHandlers from './ui-command-handlers';
import wampMessageHandlers from './wamp-message-handlers';
import { favIconUrlFromOrigin } from './window-utils';

const ephemeralStore = new Store('ephemeral');
const persistentStore = new Store('persistent');

const wampMessageFactory = new Wamp.MessageFactory();

const contentScriptConnections = {};
const uiConnections = {};

let uiState = {
  route: '/#',
  userData: {},
  activeSessions: {},
  isKeychainPresent: false,
};

// Alarm names
const NOTIFICATION_USER_REPLY_ALARM_NAME = 'NotificationUserReply';
const LOCK_KEYRING_ALARM_NAME = 'LockKeyring';

// Alarm timeouts
const alarmTimeoutsInMinutes = {};

alarmTimeoutsInMinutes[NOTIFICATION_USER_REPLY_ALARM_NAME] = 0.5;
alarmTimeoutsInMinutes[LOCK_KEYRING_ALARM_NAME] = 30;

function syncStateForAllUiConnections() {
  Object.values(uiConnections).forEach(({ port }) => {
    port.postMessage({ type: 'state', state: uiState });
  });
}

function onNotificationShown(notification) {
  const { route, userData } = notification.getInfo();

  uiState = {
    ...uiState,
    route,
    userData,
  };

  syncStateForAllUiConnections();

  chrome.alarms.create(NOTIFICATION_USER_REPLY_ALARM_NAME, {
    delayInMinutes: alarmTimeoutsInMinutes[NOTIFICATION_USER_REPLY_ALARM_NAME],
  });
}

function onNotificationProcessed() {
  chrome.alarms.clear(NOTIFICATION_USER_REPLY_ALARM_NAME);

  uiState = {
    ...uiState,
    route: '/#',
    userData: {},
  };

  syncStateForAllUiConnections();
}

const notificationQueue = new NotificationQueue({
  onNotificationShown,
  onNotificationProcessed,
});

async function onWampSessionEstablished(wampSession) {
  const origin = wampSession.contentScriptConnection.port.sender.origin;

  const favIconUrl = await favIconUrlFromOrigin(origin);

  uiState.activeSessions[origin] = {
    origin,
    favIconUrl,
  };

  syncStateForAllUiConnections();
}

async function onWampSessionClosed(wampSession) {
  const origin = wampSession.contentScriptConnection.port.sender.origin;

  delete uiState.activeSessions[origin];

  await notificationQueue.flushNotificationsForOrigin(origin);

  syncStateForAllUiConnections();
}

async function onContentScriptConnectionDisconnected(connection) {
  const origin = connection.port.sender.origin;

  delete contentScriptConnections[origin];
}

async function onContentScriptConnected(port) {
  const origin = port.sender.origin;

  const contentScriptConnectionExists = contentScriptConnections[origin]
    ? true
    : false;

  if (contentScriptConnectionExists) {
    return port.postMessage({
      command: 'error',
      reason: 'Connection already exists',
    });
  }

  const contentScriptConnection = new ContentScriptConnection({
    state: 'connecting',
    port,
    onWampSessionEstablished,
    onWampSessionClosed,
    onDisconnected: onContentScriptConnectionDisconnected,
  });

  contentScriptConnections[origin] = contentScriptConnection;

  port.onMessage.addListener(async message => {
    const wampMessage = wampMessageFactory.fromJSON(message);

    const wampMessageHandler = wampMessageHandlers[wampMessage.type];

    if (wampMessageHandler === undefined) {
      return contentScriptConnection.error(
        new UnexpectedError('Invalid message received')
      );
    }

    const context = {
      contentScriptConnection,
      ephemeralStore,
      persistentStore,
      origin,
      notificationQueue,
    };

    try {
      await wampMessageHandler(wampMessage, context);
    } catch (error) {
      console.log(error);
    }
  });

  port.onDisconnect.addListener(port => {
    const origin = port.sender.origin;

    const contentScriptConnection = contentScriptConnections[origin];

    if (contentScriptConnection) {
      contentScriptConnection.error('Port disconnected');
    }
  });

  contentScriptConnection.connected();
}

async function onKeyringUnlocked() {
  chrome.alarms.clear(LOCK_KEYRING_ALARM_NAME);

  chrome.alarms.create(LOCK_KEYRING_ALARM_NAME, {
    delayInMinutes: alarmTimeoutsInMinutes[LOCK_KEYRING_ALARM_NAME],
  });
}

async function onUiConnected(port) {
  uiConnections[port.sender.url] = { port };

  port.onMessage.addListener(async message => {
    const context = {
      onKeyringUnlocked,
      ephemeralStore,
      persistentStore,
      contentScriptConnections,
      notificationQueue,
    };

    const isMessageValid =
      message.type === 'uiCommand' &&
      typeof message.id === 'number' &&
      message.id > 0 &&
      typeof message.payload === 'object' &&
      typeof message.payload.command === 'string';

    if (!isMessageValid) {
      return;
    }

    const sendResponseMessage = commandResponse => {
      const responseMessage = {
        type: 'backgroundReply',
        id: message.id,
        payload: commandResponse,
      };

      port.postMessage(responseMessage);
    };

    const commandHandler = uiCommandHandlers[message.payload.command];

    if (!commandHandler) {
      return sendResponseMessage({
        status: 'error',
        reason: 'Unknown command',
      });
    }

    try {
      await commandHandler(message.payload, context, sendResponseMessage);
    } catch (error) {
      console.error(error);
    }
  });

  port.onDisconnect.addListener(port => {
    delete uiConnections[port.sender.url];
  });

  const keyring = await Keyring.fromStore(persistentStore);

  uiState.isKeychainPresent = keyring === null ? false : true;

  port.postMessage({ type: 'state', state: uiState });
}

chrome.windows.onRemoved.addListener(windowId => {
  notificationQueue.windowRemoved(windowId);
});

chrome.alarms.onAlarm.addListener(async alarm => {
  try {
    if (alarm.name === NOTIFICATION_USER_REPLY_ALARM_NAME) {
      const notificationInfo = notificationQueue.getCurrentNotificationInfo();

      const origin = notificationInfo.userData.origin;

      const contentScriptConnection = contentScriptConnections[origin];

      if (contentScriptConnection) {
        contentScriptConnection.error('User reply timeout');
      }
    } else if (alarm.name === LOCK_KEYRING_ALARM_NAME) {
      await ephemeralStore.save('keyring', null);
    }
  } catch (error) {
    console.log(error);
  }
});

try {
  chrome.runtime.onInstalled.addListener(async () => {
    console.log('Installing...');

    await ephemeralStore.save('keyring', null);
  });

  chrome.runtime.onConnect.addListener(port => {
    switch (port.name) {
      case portNamesMap.CONTENT_SCRIPT_PORT_NAME:
        onContentScriptConnected(port);
        break;

      case portNamesMap.UI_PORT_NAME:
        onUiConnected(port);
        break;

      default:
        // Ignore
        break;
    }
  });
} catch (error) {
  console.log(error);
}
