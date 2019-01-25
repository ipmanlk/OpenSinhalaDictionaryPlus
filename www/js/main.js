'use strict';
var sn2en = null;
var en2sn = null;
var sn2enKeys = {};
var en2snKeys = {};
var selectedWord = null;
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
  } else {
    sn2en = data;
    sn2enKeys = Object.keys(data);
  }
  // hide loading screen if sn2en is not null
  sn2en !== null ? modalLoadingHide() : null;
}

// resolve file system urls and call readJsonFile
function dbRead() {
  modalLoadingShow("Loading Database");
  var dben2sn = cordova.file.applicationDirectory + "www/db/en2sn.json";
  var dbsn2en = cordova.file.applicationDirectory + "www/db/sn2en.json";
  resolveLocalFileSystemURL(dben2sn, function (fileEntry) {
    readJsonFile(fileEntry, dbLoad, "en2sn");
  }, dbLoadOnError);
  resolveLocalFileSystemURL(dbsn2en, function (fileEntry) {
    readJsonFile(fileEntry, dbLoad, "sn2en");
  }, dbLoadOnError);
}

// read .json files uisng file plugin
function readJsonFile(fileEntry, callback, db) {
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
  alert("Unable to load the database : " + e);
}


function modalLoadingShow(txt) {
  var modal = $('#modal-loading');
  $("#modal-loading-msg").text(txt);
  modal.show();
}

function modalLoadingHide() {
  var modal = $('#modal-loading');
  modal.hide();
}

function suggShow(element) {
  $('#listSuggM').empty();
  var input = inputClean($(element).val());
  if (!inputNullOrEmpty(input)) wordSearch(input);
}

//  use to search for words start with n
function wordSearch(input) {
  var db;
  langDetect(input) == "en2sn" ? db = en2snKeys : db = sn2enKeys;
  // sort db
  db.sort();
  // no of suggestions
  var limit = 10;
  var counter = 0;
  for (var i = 0; i < db.length; i++) {
    if (db[i].startsWith(input)) {
      suggListAdd(db[i]);
      counter++;
      if (counter == limit) break;
    }
  }
}

function meaningShow(input) {
  if (langDetect(input) == "en2sn") {
    snDefShow(input);
  } else {
    enDefShow(input);
  }
  selectedWord = input;
}

function suggListAdd(word) {
  var listItem = '<ons-card onclick="meaningShow(' + "'" + word + "'" + ')"><div class="content">' + word + '</div></ons-card>';
  $('#listSuggM').append(listItem);
}

function inputClean(input) {
  return ((input.trim()).toLowerCase());
}

function inputNullOrEmpty(input) {
  return jQuery.isEmptyObject(input);
}

// check language
function langDetect(txt) {
  var selectedDb;
  var test = (/^[A-Za-z][A-Za-z0-9.-]*$/.test(txt));
  test ? selectedDb = "en2sn" : selectedDb = "sn2en";
  return (selectedDb);
}

// tasks not releated to main.html template
function snDefShow(input) {
  var content = document.querySelector('ons-splitter-content');
  content.load('snDef.html').then(function () {
    $("#titleSd").text(input);
    var meanings = en2sn[input];
    for (var i = 0; i < meanings.length; i++) {
      $('#listSnMeanSd').append("<ons-list-item>" + meanings[i] + "</ons-list-item>");
    }
    datamuseGet("def", input, enDefFill);
    datamuseGet("syn", input, enSynFill);
  })
}


function enDefShow(input) {
  var content = document.querySelector('ons-splitter-content');
  content.load('enDef.html').then(function () {
    $("#titleEd").text(input);
    var meanings = sn2en[input];
    for (var i = 0; i < meanings.length; i++) {
      $('#listEnMeanEd').append("<ons-list-item>" + meanings[i] + "</ons-list-item>");
    }
    datamuseGet("def", sn2en[input][0], enDefFill);
    datamuseGet("syn", sn2en[input][0], enSynFill);
  })
}

function enDefFill(data) {
  var defs = data[0].defs;
  var def; // definition
  var pos; // part of speech
  for (var i = 0; i < defs.length; i++) {
    pos = defs[i].substr(0, defs[i].indexOf('	'));
    pos = "(" + datamuseExpandPos(pos) + ") ";
    def = defs[i].substr(defs[i].indexOf(' ') + 1);
    $(".listEnDef").append("<ons-list-item>" + pos + def + "</ons-list-item>");
  }
}

function enSynFill(syns) {
  for (var i = 0; i < syns.length; i++) {
    $(".listEnSyn").append("<ons-list-item>" + syns[i].word + '<div class="right"><ons-icon onclick="TTSspeak(\'' + syns[i].word + '\');" icon="ion-volume-high" class="list-item__icon"></ons-icon></div>' + "</ons-list-item>");
  }
}

// datamuse api calls
function datamuseGet(type, word, callback) {
  var url;
  if (type == "def") {
    url = "http://api.datamuse.com/words?max=1&md=d&sp=" + word;
  } else {
    url = "https://api.datamuse.com/words?max=10&rel_syn=" + word;
  }
  $.get(url, function (data) {
    callback(data);
  }, 'json');
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
  return(expandedPos);
}

// text to speach plugin
function TTSspeak(input) {
  TTS.speak(input);
}