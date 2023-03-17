chrome.tabs.onUpdated.addListener((tabId, tab) => {
    chrome.tabs.sendMessage(tabId, {
        type: 'NEW',
    });
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      fetch('data/h1b-data.json')
        .then(response => response.json())
        .then(data => {
          chrome.storage.local.set({h1b_data: data}, () => {
            // Iterate over the array of callbacks and send the data to each of them
            callbacks.forEach(callback => {
              callback({data: data});
            });
            // Clear the array of callbacks
            callbacks = [];
          });
        })
        .catch(error => console.error(error));
    }
  });


  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Check if the message is a request for the data
    if (message.type === 'get_data') {
      // Check if the data is already loaded
      chrome.storage.local.get('h1b_data', (data) => {
        if (data.h1b_data) {
          // If the data is loaded, send it to the content script
          sendResponse({data: data.h1b_data});
        } else {
          // If the data is not loaded, store the callback function in the array and wait for the data
          callbacks.push(sendResponse);
        }
      });
      // Return true to indicate that the response will be sent asynchronously
      return true;
    }
  });