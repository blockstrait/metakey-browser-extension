import Notification from './notification';

class NewSessionNotification extends Notification {
  constructor(origin, userData) {
    super({
      width: 360,
      height: 620,
      route: '#newSession',
      origin,
      userData,
    });
  }
}

export default NewSessionNotification;
