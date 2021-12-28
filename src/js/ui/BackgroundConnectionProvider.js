import React, { useEffect, useState, useRef } from 'react';

import portNamesMap from '../port-names';

import BackgroundConnectionContext from './BackgroundConnectionContext';

const initialState = {
  route: '#/',
  userData: {},
  activeSessions: {},
};

const BackgroundConnectionProvider = ({ children }) => {
  const [port, setPort] = useState(null);
  const [state, setState] = useState(null);

  const requestQueue = useRef({});

  const setupBackgroundConnection = () => {
    const port = chrome.runtime.connect({ name: portNamesMap.UI_PORT_NAME });

    port.onMessage.addListener(message => {
      switch (message.type) {
        case 'state': {
          setState(message.state);
          break;
        }
        case 'backgroundReply': {
          const responseId = message.id;

          const associatedRequest = requestQueue.current[responseId];

          const requestExists = associatedRequest !== undefined;

          if (requestExists) {
            const accept = requestQueue.current[responseId].accept;

            delete requestQueue.current[responseId];

            accept(message.payload);
          }
          break;
        }
        default: {
          break;
        }
      }
    });

    port.onDisconnect.addListener(() => {
      setState(initialState);
    });

    setPort(port);
  };

  const sendBackgroundCommand = async command => {
    function randomid() {
      return Math.floor(Math.random() * Math.pow(2, 53));
    }

    const message = {
      type: 'uiCommand',
      id: randomid(),
      payload: command,
    };

    return new Promise((accept, reject) => {
      requestQueue.current[message.id] = {
        message,
        accept,
        reject,
      };

      port.postMessage(message);
    });
  };

  useEffect(() => {
    const connectionToBackgroundExists = port !== null;

    if (!connectionToBackgroundExists) {
      setupBackgroundConnection();
    }
  }, [port]);

  const isLoading = state === null;

  return (
    <BackgroundConnectionContext.Provider
      value={{
        isLoading,
        state,
        sendBackgroundCommand,
      }}
    >
      {children}
    </BackgroundConnectionContext.Provider>
  );
};

export default BackgroundConnectionProvider;
