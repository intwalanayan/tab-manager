function tabManager(){
  var EXTENSION_BASE_URL = chrome.extension.getURL("");
  var folder = {};
  var tab = {};

  var pageId;
  var OPENTAB_PAGE = "manageOpenTabs";
  var ARCHIVEDTAB_PAGE = "manageArchivedTabs";
  var SETTINGS_PAGE = "settings";

  var storage = (function(){
    var storageHandler = chrome.storage.sync;

    var get = function(keys, callback){
      storageHandler.get(keys, callback);
    };

    var set = function(keyValueObject, callback){
      storageHandler.set(keyValueObject, callback);
    };
    var remove = function(key, callback){
      storageHandler.remove(key, callback);
    };
    var clear = function(callback){
      storageHandler.clear(callback);
    };

    return {
      get: get,
      set: set,
      remove: remove,
      clear: clear
    }
  })();

  var preferences = (function(){
    var storage_key = "tm_settings";
    var data = {};
    var get = function(option_key){
      return data[option_key];
    };
    var set = function(option_key, option_val){
      data[option_key] = option_val;
      var obj = {};
      obj[storage_key] = data;
      storage.set(obj, function(){
        console.log("Successfully updated settings for ", obj);
      });
    };
    var loadPreferenceFromStorage = function(callback){
      storage.get(preferences.STORAGE_KEY, function(result){
        for(key in result[preferences.STORAGE_KEY]){
          preferences.set(key, result[preferences.STORAGE_KEY][key]);
          if(callback){
            callback();
          }
        }
      });
    };
    return {
      STORAGE_KEY: storage_key,
      get: get,
      set: set,
      load: loadPreferenceFromStorage
    };
  })();

  var isInternalUrl = function(url){
    if(url && ((url.indexOf('chrome-extension://') > -1) || (url.indexOf('chrome://extensions/') > -1) || (url.indexOf(EXTENSION_BASE_URL) > -1))){
      return true;
    }else{
      return false;
    }
  };

  var getPageUrlByPageId = function(pageId, folderName) {
    if(pageId == OPENTAB_PAGE){
      return chrome.extension.getURL("views/manage_open_tabs.html");
    }else if(pageId == ARCHIVEDTAB_PAGE){
      return chrome.extension.getURL("views/manage_archived_tabs.html?archiveFolderName=" + folderName);
    }else{
      return chrome.extension.getURL("views/options.html");
    }
  };

  var viewOpenTabs = function(){
    tab.openInternalPage(getPageUrlByPageId(OPENTAB_PAGE), EXTENSION_BASE_URL);
  };

  var viewFolderTabs = function(folderName){
    tab.openInternalPage(getPageUrlByPageId(ARCHIVEDTAB_PAGE, folderName), EXTENSION_BASE_URL);
  };

  var viewPreferences = function(){
    tab.openInternalPage(getPageUrlByPageId(SETTINGS_PAGE), EXTENSION_BASE_URL);
  };

  var hookEvents = function(){
    $(document).on('click', '#tabManagerActions .nav-link', function(e){
        pageId = $(this).attr('data-pageId');
        var pageUrl = getPageUrlByPageId(pageId, folder.getDefaultFolder());
        tab.openInternalPage(pageUrl, EXTENSION_BASE_URL);
    });

    $(document).on('click', '#tabList .form-check-input', function(e){
      e.stopPropagation();
      var buttons = $('#tabActionList .btn');
      var disableFlag = ($('.form-check-input:checked').length == 0);
      for(var i=0; i < buttons.length; i++){
        buttons[i].disabled = disableFlag;
      }
    });

    $(document).on('click', '#tabList .te', function(e){
      $('.form-check-input', this).click();
    })
  };

  var initView = function(folderName){
    if(pageId == SETTINGS_PAGE){
      // settings page
    }else if(pageId == ARCHIVEDTAB_PAGE){
      folder.populateFolderTabsInView(folderName);
    }else{
      tab.populateOpenTabsInView();
    }
  };

  var init = function(){
    pageId = $('#tabManagerActions .nav-link.active').attr("data-pageId") || OPENTAB_PAGE;
    var params = new URLSearchParams(window.location.search);
    var folderName = params.get("archiveFolderName") || "default";

    var callback = function(){
      hookEvents();
      tab = new tabHelper();
      folder = new folderHelper(folderName, storage, preferences, tab);
      initView(folderName);
    };
    preferences.load(callback);
  };

  init();

  return {
    pageId: pageId,
    preferences: preferences,
    storage: storage,
    tab: tab,
    folder: folder,
    viewOpenTabs: viewOpenTabs,
    viewFolderTabs: viewFolderTabs,
    viewPreferences: viewPreferences,
    isInternalUrl: isInternalUrl
  };
};
