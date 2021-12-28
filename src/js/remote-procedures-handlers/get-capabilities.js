import { brfc } from '@moneybutton/brfc';

import GetXpubProcedure from './get-xpub';
import SignMessageProcedure from './sign-message';
import SignTransactionProcedure from './sign-transaction';

const _brfc = brfc('Get capabilities', ['Trustchair'], '1');

async function handleGetCapabilitiesProcedure(
  requestId,
  args,
  kwArgs,
  context
) {
  const { contentScriptConnection } = context;

  const capabilities = {};

  capabilities[SignMessageProcedure.uri] = true;
  capabilities[SignTransactionProcedure.uri] = true;
  capabilities[GetXpubProcedure.uri] = true;

  contentScriptConnection.wampSession.sendCallResult(
    requestId,
    [],
    capabilities
  );
}

export default {
  uri: `metakey.${_brfc}`,
  handler: handleGetCapabilitiesProcedure,
};
