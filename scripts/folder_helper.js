function folderHelper(folderName, storage, preferences, tab){
  var self = this;
  var dataLoaded = false;
  var DEFAULT_FOLDER_KEY = "default_folder";
  var DEFAULT_FOLDER_NAME = preferences.get(DEFAULT_FOLDER_KEY) || "default";
  var FOLDER_LIST_KEY = 'folderList';
  var existingFolderList = [];
  var currentFolderName;
  var clickedElement;   // element on which click action was performed

  // folder level actions
  // 1. create
  // 2. view
  // 3. remove
  // 4. rename
  // 5. viewAllTabs

  // new folder creation handler
  this.create = function(folderName, options){
    showButtonLoader(clickedElement);
    var overlayId = "newFolderOverlayModal";
    if(folderName == ""){
      showErrorMessage(overlayId, "Please enter folder name.");
    }else if((existingFolderList.indexOf(folderName) > -1) || (folderName == DEFAULT_FOLDER_NAME)){
      showErrorMessage(overlayId, "Folder already exists.");
    }else{
      existingFolderList.push(folderName);
      var dataObject = {};
      dataObject[FOLDER_LIST_KEY] = existingFolderList;
      storage.set(dataObject, function() {
        console.log( 'New folder list is ', existingFolderList);
        addFolderInView(folderName);
        hideButtonLoader(clickedElement);
        console.log( 'New folder added to left navigation');
        resetOverlayForm(overlayId);
      });
    }
  };

  // view archived folder's tab listing
  this.view = function(folderName, options){
    options = options || {};
    window.tabman.viewFolderTabs(folderName);
  };

  // remove folder from list and its tab content from storage
  this.remove = function(folderName){
    showButtonLoader(clickedElement);
    removeFolderFromView(folderName);
    storage.remove(folderName, function(){
      console.log("Folder's tab content deleted for : ", folderName);
      existingFolderList = existingFolderList.filter(function(val, index) {
        return (val !== folderName);
      });
      updateFolderList(existingFolderList);
      if(folderName == currentFolderName){
        self.view(DEFAULT_FOLDER_NAME);
      }
    });
  };

  // rename folder name to something new
  this.rename = function(oldFolderName, newFolderName){
    showButtonLoader(clickedElement);
    updateCurrentFolder(newFolderName);
    storage.get(oldFolderName, function(result){
      var dataObject = {};
      dataObject[newFolderName] = result[oldFolderName] || [];
      storage.set(dataObject, function(){
        console.log("Copied content from " + oldFolderName + " to " + newFolderName);
        self.remove(oldFolderName);
        self.create(newFolderName);
        self.view(newFolderName);
      });
    });
  };

  this.updateFolderTabs = function(folderName, tabList, updateCallback){
    var dataObject = {};
    dataObject[folderName] = tabList;
    storage.set(dataObject, function(){
      console.log("Emptied folder content for : ", folderName);
      if(updateCallback){
        updateCallback();
      }
    });
  }

  this.clear = function(folderName){
    var clearCallback = function(){
      if(currentFolderName == folderName){
        $('#tabList').html('');
      }
    };
    self.updateFolderTabs(folderName, [], clearCallback);
  };

  // helper utilities
  // ===========================================

  // adds new folder entry in view
  var addFolderInView = function(folderName){
    var folderEntry = $(".folderEntry").clone().attr("data-name", folderName).removeClass("d-none").removeClass("folderEntry").attr("data-folder", folderName);
    $(".folderName", folderEntry).html(folderName);
    $('#folderList').append(folderEntry);

    var customFolderRadioElem = $(".customFolderRadio").clone().attr("data-name", folderName).removeClass("d-none").removeClass("customFolderRadio");
    $("input", customFolderRadioElem).attr("value", folderName);
    $("label", customFolderRadioElem).html(folderName);
    $('#customFolderForm').append(customFolderRadioElem);

    if($('#defaultFolderSelect').length > 0){
      var option = '<option value="' + folderName + '">' + folderName + '</option>'
      $('#defaultFolderSelect').append(option);
    }
  };

  // remove folder entry from view
  var removeFolderFromView = function(folderName){
    $('#fe[data-name="'+folderName+'"]').remove();
    $('#newFolderOverlayModal .customFolderRadio[data-name="'+folderName+'"]').remove();
  };

  // open all folder tabs
  this.openFolderTabs = function(folderName, options){
    showButtonLoader(clickedElement);
    storage.get(folderName, function(result) {
      var tabList = (result[folderName] || []);
      tab.openList(tabList);
      if(options.clearFolderOnOpen){
        self.clear(folderName);
      }
      hideButtonLoader(clickedElement);
    });
  };



  // selected archived tabs level actions
  // 1. addTabs
  // 2. removeTabs
  // 3. moveTabs
  // 4. viewTabs

  // add selected tabs to archive folder
  this.addTabs = function(folderName, options){
    showButtonLoader(clickedElement);
    var newTabs = self.getSelectedTabList();
    console.log("folder name : ", folderName);
    console.log("new tabs : ", newTabs);

    storage.get(folderName, function(result) {

      var existingTabList = (result[folderName] || []);
      console.log("Existing tab list : ", existingTabList);
      var urls = [];
      var tabIds = [];
      for(var i=0; i < existingTabList.length; i++){
        urls.push(existingTabList[i].url);
      }

      for(var i=0; i<newTabs.length; i++){
        if(urls.indexOf(newTabs[i].url) == -1){
          tabIds.push(parseInt(newTabs[i].id));
          delete newTabs[i]['id'];
          existingTabList.push(newTabs[i]);
        }
      }
      console.log("Final tab list : ", existingTabList);
      var updateCallback = function(){
        if(options && options.closeTabOnAdd){
          tab.remove(tabIds);
        }
      };
      self.updateFolderTabs(folderName, existingTabList, updateCallback);
      hideButtonLoader(clickedElement);
      $('#defaultArchiveOverlayModal').modal("hide");
      $('#customArchiveOverlayModal').modal("hide");
    });
  };

  // remove selected tabs from archive folder
  this.removeTabs = function(folderName){
    showButtonLoader(clickedElement);
    var tabsToDelete = self.getSelectedTabList();
    console.log("folder name : ", folderName);
    console.log("tabs to delete : ", tabsToDelete);

    storage.get(folderName, function(result) {
      var tabUrls = [];
      var deletedIndex = [];
      for(var i=0; i < tabsToDelete.length; i++){
        tabUrls.push(tabsToDelete[i].url);
      }
      var tabList = (result[folderName] || []);
      console.log("Existing tab list : ", tabList);
      var finalTabList = [];
      for(var i=0; i<tabList.length; i++){
        if(tabUrls.indexOf(tabList[i].url) == -1){
          finalTabList.push(tabList[i]);
        }else{
          deletedIndex.push(i);
        }
      }
      console.log("Final tab list : ", finalTabList);
      var updateCallback = function(){
        console.log("Tablist updated for folder : ", folderName);
        for(var i=0; i<deletedIndex.length; i++){
          $('#tabList .te[data-tabId=' + deletedIndex[i] + ']').remove();
        }
        console.log("removed restored tabs from view.")
      };
      self.updateFolderTabs(folderName, finalTabList, updateCallback);
    });
    hideButtonLoader(clickedElement);
  };

  // move selected tab from source to destinaton folder
  this.moveTabs = function(oldFolderName, newFolderName){
    showButtonLoader(clickedElement);
    self.addTabs(newFolderName);
    self.removeTabs(oldFolderName);
    hideButtonLoader(clickedElement);
    resetOverlayForm('moveTabsOverlayModal');
  };

  // reopen selected tabs
  this.reopenTabs = function(options){
    showButtonLoader(clickedElement);
    var tabList = self.getSelectedTabList();
    tab.openList(tabList);
    if(options && options.clearFolderOnOpen){
      self.removeTabs(currentFolderName);
    }
    hideButtonLoader(clickedElement);
  }

  var loadFolderList = function(){
    storage.get(FOLDER_LIST_KEY, function(result){
      dataLoaded = true;
      existingFolderList = (result[FOLDER_LIST_KEY] || []);
      console.log('Existing folder list is ', existingFolderList);
      if(window.tabman.pageId){
        if(currentFolderName == DEFAULT_FOLDER_NAME || currentFolderName == "default"){
          $('#deleteFolder').remove();
          $('#renameFolderViaModal').remove();  
        }
        self.populateFolderListInView();
      }
    });
  };

  var updateFolderList = function(folderList){
    var dataObject = {};
    dataObject[FOLDER_LIST_KEY] = folderList;
    storage.set(dataObject, function(){
      console.log("Folder list updated in storage as ", folderList);
    });
  };

  // other utilities
  // =====================================================

  // allow user to set default folder
  this.updateDefaultFolder = function(folderName){
    DEFAULT_FOLDER_NAME = folderName;
    preferences.set(DEFAULT_FOLDER_KEY, folderName);
  }

  this.getDefaultFolder = function(){
    return DEFAULT_FOLDER_NAME;
  }

  // update current folder
  var updateCurrentFolder = function(folderName){
    currentFolderName = folderName;
    $('#renameFolderOverlayModal #curFolderName').html(folderName);
  };

  // add folders in view wherever necessary
  this.populateFolderListInView = function(){
    $('#folderList').html('');
    addFolderInView('default');
    for(var i=0; i<existingFolderList.length; i++){
      addFolderInView(existingFolderList[i]);
    }
    markFolderActive(currentFolderName);
  };

  // add folder tabs in tab listing view
  this.populateFolderTabsInView = function(folderName){
    storage.get(folderName, function(result) {
      var tabList = (result[folderName] || []);
      console.log("Existing tab list for " + folderName + ' : ', tabList);
      tab.populateTabDataInView(tabList);
    });
  };

  // get data regarding all selected tab from listing
  this.getSelectedTabList = function(){
    var selectedTabChecks = $('#tabList .form-check-input:checked');
    var selectedTabIndexs = [];
    for(var i=0; i < selectedTabChecks.length; i++){
      selectedTabIndexs.push(parseInt(selectedTabChecks[i].id));
    }
    var tabList = [];
    var allTabs = $('#tabList .te');
    for(var i=0; i < allTabs.length; i++){
      if(selectedTabIndexs.indexOf(i) > -1){
          tabList.push(tab.getTabEntry(allTabs[i]));
      }
    }
    console.log("Archiving below tabs to default archive folder.");
    console.log(tabList);
    return tabList;
  };

  var hookEvents = function(){

    // complete folder level actions

    $(document).on('click', '#newFolderSubmit', function(e){
      clickedElement = this;
      var newFolderName = $('#folderName').val();
      self.create(newFolderName, {});
    });

    $(document).on('click', '#folderList .btn', function(e){
      clickedElement = this;
      var folderName = $('.folderName', clickedElement).html();
      self.view(folderName, {reload: true});
    });

    $(document).on('click', '#deleteFolder', function(e){
      clickedElement = this;
      self.remove(currentFolderName);
    });

    $(document).on('click', '#renameFolder', function(e){
      clickedElement = this;
      var newFolderName = $('#destinationFolderName').val();
      self.rename(currentFolderName, newFolderName);
    });

    $(document).on('click', '#reopenFolder', function(e){
      clickedElement = this;
      self.openFolderTabs(currentFolderName, { clearFolderOnOpen: false});
    });

    $(document).on('click', '#reopenRemoveFolder', function(e){
      clickedElement = this;
      self.openFolderTabs(currentFolderName, { clearFolderOnOpen: true});
    });


    // selective folder tabs level actions
    $(document).on('click', '#defaultArchiveSubmit', function(e){
      clickedElement = this;
      self.addTabs(DEFAULT_FOLDER_NAME);
    });

    // enable archive to custom folder button on selecting custom folder
    $(document).on('click', '#customArchiveOverlayModal .form-check-input', function(e){
      $('#customArchiveSubmit').prop('disabled', false);
    });

    $(document).on('click', '#customArchiveSubmit', function(e){
      clickedElement = this;
      var selectedFolderName = $('#customFolderForm .form-check-input:checked').val();
      if(selectedFolderName){
        self.addTabs(selectedFolderName);
      }
    });

    $(document).on('click', '#deleteTabs', function(e){
      clickedElement = this;
      self.removeTabs(currentFolderName);
    });

    // enable archive to custom folder button on selecting custom folder
    $(document).on('click', '#moveTabsOverlayModal .form-check-input', function(e){
      $('#moveTabs').prop('disabled', false);
    });

    $(document).on('click', '#moveTabs', function(e){
      var newFolderName = $('#moveTabsOverlayModal .form-check-input:checked').val();
      self.moveTabs(currentFolderName, newFolderName);
    });

    $(document).on('click', '#reopenTabs', function(e){
        clickedElement = this;
        self.reopenTabs({clearFolderOnOpen: false});
    });

    $(document).on('click', '#reopenRemoveTabs', function(e){
      clickedElement = this;
      self.reopenTabs({clearFolderOnOpen: true});
    });

    $(document).on('change', '#defaultFolderSelect', function(e){
      clickedElement = this;
      var newDefaultFolder = $('#defaultFolderSelect').val();
      self.updateDefaultFolder(newDefaultFolder);
    });
  };

  var init = function(){
    updateCurrentFolder(folderName);
    loadFolderList();
    hookEvents();
  }
  init();
};
