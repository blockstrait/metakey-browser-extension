class Store {
  constructor(namespace) {
    this.namespace = namespace;
  }

  async load(key) {
    return new Promise(resolve => {
      chrome.storage.local.get([this.namespace], storedData => {
        if (!storedData[this.namespace]) {
          return resolve(null);
        }

        const values = storedData[this.namespace][key];

        resolve(values ? values : null);
      });
    });
  }

  async save(key, value) {
    return new Promise(resolve => {
      chrome.storage.local.get([this.namespace], storedData => {
        let currentStorageData = storedData[this.namespace];

        if (!currentStorageData) {
          currentStorageData = {};
        }

        const newEntry = {};

        if (value) {
          newEntry[key] = value;
        }

        const newStoreData = {};

        delete currentStorageData[key];

        newStoreData[this.namespace] = {
          ...currentStorageData,
          ...newEntry,
        };

        chrome.storage.local.set(newStoreData, () => resolve());
      });
    });
  }
}

export default Store;
