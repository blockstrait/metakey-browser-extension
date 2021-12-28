import bsv from 'bsv';

import {
  UnexpectedError,
  InvalidParametersError,
  RequestRejectedError,
} from '../errors';
import Keyring from '../keyring';

import SignTransactionProcedure from '../remote-procedures-handlers/sign-transaction';

async function handleSignTransactionUserReplyCommand(message, context) {
  const { ephemeralStore, contentScriptConnections, notificationQueue } =
    context;

  const notification = notificationQueue.getCurrentNotification();

  const { requestId, kwArgs } = notification.userData;

  const contentScriptConnection = contentScriptConnections[notification.origin];

  if (contentScriptConnection === undefined) {
    throw new Error('Transport connection not found');
  }

  try {
    const keyring = await Keyring.fromStore(ephemeralStore);

    if (keyring === null) {
      throw new UnexpectedError('Keyring not found');
    }

    if (keyring.isLocked()) {
      throw new UnexpectedError('Keyring is locked; unlock it first');
    }

    if (message.result === true) {
      const { unlockingScriptPushData, unsignedRawTx, parentTxs } = kwArgs;

      const t = new bsv.Transaction(unsignedRawTx);

      const inputIndexLut = {};

      t.inputs.forEach((input, inputIndex) => {
        const outpoint = {
          script: new bsv.Script(parentTxs[inputIndex].script),
          satoshis: parentTxs[inputIndex].satoshis,
        };

        input.output = new bsv.Transaction.Output({
          satoshis: outpoint.satoshis,
          script: outpoint.script,
        });

        inputIndexLut[
          `${input.prevTxId.toString('hex')}_${input.outputIndex}`
        ] = inputIndex;
      });

      Object.keys(unlockingScriptPushData).forEach(key => {
        const inputIndex = inputIndexLut[key];

        const input = t.inputs[inputIndex];

        const unlockingScript = new bsv.Script(input.script);

        const pushDataOperations = unlockingScriptPushData[key];

        pushDataOperations.forEach(pushDataOperation => {
          let buf;

          switch (pushDataOperation.type) {
            case 'signature': {
              const signature = bsv.Transaction.Sighash.sign(
                t,
                keyring.derivePrivateKeyForOrigin(
                  notification.origin,
                  pushDataOperation.derivationPath
                ),
                pushDataOperation.sighashFlags,
                inputIndex,
                input.output.script,
                input.output.satoshisBN
              );

              buf = bsv.deps.Buffer.concat([
                signature.toDER(),
                // eslint-disable-next-line no-bitwise
                bsv.deps.Buffer.from([pushDataOperation.sighashFlags & 0xff]),
              ]);
              break;
            }
            case 'publicKey': {
              buf = keyring
                .derivePublicKeyForOrigin(
                  notification.origin,
                  pushDataOperation.derivationPath
                )
                .toBuffer();
              break;
            }
            default: {
              throw new InvalidParametersError(
                'Invalid push data operation type'
              );
            }
          }

          unlockingScript.chunks[pushDataOperation.pushDataIndex] = {
            buf,
            len: buf.length,
            opcodenum: buf.length,
          };
        });

        input.setScript(unlockingScript);
      });

      contentScriptConnection.wampSession.sendCallResult(requestId, [
        t.toString(),
      ]);
    } else {
      throw new RequestRejectedError('User rejected signing the transaction');
    }

    await notificationQueue.currentNotificationProcessed();
  } catch (error) {
    console.log(error);

    contentScriptConnection.wampSession.callError(
      requestId,
      SignTransactionProcedure.uri,
      error
    );

    await notificationQueue.currentNotificationProcessed();
  }
}

export default handleSignTransactionUserReplyCommand;
