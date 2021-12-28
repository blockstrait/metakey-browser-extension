import Notification from './notification';

class EnterPasswordNotification extends Notification {
  constructor(origin) {
    super({
      width: 360,
      height: 620,
      route: '#enterPassword',
      origin,
    });
  }
}

export default EnterPasswordNotification;
