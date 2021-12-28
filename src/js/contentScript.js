import { BrowserExtensionTransport } from '@blockstrait/metakey-core';

const METAKEY_CLIENT_DESTINATION = 'metakey-client';
const METAKEY_CONTENT_SCRIPT_DESTINATION = 'metakey-contentscript';

import portNamesMap from './port-names';

let activeConnection = null;

const sendResponse = message => {
  window.postMessage(
    {
      metakeyDestination: METAKEY_CLIENT_DESTINATION,
      metakeyMessage: message.serialize(),
    },
    location.origin
  );
};

function handleConnectMessage() {
  if (activeConnection) {
    const responseMessage = new BrowserExtensionTransport.ConnectReplyMessage({
      status: 'FAILED',
    });

    return sendResponse(responseMessage);
  }

  const port = chrome.runtime.connect({
    name: portNamesMap.CONTENT_SCRIPT_PORT_NAME,
  });

  activeConnection = {
    state: 'connected',
    port,
  };

  let dataMessage;

  port.onMessage.addListener(msg => {
    try {
      switch (msg.command) {
        case 'connected':
          break;

        case 'disconnected':
          throw new Error(
            `Application disconnected with reason: ${msg.reason}`
          );

        case 'error':
          throw new Error(`Unexpected error: ${msg.reason}`);

        case 'data':
          dataMessage = new BrowserExtensionTransport.DataMessage({
            payload: msg.payload,
          });

          sendResponse(dataMessage);
          break;

        default:
          throw new Error('Unexpected error');
      }
    } catch (error) {
      port.disconnect();

      const responseMessage = new BrowserExtensionTransport.DisconnectedMessage(
        {
          reason: 'Unexpected error',
        }
      );

      sendResponse(responseMessage);

      activeConnection = null;
    }
  });

  port.onDisconnect.addListener(() => {
    activeConnection = null;

    const responseMessage = new BrowserExtensionTransport.DisconnectedMessage({
      reason: 'Inactive for a while',
    });

    sendResponse(responseMessage);
  });

  const responseMessage = new BrowserExtensionTransport.ConnectReplyMessage({
    status: 'SUCCESS',
    id: 3,
  });

  sendResponse(responseMessage);
}

function handledDataMessage(dataMessage) {
  if (activeConnection) {
    const { port } = activeConnection;

    port.postMessage(dataMessage.payload);
  }
}

const messageHandlers = {};

messageHandlers[BrowserExtensionTransport.ConnectMessage.type] =
  handleConnectMessage;
messageHandlers[BrowserExtensionTransport.DataMessage.type] =
  handledDataMessage;

const messageFactory = new BrowserExtensionTransport.MessageFactory();

window.addEventListener('message', event => {
  const isEventValid =
    event.origin === location.origin &&
    event.source === window &&
    typeof event.data === 'object' &&
    typeof event.data.metakeyMessage === 'string' &&
    event.data.metakeyDestination === METAKEY_CONTENT_SCRIPT_DESTINATION;

  if (!isEventValid) {
    return;
  }

  const { metakeyMessage } = event.data;

  const transportMessage = messageFactory.fromJSON(metakeyMessage);

  const messageHandler = messageHandlers[transportMessage.type];

  if (messageHandler) {
    try {
      messageHandler(transportMessage);
    } catch (error) {
      console.log(error);
    }
  }
});
