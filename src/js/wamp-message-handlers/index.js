import { Wamp } from '@blockstrait/metakey-core';

import callMessageHandler from './call-message-handler';
import helloMessageHandler from './hello-message-handler';

const messageHandlers = {};

messageHandlers[Wamp.HelloMessage.type] = helloMessageHandler;
messageHandlers[Wamp.CallMessage.type] = callMessageHandler;

export { messageHandlers as default };
