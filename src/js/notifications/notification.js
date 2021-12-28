import { favIconUrlFromOrigin, getAllWindows } from '../window-utils';

class Notification {
  constructor(params) {
    const { width, height, route, origin, userData } = params;

    if (typeof width !== 'number') {
      throw new TypeError('`width` must be a number');
    }

    if (typeof height !== 'number') {
      throw new TypeError('`height` must be a number');
    }

    if (typeof route !== 'string') {
      throw new TypeError('`height` must be a string');
    }

    if (typeof origin !== 'string') {
      throw new TypeError('`origin` must be a string');
    }

    if (userData && typeof userData !== 'object') {
      throw new TypeError('`userData` must be an object');
    }

    this.windowWidth = width;
    this.windowHeight = height;
    this.route = route;
    this.origin = origin;
    this.userData = userData;

    this.popupData = null;
  }

  async showPopup() {
    const currentWindow = await chrome.windows.getCurrent();

    const notificationTop = Math.round(
      currentWindow.top + currentWindow.height / 2 - this.windowHeight / 2
    );
    const notificationLeft = Math.round(
      currentWindow.left + currentWindow.width / 2 - this.windowWidth / 2
    );

    const popup = await chrome.windows.create({
      type: 'popup',
      url: `notification.html${this.route}`,
      width: this.windowWidth,
      height: this.windowHeight,
      top: Math.max(notificationTop, 0),
      left: Math.max(notificationLeft, 0),
    });

    const tabId = popup.tabs[0].id;

    const favIconUrl = await favIconUrlFromOrigin(this.origin);

    this.popupData = {
      popupId: popup.id,
      tabId,
      favIconUrl,
    };
  }

  getInfo() {
    return {
      route: this.route,
      userData: {
        ...this.userData,
        favIconUrl: this.popupData.favIconUrl,
        origin: this.origin,
      },
    };
  }

  async closePopup() {
    if (this.popupData && this.popupData.popupId !== null) {
      await chrome.windows.remove(this.popupData.popupId);
    }
  }

  windowRemoved(windowId) {
    if (this.popupData && this.popupData.popupId === windowId) {
      this.popupData.popupId = null;
      this.popupData.tabId = null;
    }
  }

  async _getPopup() {
    const windows = await getAllWindows();

    return this._getPopupIn(windows);
  }

  _getPopupIn(windows) {
    return windows
      ? windows.find(win => {
          // Returns notification popup
          return (
            win && win.type === 'popup' && win.id === this.windowData.windowId
          );
        })
      : null;
  }
}

export default Notification;
