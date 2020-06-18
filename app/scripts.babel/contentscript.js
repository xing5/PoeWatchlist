'use strict';
console.log('\'Allo \'Allo! Content script');

var PW = {
  tabSrc: '\
    <li id="watchlist-tab" role="presentation" class="menu-search menu-watchlist"> \
      <a data-target="watchlist" data-toggle="tab"> \
        <span>Watchlist</span> \
      </a> \
    </li> \
  ',

  addBtnSrc: '\
    <a role="button" target="_blank" class="btn btn-default pm-btn watch-btn">Save</a> \
  ',

  addToWatchlist: function(id) {
    chrome.runtime.sendMessage({action: 'add', data: id}, function(response) {
      console.log('response: \n');
      console.log(response);
    });
  },

  watchlist: {}
}


$('#trade > .navigation > .main').append(PW.tabSrc);

var PWInjectionInterval = setInterval(function() {
  // add save button
  let unInjected = $('#trade .right div.btns .pull-left').not('.injected')
  unInjected.append(PW.addBtnSrc);
  // bind button event
  unInjected.find('.watch-btn').on('click', function(event) {
    let id = $(event.target).parents('.row').attr('data-id');
    console.log('data-id: ' + id);
    PW.addToWatchlist(id);
  })

  unInjected.addClass('injected');
}, 1000);

var PWPullInterval = setInterval(function() {
  chrome.runtime.sendMessage({action: 'pull'}, function(latestList) {
    if ('items' in latestList) {
      Object.keys(latestList.items).forEach(id => {
        let item = latestList.items[id];
        PW.watchlist[item.id] = item;
        // render
      })
    }
    console.log(PW.watchlist);
  });
}, 5 * 1000);

