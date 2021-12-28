import handleEnterPasswordCommand from './enter-password';
import handleGenerateMnemonicCommand from './generate-mnemonic';
import handleGetXpubUserReplyCommand from './get-xpub-user-reply';
import handleInitializeKeyringCommand from './initialize-keyring';
import handleNewConnectionReplyCommand from './new-connection-user-reply';
import handleSignMessageUserReplyCommand from './sign-message-user-reply';
import handleSignTransactionUserReplyCommand from './sign-transaction-user-reply';

const uiCommandHandlers = {};

uiCommandHandlers.enterPassword = handleEnterPasswordCommand;
uiCommandHandlers.generateMnemonic = handleGenerateMnemonicCommand;
uiCommandHandlers.initializeKeyring = handleInitializeKeyringCommand;
uiCommandHandlers.newConnectionReply = handleNewConnectionReplyCommand;
uiCommandHandlers.signMessageUserReply = handleSignMessageUserReplyCommand;
uiCommandHandlers.signTransactionUserReply =
  handleSignTransactionUserReplyCommand;
uiCommandHandlers.getXpubUserReply = handleGetXpubUserReplyCommand;

export { uiCommandHandlers as default };
