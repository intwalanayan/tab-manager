function tabHelper(){
  var tabs = chrome.tabs;

  // tab level function
  // 1. create/view/open
  // 2. remove
  // 3. archive

  // view tab
  var open = function(tabData, options){
    var tabProperties = (options || {});
    tabProperties["url"] = tabData.url;
    tabs.create(tabProperties, function(tab){
      console.log("Opened Tab for ", tabData.url);
    });
  };

  // view multiple tabs at once
  var openList = function(tabList){
    console.log("Opening tab list for ", tabList);
    for(var i=0; i<tabList.length; i++){
        open(tabList[i], {});
    }
  };

  // close open browser tabs by id
  var remove = function(tabIds){
    tabs.remove(tabIds, function(result){
      console.log("Closed tabIds : ", tabIds);
      for(var i=0; i<tabIds.length; i++){
        $('#tabList .te[data-tabId=' + tabIds[i] + ']').remove();
      }
    });
  };


  // tab manager shortcut handler utilities
  // 1. reload tab
  // 2. mark as active tab
  // 3. pin/unpin tab
  // 4. go backward/forward in history for tab

  // reloading existing tab
  var reload = function(tabId){
    tabs.reload(tabId, {}, function(){
      console.log("reloading complete for tabId : ", tabId);
    });
  }

  // mark tab as active
  var activate = function(tabId, options){
    var updateProperties = {};
    updateProperties["active"] = true;
    if(options && options.url){
      updateProperties['url'] = options.url;
    }
    tabs.update(tabId, updateProperties, function(data){
      console.log("active tab changed to tabId : ", tabId);
      if(options.reload){
        reload(tabId);
      }
    });
  }

  // pin/unpin active tab
  var togglePin = function(tabId, currentStatus){
    tabs.update(tabId, {pinned: !currentStatus}, function(data){
      if(!currentStatus){
        console.log("Pinned tab id : ", tabId);
      }else{
        console.log("Unpinned tab id : ", tabId);
      }
    });
  };

  // browser back
  var back = function(tabId){
    tabs.goBack(tabId, function(){
      console.log("Browser back complete for tabId : ", tabId);
    });
  }

  // browser forward
  var forward = function(tabId){
    tabs.goForward(tabId, function(){
      console.log("Browser foward complete for tabId : ", tabId);
    });
  }

  // helper functions
  var getTabEntry = function(tabElement){
    var data = {};
    data["title"] = $('.tabTitle', tabElement).html();
    data["url"] = $('.tabUrl', tabElement).html();
    data["id"] = $(tabElement).attr("data-tabId");
    return data;
  };

  // mark given tab as active tab
  var selectTab = function(tabId, newUrl){
    var options = {};
    if(!!newUrl){
      options["url"] = newUrl;
      options["reload"] = (window.location.href == newUrl);
    }
    activate(tabId,options);
  };

  // shortcut helper
  var execute = function(command){
    tabs.query({}, function(tabList){
      var activeTabIndex, tempIndex;
      for(var i=0; i < tabList.length; i++){
        if(tabList[i].active){
          activeTabIndex = i;
          break;
        }
      }

      if(command == "right-tab"){
        var rightTabIndex = (activeTabIndex < tabList.length - 1 ? (activeTabIndex + 1) : 0);
        selectTab(tabList[rightTabIndex].id);
      }else if(command == "left-tab"){
        var leftTabIndex = (activeTabIndex > 0 ? (activeTabIndex - 1) : tabList.length - 1);
        selectTab(tabList[leftTabIndex].id);
      }else if(command == "pin-tab"){
        togglePin(tabList[activeTabIndex].id, false);
      }else if(command == "unpin-tab"){
        togglePin(tabList[activeTabIndex].id, true);
      }else if(command == "go-back"){
        back(tabList[activeTabIndex].id);
      }else if(command == "go-next"){
        forward(tabList[activeTabIndex].id);
      }else{
        console.log("Please add handling of command in background.js");
      }
    });
  };

  // given list, populate in tab listing
  var populateTabData = function(tabList) {
      if($('#tabList').length == 0){
        return;
      }
      $('#tabList').empty();
      for(var i = 0; i < tabList.length; i++){
          currentTab = tabList[i];
          var tab_url = currentTab.url;
          var tab_title = currentTab.title;
          var tabEntry = $(".tabEntry").clone().removeClass("d-none").removeClass("tabEntry").attr("data-tabId", (currentTab.id || i));
          $(".tabTitle", tabEntry).html(tab_title);
          $(".tabUrl", tabEntry).html(tab_url);
          $(".form-check-input", tabEntry).attr("id", i)
          $('#tabList').append(tabEntry);
      }
  };

  // create open tab listing
  var populateOpenTabsInView = function(){
    tabs.query({},function(tabList){
      tabList = tabList.filter(function(val, index) {
        return (!window.tabman.isInternalUrl(val.url));
      });
      populateTabData(tabList);
    });
  };

  var openPage = function(pageUrl, baseUrl){
    tabs.query({},function(tabList){
      var data;
      for(var i=0; i<tabList.length; i++){
        if(tabList[i].url.indexOf(baseUrl) > -1){
          data = tabList[i];
          break;
        }
      }
      if(data){
        if(pageUrl == data.url){
          selectTab(data.id);
        }else{
          selectTab(data.id, pageUrl);
        }
      }else{
        open({ url: pageUrl, active: true });
      }
    });
  }

  return {
    open: open,
    openList: openList,
    remove: remove,
    selectTab: selectTab,
    openInternalPage: openPage,
    getTabEntry: getTabEntry,
    populateTabDataInView: populateTabData,
    populateOpenTabsInView: populateOpenTabsInView,
    execute: execute
  }
};
