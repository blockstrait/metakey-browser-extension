import { brfc } from '@moneybutton/brfc';
import bsv from 'bsv';

import { InvalidParametersError } from '../errors';
import Keyring from '../keyring';

import {
  SignMessageNotification,
  EnterPasswordNotification,
} from '../notifications';

const _brfc = brfc('Sign message using ECDSA', ['Trustchair'], '1');

async function handleSignMessageProcedure(requestId, args, kwArgs, context) {
  const { ephemeralStore, origin, notificationQueue } = context;

  if (args.length !== 2) {
    throw new InvalidParametersError('Only two arguments are expected');
  }

  const message = args[0];

  if (typeof message !== 'string') {
    throw new InvalidParametersError('`message` must be a string');
  }

  const derivationPath = args[1];

  if (typeof derivationPath !== 'string') {
    throw new InvalidParametersError('`derivationPath` must be a string');
  }

  if (!bsv.HDPrivateKey.isValidPath(derivationPath)) {
    throw new InvalidParametersError('`derivationPath` is not valid');
  }

  const keyring = await Keyring.fromStore(ephemeralStore);

  if (keyring === null || keyring.isLocked()) {
    const notification = new EnterPasswordNotification(origin);

    await notificationQueue.add(notification);
  }

  const userData = {
    requestId,
    message,
    derivationPath,
  };

  const notification = new SignMessageNotification(origin, userData);

  await notificationQueue.add(notification);
}

export default {
  uri: `metakey.${_brfc}`,
  handler: handleSignMessageProcedure,
};
