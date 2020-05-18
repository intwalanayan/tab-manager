var showErrorMessage = function(overlayId, errorMessage){
  $('#' + overlayId + ' .invalid-feedback').addClass('d-block').html(errorMessage);
};

var hideErrorMessage = function(overlayId){
  $('#' + overlayId + ' .invalid-feedback').removeClass('d-block');
};

var showButtonLoader = function(btnElem){
  $('.spinner-border', btnElem).removeClass('d-none');
  this.disabled = true;
};

var hideButtonLoader = function(btnElem){
  $('.spinner-border', btnElem).addClass('d-none');
  this.disabled = false;
};

var markFolderActive = function(folderName){
  var folderRow= $('.fe[data-folder="' + folderName + '"]');
  $('.btn', folderRow).removeClass("btn-outline-purple").addClass("btn-purple");
};

var markFolderStale = function(folderName){
  var folderRow= $('.fe[data-folder="' + folderName + '"]');
  $('.btn', folderRow).addClass("btn-outline-purple").removeClass("btn-purple");
};

var resetOverlayForm = function(overlayId){
  $('#' + overlayId).modal("hide");
  $('#' + overlayId + ' .form-control').val();
  $('#' + overlayId + ' .form-control').val();
  hideErrorMessage(overlayId);
};

$(document).ready(function(e){
  window.tabman = window.tabman || new tabManager();
});
