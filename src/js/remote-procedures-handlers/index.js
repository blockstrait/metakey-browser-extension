import GetCapabilitiesProcedure from './get-capabilities';
import GetXpubProcedure from './get-xpub';
import SignMessageProcedure from './sign-message';
import SignTransactionProcedure from './sign-transaction';

const remoteProcedureHandlers = {};

remoteProcedureHandlers[GetCapabilitiesProcedure.uri] =
  GetCapabilitiesProcedure.handler;
remoteProcedureHandlers[SignMessageProcedure.uri] =
  SignMessageProcedure.handler;
remoteProcedureHandlers[SignTransactionProcedure.uri] =
  SignTransactionProcedure.handler;
remoteProcedureHandlers[GetXpubProcedure.uri] = GetXpubProcedure.handler;

export { remoteProcedureHandlers as default };
