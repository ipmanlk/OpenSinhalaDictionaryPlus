'use strict';
var sn2en = null;
var en2sn = null;
var sn2enKeys = [];
var en2snKeys = [];
var selectedWord = null;

// variable for handling back button
var currentPage = null;

// when onsen ui ready
ons.ready(function () {
  init();
});

function init() {
  onsenInit();
  onsenSlideBarInit();
  dbRead();
}

//  onsen ui native code
function onsenInit() {
  ons.disableDeviceBackButtonHandler();
}

function onsenSlideBarInit() {
  // handle slide menu (code from onsen ui)
  window.fn = {};
  window.fn.open = function () {
    var menu = document.getElementById('menu');
    menu.open();
  };
  window.fn.load = function (page) {
    var content = document.getElementById('content');
    var menu = document.getElementById('menu');
    content.load(page)
      .then(menu.close.bind(menu));
  };
}

// asign json data to global en2sn & sn2en objects
function dbLoad(data, db) {
  if (db == "en2sn") {
    en2sn = data;
    en2snKeys = Object.keys(data);
    en2snKeys.sort();
  } else {
    sn2en = data;
    sn2enKeys = Object.keys(data);
    sn2enKeys.sort();
  }
  // hide loading screen if sn2en is not null
  sn2en !== null ? modalLoadingHide() : null;
}

// resolve file system urls and call jsonFileRead
function dbRead() {
  modalLoadingShow("Loading Database");
  var dben2sn = cordova.file.applicationDirectory + "www/db/en2sn.json";
  var dbsn2en = cordova.file.applicationDirectory + "www/db/sn2en.json";
  resolveLocalFileSystemURL(dben2sn, function (fileEntry) {
    jsonFileRead(fileEntry, dbLoad, "en2sn");
  }, dbLoadOnError);
  resolveLocalFileSystemURL(dbsn2en, function (fileEntry) {
    jsonFileRead(fileEntry, dbLoad, "sn2en");
  }, dbLoadOnError);
}

// read .json files uisng file plugin
function jsonFileRead(fileEntry, callback, db) {
  fileEntry.file(function (file) {
    var reader = new FileReader();
    reader.onloadend = function () {
      callback(JSON.parse(this.result), db);
    };
    reader.readAsText(file);
  }, dbLoadOnError);
}

// database read/load error handle
function dbLoadOnError(e) {
  ons.notification.alert("Unable to load the database : " + e).then(function () {
    exitApp();
  });
}


function modalLoadingShow(txt) {
  var modal = $('#modalLoading');
  $("#modalLoadingMsg").text(" " + txt);
  modal.show();
}

function modalLoadingHide() {
  var modal = $('#modalLoading');
  modal.hide();
}

function suggShow(element) {
  $('#listSugg').empty();
  var input = inputClean($(element).val());
  if (!isNullOrEmpty(input)) wordSearch(input);
}

//  use to search for words start with n
function wordSearch(input) {
  var db;
  langDetect(input) == "en2sn" ? db = en2snKeys : db = sn2enKeys;
  // no of suggestions
  var limit = 10;
  var counter = 0;
  for (var i = 0; i < db.length; i++) {
    if (db[i].startsWith(input)) {
      suggListAppend(db[i], "offline");
      counter++;
      if (counter == limit) break;
    }
  }
  // if there are no sugestions prompt for google translate
  if (counter == 0 && onlineCheck()) {
    // clean if there are any online suggestions
    $("#listSugg").empty();
    $("#listSugg").append('<ons-card onclick="gtranslateGet(\'' + input + '\')"><div class="content"><h4>Sorry!. I couldn\'t find anything on that. Click here to get results from online.</h4></div></ons-card>');
  }
}

function meaningShow(input) {
  if (langDetect(input) == "en2sn") {
    meaningShowSn(input);
  } else {
    meaningShowEn(input);
  }
  selectedWord = input;
  currentPage = "def";

  // save history
  historySave(input);
}

function suggListAppend(word, type) {
  // type - word come from online or offline
  var listItem;
  if (type == "offline") {
    listItem = '<ons-card onclick="meaningShow(' + "'" + word + "'" + ')"><div class="content">' + word + '</div></ons-card>';
  } else {
    listItem = '<ons-card onclick="meaningShow(' + "'" + word + "'" + ')"><div class="content">' + word + '<span style="float: right"><ons-icon icon="md-translate"></ons-icon></span></div></ons-card>';
  }
  $('#listSugg').append(listItem);
}

function inputClean(input) {
  return ((input.trim()).toLowerCase());
}

function isNullOrEmpty(input) {
  return jQuery.isEmptyObject(input);
}

