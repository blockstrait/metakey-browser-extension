import { Wamp } from '@blockstrait/metakey-core';

import { InvalidParametersError } from '../errors';
import remoteProcedureHandlers from '../remote-procedures-handlers';

async function callMessageHandler(callMessage, context) {
  const { contentScriptConnection } = context;

  if (contentScriptConnection.wampSession.state !== 'established') {
    const abortMessage = new Wamp.AbortMessage({
      errorMessage:
        'Received CALL message and no WAMP session has been established',
      reason: 'wamp.error.protocol_violation',
    });

    return contentScriptConnection.wampSession.abort(abortMessage);
  }

  const procedureHandler = remoteProcedureHandlers[callMessage.procedureUri];

  if (!procedureHandler) {
    return contentScriptConnection.error(
      new InvalidParametersError('Invalid message received')
    );
  }

  const { args, kwArgs } = context;

  try {
    if (args && !Array.isArray(args)) {
      throw new InvalidParametersError('`args` must be an array');
    }

    if (kwArgs && typeof kwArgs !== 'object') {
      throw new InvalidParametersError('`kwArgs` must be an object');
    }

    procedureHandler(
      callMessage.requestId,
      callMessage.args,
      callMessage.kwArgs,
      context
    );
  } catch (error) {
    contentScriptConnection.wampSession.callError(
      callMessage.requestId,
      callMessage.procedureUri,
      error
    );
  }
}

export default callMessageHandler;
