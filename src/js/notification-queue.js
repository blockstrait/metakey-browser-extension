import { Notification } from './notifications';

class NotificationQueue {
  constructor(params) {
    const { onNotificationShown, onNotificationProcessed } = params;

    if (typeof onNotificationShown !== 'function') {
      throw new TypeError('`onNotificationShown` must be a function');
    }

    if (typeof onNotificationProcessed !== 'function') {
      throw new TypeError('`onNotificationProcessed` must be a function');
    }

    this._queue = [];

    this.isWaitingForUserInput = false;

    this.onNotificationProcessed = onNotificationProcessed;
    this.onNotificationShown = onNotificationShown;
  }

  async add(notification) {
    if (!(notification instanceof Notification)) {
      throw new TypeError('`notification` must be an instance of Notification');
    }

    this._queue.push(notification);

    chrome.action.setBadgeText({ text: `${this._queue.length}` }, () => {});

    await this._tryToProcessNextNotification();
  }

  async _tryToProcessNextNotification() {
    if (this._queue.length > 0 && !this.isWaitingForUserInput) {
      await this.processNextNotification();
    }
  }

  async processNextNotification() {
    if (this._queue.length === 0) {
      throw new Error('No notifications found');
    }

    const notification = this._queue[0];

    this.isWaitingForUserInput = true;

    await notification.showPopup();

    this.onNotificationShown(notification);
  }

  getCurrentNotificationInfo() {
    if (this._queue.length === 0) {
      throw new Error('No notifications found');
    }

    const notification = this._queue[0];

    return notification.getInfo();
  }

  getCurrentNotification() {
    if (this._queue.length === 0) {
      throw new Error('No notifications found');
    }

    const notification = this._queue[0];

    return notification;
  }

  async currentNotificationProcessed() {
    if (this._queue.length === 0) {
      throw new Error('No notifications found');
    }

    const notification = this._queue[0];

    this._queue = this._queue.slice(1);

    await notification.closePopup();

    let badgeText = '';

    if (this._queue.length > 0) {
      badgeText = `${this._queue.length}`;
    }

    chrome.action.setBadgeText({ text: badgeText }, () => {});

    this.onNotificationProcessed(notification);

    this.isWaitingForUserInput = false;

    await this._tryToProcessNextNotification();

    return notification;
  }

  async flushNotificationsForOrigin(origin) {
    const indexesToRemove = [];

    // Do not remove index 0 because it will be used by currentNotificationProcessed()
    this._queue.forEach((notification, index) => {
      if (notification.origin === origin && index !== 0) {
        indexesToRemove.push(index);
      }
    });

    indexesToRemove.forEach(indexToRemove => {
      this._queue.splice(indexToRemove, 1);
    });

    if (this._queue.length > 0) {
      await this.currentNotificationProcessed();
    }
  }

  windowRemoved(windowId) {
    const notification = this._queue[0];

    if (
      notification &&
      notification.popupData &&
      notification.popupData.popupId === windowId
    ) {
      notification.windowRemoved(windowId);
    }
  }
}

export default NotificationQueue;
