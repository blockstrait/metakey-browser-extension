import { brfc } from '@moneybutton/brfc';
import bsv from 'bsv';

import { InvalidParametersError } from '../errors';
import Keyring from '../keyring';

import {
  GetXpubNotification,
  EnterPasswordNotification,
} from '../notifications';

const _brfc = brfc('Get xpub for origin', ['Trustchair'], '1');

async function handleGetXpubProcedure(requestId, args, kwArgs, context) {
  const { ephemeralStore, origin, notificationQueue } = context;

  if (args.length !== 1) {
    throw new InvalidParametersError('Only one argument expected');
  }

  const derivationPath = args[0];

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
    derivationPath: args[0],
  };

  const notification = new GetXpubNotification(origin, userData);

  await notificationQueue.add(notification);
}

export default {
  uri: `metakey.${_brfc}`,
  handler: handleGetXpubProcedure,
};
