import Notification from './notification';

class SignTransactionNotification extends Notification {
  constructor(origin, userData) {
    super({
      width: 400,
      height: 620,
      route: '#signTransaction',
      origin,
      userData,
    });
  }
}

export default SignTransactionNotification;
