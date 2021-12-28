async function favIconUrlFromOrigin(origin) {
  const queryOptions = { url: `${origin}/*` };

  const [tab] = await chrome.tabs.query(queryOptions);

  return tab.favIconUrl;
}

function checkForError() {
  const lastError = chrome.runtime.lastError;
  if (!lastError) {
    return;
  }

  if (lastError.stack && lastError.message) {
    return lastError;
  }

  return new Error(lastError.message);
}

function getAllWindows() {
  return new Promise((resolve, reject) => {
    chrome.windows.getAll(windows => {
      const error = checkForError();

      if (error) {
        return reject(error);
      }

      return resolve(windows);
    });
  });
}

export { favIconUrlFromOrigin, getAllWindows };
