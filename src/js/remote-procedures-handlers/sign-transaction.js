import { brfc } from '@moneybutton/brfc';

import bsv from 'bsv';

import { InvalidParametersError } from '../errors';
import Keyring from '../keyring';

import {
  SignTransactionNotification,
  EnterPasswordNotification,
} from '../notifications';

const _brfc = brfc('Sign Bitcoin SV transaction', ['Trustchair'], '1');

async function handleSignTransactionProcedure(
  requestId,
  args,
  kwArgs,
  context
) {
  const { ephemeralStore, origin, notificationQueue } = context;

  const {
    unlockingScriptPushData,
    unsignedRawTx,
    parentTxs,
    changeOutputIndexes,
  } = kwArgs;

  if (typeof unsignedRawTx !== 'string') {
    throw new InvalidParametersError('`unsignedRawTx` must be a string');
  }

  if (!Array.isArray(parentTxs)) {
    throw new InvalidParametersError('`parentTxs` must be an array');
  }

  if (parentTxs.length === 0) {
    throw new InvalidParametersError(
      '`parentTxs` must have at least one element'
    );
  }

  if (unlockingScriptPushData && typeof unlockingScriptPushData !== 'object') {
    throw new InvalidParametersError(
      '`unlockingScriptPushData` must be an object'
    );
  }

  Object.keys(unlockingScriptPushData).forEach(key => {
    const pushDataOperations = unlockingScriptPushData[key];

    pushDataOperations.forEach(pushDataOperation => {
      switch (pushDataOperation.type) {
        case 'signature':
          if (
            !Number.isFinite(pushDataOperation.sighashFlags) ||
            pushDataOperation.sighashFlags < 0
          ) {
            throw new InvalidParametersError(
              '`pushDataOperation.sighashFlags` is not valid number'
            );
          }

          break;
        case 'publicKey':
          break;

        default:
          throw new InvalidParametersError('Invalid push data operation type');
      }

      // Validate common fields
      if (!bsv.HDPrivateKey.isValidPath(pushDataOperation.derivationPath)) {
        throw new InvalidParametersError(
          '`pushDataOperation.derivationPath` is not valid'
        );
      }

      if (
        !Number.isFinite(pushDataOperation.pushDataIndex) ||
        pushDataOperation.pushDataIndex < 0
      ) {
        throw new InvalidParametersError(
          '`pushDataOperation.pushDataIndex` is not valid number'
        );
      }
    });
  });

  const t = new bsv.Transaction(unsignedRawTx);

  const totalInputSats = parentTxs.reduce((accumulator, input) => {
    if (typeof input !== 'object') {
      throw new InvalidParametersError('parentTx element is not an object');
    }

    const { satoshis, script: scriptHex } = input;

    if (!Number.isFinite(satoshis) || satoshis < 0) {
      throw new InvalidParametersError('`satoshis` is not a positive number');
    }

    // Verify script by creating a Script instance
    bsv.Script.fromString(scriptHex);

    return accumulator + input.satoshis;
  }, 0);

  if (!Array.isArray(t.outputs) || t.outputs.length === 0) {
    throw new InvalidParametersError('`outputs` must be an array');
  }

  let totalOutputSats = t.outputs.reduce(
    (accumulator, output) => accumulator + output.satoshis,
    0
  );

  let totalChangeOutputSats = undefined;

  if (changeOutputIndexes) {
    if (!Array.isArray(changeOutputIndexes)) {
      throw new InvalidParametersError(
        '`changeOutputIndexes` must be an array'
      );
    }

    totalChangeOutputSats = changeOutputIndexes.reduce(
      (accumulator, changeOutputIndex) => {
        if (!Number.isFinite(changeOutputIndex) || changeOutputIndex < 0) {
          throw new InvalidParametersError('Invalid output index value');
        }

        const changeOutput = t.outputs[changeOutputIndex];

        return accumulator + changeOutput.satoshis;
      },
      0
    );

    totalOutputSats -= totalChangeOutputSats;
  }

  const keyring = await Keyring.fromStore(ephemeralStore);

  if (keyring === null || keyring.isLocked()) {
    const notification = new EnterPasswordNotification(origin);

    await notificationQueue.add(notification);
  }

  const userData = {
    requestId,
    totalInputSats,
    totalOutputSats,
    totalChangeOutputSats,
    args,
    kwArgs,
  };

  const notification = new SignTransactionNotification(origin, userData);

  await notificationQueue.add(notification);
}

export default {
  uri: `metakey.${_brfc}`,
  handler: handleSignTransactionProcedure,
};
