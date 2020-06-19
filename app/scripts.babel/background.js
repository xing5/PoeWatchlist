'use strict';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.browserAction.setBadgeText({text: 'PW'});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log('from content script:' + sender.tab.url);
    if (request.action == 'add') {
      chrome.storage.local.get(['PWDB'], function(result) {
        // add this item to PWDB
        let pwdb = result.PWDB || {};
        pwdb.items = pwdb.items || {};
        pwdb.items[request.data] = {};
        chrome.storage.local.set({PWDB: pwdb}, function() {
          sendResponse(pwdb);
        })
      })
    } else if (request.action == 'pull') {
      chrome.storage.local.get(['PWDB'], function(result) {
        sendResponse(result['PWDB'] || {items: {}});
      })
    } else if (request.action == 'delete') {
      chrome.storage.local.get(['PWDB'], function(result) {
        // delete this item from PWDB
        let pwdb = result.PWDB || {};
        pwdb.items = pwdb.items || {};
        delete pwdb.items[request.data];
        chrome.storage.local.set({PWDB: pwdb}, function() {
          sendResponse(pwdb);
        })
      })
    }
    return true;
  });

function updateDB(pwdb, ids) {
  if (ids.length > 0) {
    $.getJSON('https://www.pathofexile.com/api/trade/fetch/' + ids.join(','), function(json) {
      json.result.forEach(element => {
        if (element.id in pwdb.items) {
          let previous = pwdb.items[element.id];
          if ('listing' in previous && previous.listing.account.online === null) {
            if (element.listing.account.online != null) {
              // someone come online!
              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon-38.png',
                title: element.item.name,
                message: 'The owner ' + element.listing.account.lastCharacterName + ' is online!'
              });
            }
          }
        }
        pwdb.items[element.id] = element;
      });
      chrome.storage.local.set({PWDB: pwdb}, function() {
        console.log('DB updated!')
        console.log(pwdb);
      })
    })
  }
}

var PWUpdateInterval = setInterval(function() {
  chrome.storage.local.get(['PWDB'], function(result) {
    let pwdb = result.PWDB || {};
    pwdb.items = pwdb.items || {};
    updateDB(pwdb, Object.keys(pwdb.items));

    // -- below batch logic might not work unless we update per key --
    // let ids = Object.keys(pwdb.items);
    // let batch = [];
    // for (i = 0; i < ids.length; i++) {
    //   batch.add[ids[i]];
    //   if (batch.length == 8) {
    //     console.log('updating batch no.' + (i/8 + 1));
    //     updateDB(pwdb, batch);
    //     batch = [];
    //   }
    // }
    // if (batch.length > 0) {
    //   console.log('updating last batch with size of ' + batch.length);
    //   updateDB(pwdb, batch);
    // }
  })
}, 5 * 1000)



