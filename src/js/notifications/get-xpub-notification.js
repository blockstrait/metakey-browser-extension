import Notification from './notification';

class GetXpubNotification extends Notification {
  constructor(origin, userData) {
    super({
      width: 360,
      height: 620,
      route: '#getXpub',
      origin,
      userData,
    });
  }
}

export default GetXpubNotification;
