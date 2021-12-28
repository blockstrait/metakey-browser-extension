import Keyring from '../keyring';

async function handleInitializeKeyringCommand(message, context, sendResponse) {
  const { mnemonic, password } = message.params;

  const { ephemeralStore, persistentStore, onKeyringUnlocked } = context;

  try {
    const keyring = await Keyring.fromMnemonic(mnemonic, password);

    const serializedKeyring = keyring.serialize();

    await ephemeralStore.save('keyring', serializedKeyring);
    await persistentStore.save('keyring', serializedKeyring);

    onKeyringUnlocked();
  } catch (error) {
    return sendResponse({ status: 'error', reason: `${error}` });
  }

  sendResponse({ status: 'success' });
}

export default handleInitializeKeyringCommand;
