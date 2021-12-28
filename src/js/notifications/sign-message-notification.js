import Notification from './notification';

class SignMessageNotification extends Notification {
  constructor(origin, userData) {
    super({
      width: 360,
      height: 620,
      route: '#signMessage',
      origin,
      userData,
    });
  }
}

export default SignMessageNotification;
