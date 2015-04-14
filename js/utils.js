define(function(require) {
  
    var _ = require('underscore');
  
    var image = function(name){
      return {
        19: 'images/'+name+'-19.png',
        38: 'images/'+name+'-38.png'
      };
    };
  
  
    var addedData = image('added');
    var notAddedData = image('notAdded');
    var notLoadedData = image('notLoaded');
    var rotating = 0;

    var images = [];

    for(var i=1;i<=8;i++){
      images.push(image('loader/'+i));
    }

    return {
      showPocketStatus: function(tabId, added) {
        var icon;
        var title;
        if (added === true){
          icon = addedData;
          title = 'Remove from Pocket';
        } else if (added === false){
          icon = notAddedData;
          title = 'Add to Pocket';
        } else {
          icon = notLoadedData;
          title = 'Take from Pocket is not intalled';
        }
        
        
        chrome.tabs.get(tabId, function(tab) {
          if (!chrome.runtime.lastError && tab){
            chrome.pageAction.setIcon({
                tabId : tabId,
                path  : icon
            });
  
            chrome.pageAction.setTitle({
                tabId : tabId,
                title : title
            });
          }
        });
      },


      startRotating: function(tabId) {
        chrome.tabs.get(tabId, function(tab){
          if (!chrome.runtime.lastError && tab){
            var current = 0;
    
            rotating = setInterval(function(){
              chrome.pageAction.setIcon({tabId : tabId, path : images[current]});
              current = (current + 1) % images.length;
            }, 150);
          }
        });
      },

      stopRotating:function() {
        if (rotating) {
          clearInterval(rotating);
        }
      }
    };
});