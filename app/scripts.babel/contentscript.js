'use strict';

var PW = {
  watchlistDiv: `
    <div class="watchlist">
      <div class="watchlist-header">
      <span>Watchlist</span>
      </div>
      <div class="watchlist-content">
        <ul>
        </ul>
      </div>
    </div>
  `,

  copyToClipboard: str => {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  },

  renderItem: item => `
  <li data-id="${item.id}"> 
    <a title="${atob(item.item.extended.text)}" target="_blank">${item.item.name}</a>
    ${item.listing.account.online === null ? 
      '<span class="status status-offline">offline</span>' : 
        (item.listing.account.online.status === 'afk' ? 
          '<span class="status status-away">AFK</span>' : '<span class="status status-online">online</span>')}
    <a target="_blank" class="whisper-btn" message="${item.listing.whisper}">Whisper</a>
    <a target="_blank" class="rm-btn">Remove</a>
  </li>
  `,

  addBtnSrc: `
    <a role="button" target="_blank" class="btn btn-default pm-btn watch-btn">Save</a>
  `,

  addToWatchlist: function(id) {
    chrome.runtime.sendMessage({action: 'add', data: id}, function(response) {
      console.log('response: \n');
      console.log(response);
    });
  },

  removeFromWatchlist: id => {
    chrome.runtime.sendMessage({action: 'delete', data: id}, function(response) {
      console.log('response: \n');
      console.log(response);
    });
  }
}


$(PW.watchlistDiv).insertAfter($('#app .language-select'));
$('body').on('click', '.watchlist-header', function() {
  console.log('clicked!');
  if (!$('.watchlist-content').hasClass('active')) {
    console.log('activate watchlist!');
    $('.watchlist-content').addClass('active');
  } else {
    $('.watchlist-content').removeClass('active');
  }
});

$('body').on('click', '.watchlist-content .rm-btn', function(event) {
  let id = $(event.target).parents('li').attr('data-id');
  console.log('remove: ' + id);
  PW.removeFromWatchlist(id);
  $(event.target).parents('li').remove();
});

$('body').on('click', '.watchlist-content .whisper-btn', function(event) {
  PW.copyToClipboard($(event.target).attr('message'));
  $('.watchlist-content .whisper-btn').html('Whisper');
  $(event.target).html('Copied!');
});

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
      let ids = Object.keys(latestList.items);
      if (ids.length > 0) {
        $('.watchlist-content ul').html(
          ids.map(id => latestList.items[id]).map(PW.renderItem).join('\n')
        )
      }
    }
  });
}, 5 * 1000);

