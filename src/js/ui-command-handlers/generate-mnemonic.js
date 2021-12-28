import { generateMnemonic } from 'bip39';

async function handleGenerateMnemonicCommand(message, context, sendResponse) {
  const mnemonic = generateMnemonic();

  sendResponse({ status: 'success', mnemonic });
}

export default handleGenerateMnemonicCommand;
