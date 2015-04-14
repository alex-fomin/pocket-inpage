require(['js/communicate', 'js/utils'], function(pocket, utils) {
  var map = {};

    var find = function(url){
      return url ? pocket.find(url) : new Promise(function(resolve) { resolve(false); });
    };


  var update = function(tabId, urlBefore, urlAfter) {
    utils.stopRotating();
    chrome.tabs.get(tabId, function(tab){
      var statusBefore;
      var statusAfter;
      if (chrome.runtime.lastError || !tab) {
        statusBefore = Promise.resolve(false);
        statusAfter = statusBefore;
      }
      else {
        chrome.pageAction.show(tabId);
        statusBefore = find(urlBefore);
        statusAfter = urlBefore == urlAfter ? statusBefore :  find(urlAfter);
      }
      Promise.all([statusBefore, statusAfter])
        .then(function(result) {
          var hasBefore = result[0];
          var hasAfter = result[1];
          utils.showPocketStatus(tabId, !!(hasBefore || hasAfter));
          map[tabId] = hasBefore ? urlBefore : urlAfter;
        });
      });
  };

  var successCase = function(){
    chrome.pageAction.onClicked.addListener(function(tab) {
      var url = map[tab.id] || tab.url;
      if (map[tab.id]) {
        delete map[tab.id];
      }
  
      utils.startRotating(tab.id);
  
      pocket.find(url)
        .then(function(item) {
          var deffer = item ? pocket.remove(url) : pocket.add(url);
          return deffer.then(function() {
            return !!item;
          });
        }, 
        utils.stopRotating)
        .then(function(wasAdded) {
          utils.stopRotating();
            utils.showPocketStatus(tab.id, !wasAdded);
        }, utils.stopRotating);
      });
  
    var menuId = chrome.contextMenus.create({
      type: 'normal',
      title: 'Add to Pocket',
      contexts: ["page", "frame", "link"],
      documentUrlPatterns: ["http://*/*", "https://*/*"],
      targetUrlPatterns: ["http://*/*", "https://*/*"],
      onclick: function(info, tab) {
        utils.startRotating(tab.id);
        pocket.add(info.linkUrl || info.pageUrl)
        .then(stopRotating, stopRotating);
      }
    });
  
  
  
    chrome.webNavigation.onBeforeNavigate.addListener(function(a) {
        if (a.frameId === 0) {
            map[a.tabId] = a.url;
            update(a.tabId, a.url);
        }
    });
  
    var afterUpdate = function(a){
        if (a.frameId === 0) {
            var urlBefore = map[a.tabId];
            var urlAfter = a.url;
  
            update(a.tabId, urlBefore, urlAfter);
        }
    };
  
  
    chrome.webNavigation.onCommitted.addListener(afterUpdate);
    chrome.webNavigation.onDOMContentLoaded.addListener(afterUpdate);
    chrome.webNavigation.onCompleted.addListener(afterUpdate);
    
    
  };



  var checkListener = function(a){
    pocket.outerExtensionId().then(function(){
      chrome.webNavigation.onCompleted.removeListener(checkListener);
      chrome.tabs.getCurrent(function(tab){
        if (tab){
          update(tab.id, tab.url);
        }
        successCase();
      });
    }, function(){
      if (a) {
        chrome.pageAction.show(a.tabId);
        utils.showPocketStatus(a.tabId, 'notLoaded');
        chrome.pageAction.setPopup({tabId:a.tabId, popup:'/html/noOutpage.html'});
      }
    });
  };


  chrome.webNavigation.onCompleted.addListener(checkListener);
  checkListener();



});