// check language
function langDetect(txt) {
  var selectedDb;
  var test = (/^[A-Za-z][\sA-Za-z0-9.\'-]*$/.test(txt));
  test ? selectedDb = "en2sn" : selectedDb = "sn2en";
  return (selectedDb);
}

// tasks not releated to main.html template
function meaningShowSn(input) {
  var content = document.querySelector('ons-splitter-content');
  content.load('./views/snMeaning.html').then(function () {
    $("#title").text(input);
    var meanings = en2sn[input];
    for (var i = 0; i < meanings.length; i++) {
      $('.listMeanings').append("<ons-list-item>" + meanings[i] + '<div class="right"><ons-icon size="20px" onclick="textCopy(this);" icon="md-copy" class="list-item__icon"></ons-icon></div>' + "</ons-list-item>");
    }
    // call for datamuse
    if (onlineCheck()) {
      datamuseGet("def", input, defShowEn);
      datamuseGet("syn", input, synShowEn);
    } else {
      $(".listSynonyms").append("<ons-list-item>You're offline. Please connect to the internet.</ons-list-item>");
      $(".listDefinitions").append("<ons-list-item>You're offline. Please connect to the internet.</ons-list-item>");
    }
  });
}

function meaningShowEn(input) {
  var content = document.querySelector('ons-splitter-content');
  content.load('./views/enMeaning.html').then(function () {
    $("#title").text(input);
    var meanings = sn2en[input];
    for (var i = 0; i < meanings.length; i++) {
      $('.listMeanings').append("<ons-list-item>" + meanings[i] + '<div class="right"><ons-icon size="20px" onclick="textCopy(this);" icon="md-copy" class="list-item__icon"></ons-icon></div>' + "</ons-list-item>");
    }
    if (onlineCheck()) {
      datamuseGet("def", sn2en[input][0], defShowEn);
    } else {
      $(".listDefinitions").append("<ons-list-item>You're offline. Please connect to the internet.</ons-list-item>");
    }
    synShowSn();
  })
}

function defShowEn(data) {
  if (!isNullOrEmpty(data) && data[0].defs) {
    var defs = data[0].defs;
    var def; // definition
    var pos; // part of speech
    for (var i = 0; i < defs.length; i++) {
      pos = defs[i].substr(0, defs[i].indexOf('	'));
      pos = "(" + datamuseExpandPos(pos) + ") ";
      def = defs[i].substr(defs[i].indexOf(' ') + 1);
      $(".listDefinitions").append("<ons-list-item>" + pos + def + "</ons-list-item>");
    }
  } else {
    $(".listDefinitions").append("<ons-list-item>Sorry!. No results found.</ons-list-item>");
  }
}

function synShowEn(syns) {
  if (!isNullOrEmpty(syns)) {
    for (var i = 0; i < syns.length; i++) {
      $(".listSynonyms").append("<ons-list-item>" + syns[i].word + '<div class="right"><ons-icon onclick="TTSspeak(\'' + syns[i].word + '\');" icon="ion-volume-high" class="list-item__icon"></ons-icon></div>' + "</ons-list-item>");
    }
  } else {
    $(".listSynonyms").append("<ons-list-item>Sorry!. No results found.</ons-list-item>");
  }
}

function synShowSn() {
  var enMeaning = (sn2en[selectedWord][0]).trim();
  var snSyns = en2sn[enMeaning];
  if (!isNullOrEmpty(snSyns)) {
    for (var i = 0; i < snSyns.length; i++) {
      $(".listSynonyms").append("<ons-list-item>" + snSyns[i] + "</ons-list-item>");
    }
  } else {
    $(".listSynonyms").append("<ons-list-item>Sorry!. No results found.</ons-list-item>");
  }
}

// expand part of speech
function datamuseExpandPos(pos) {
  var expandedPos;
  switch (pos) {
    case "n":
      expandedPos = "noun";
      break;
    case "v":
      expandedPos = "verb";
      break;
    case "adj":
      expandedPos = "adjective";
      break;
    case "adv":
      expandedPos = "adverb";
      break;
    default:
      expandedPos = "unknown";
      break;
  }
  return (expandedPos);
}

// text to speach plugin
function TTSspeak(input) {
  TTS.speak(input);
}

// Copy to clipboard
function textCopy(element) {
  var text = $(element).parent().parent().text();
  cordova.plugins.clipboard.copy(text);
  toastShow("Text copied to clipboard!");
}

function toastShow(msg) {
  ons.notification.toast(msg, { timeout: 1000, animation: 'ascend' });
}

// about
function aboutShow() {
  $('#modalAbout').show();
}

// online check
function onlineCheck() {
  var networkState = navigator.connection.type;
  var isOffline = (networkState == Connection.NONE) || (networkState == Connection.UNKNOWN);
  return !isOffline;
}

function tabSwitch(id) {
  $("#listMeanings").parent().hide();
  $("#listDefinitions").parent().hide();
  $("#listSynonyms").parent().hide();

  $(id).parent().fadeIn();
}

// report unknown words
function osdpReport(word, meaning) {
  // regex to check if word is not a sentence
  var test = (/^(([\w\d]+)([\s-])([\w\d]+)|([\w\d]+))$/.test(word));
  if (test) {
    var url = "https://osdb.navinda.xyz/api";
    var data = { "action": "word_add", "word": word, "meanings": meaning[0] };

    requestSend(url, "post", data, null, function (data) {
      if (data == 1) toastShow("Word has been reported to the developer!");
    });
  }
}