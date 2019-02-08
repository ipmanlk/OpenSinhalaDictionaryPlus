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
  alert("Unable to load the database : " + e);
}


function modalLoadingShow(txt) {
  var modal = $('#modalLoading');
  $("#modalLoadingMsg").text(txt);
  modal.show();
}

function modalLoadingHide() {
  var modal = $('#modalLoading');
  modal.hide();
}

function suggShow(element) {
  $('#listSuggM').empty();
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
      suggListAdd(db[i], "offline");
      counter++;
      if (counter == limit) break;
    }
  }
  // if there are no sugestions prompt for google translate
  if (counter == 0 && onlineCheck()) {
    // clean if there are any online suggestions
    $("#listSuggM").empty();
    $("#listSuggM").append('<ons-card onclick="gtranslateGet(\'' + input + '\')"><div class="content"><h4>Sorry!. I couldn\'t find anything on that. Click here to get results from online.</h4></div></ons-card>');
  }
}

function meaningShow(input) {
  if (langDetect(input) == "en2sn") {
    snDefShow(input);
  } else {
    enDefShow(input);
  }
  selectedWord = input;
  currentPage = "def";
}

function suggListAdd(word, type) {
  // type - word come from online or offline
  var listItem;
  if (type == "offline") {
    listItem = '<ons-card onclick="meaningShow(' + "'" + word + "'" + ')"><div class="content">' + word + '</div></ons-card>';
  } else {
    listItem = '<ons-card onclick="meaningShow(' + "'" + word + "'" + ')"><div class="content">' + word + '<span style="float: right"><ons-icon icon="md-translate"></ons-icon></span></div></ons-card>';
  }
  $('#listSuggM').append(listItem);
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
function snDefShow(input) {
  var content = document.querySelector('ons-splitter-content');
  content.load('snDef.html').then(function () {
    $("#titleSd").text(input);
    var meanings = en2sn[input];
    for (var i = 0; i < meanings.length; i++) {
      $('#listSnMeanSd').append("<ons-list-item>" + meanings[i] + '<div class="right"><ons-icon size="20px" onclick="textCopy(\'' + meanings[i] + '\');" icon="md-copy" class="list-item__icon"></ons-icon></div>' + "</ons-list-item>");
    }
    // call for datamuse
    if (onlineCheck()) {
      datamuseGet("def", input, enDefFill);
      datamuseGet("syn", input, enSynFill);
    }
  })
}

function enDefShow(input) {
  var content = document.querySelector('ons-splitter-content');
  content.load('enDef.html').then(function () {
    $("#titleEd").text(input);
    var meanings = sn2en[input];
    for (var i = 0; i < meanings.length; i++) {
      $('#listEnMeanEd').append("<ons-list-item>" + meanings[i] + '<div class="right"><ons-icon size="20px" onclick="textCopy(\'' + meanings[i] + '\');" icon="md-copy" class="list-item__icon"></ons-icon></div>' + "</ons-list-item>");
    }
    datamuseGet("def", sn2en[input][0], enDefFill);
    snSynFill();
  })
}

function enDefFill(data) {
  if (!isNullOrEmpty(data)) {
    var defs = data[0].defs;
    var def; // definition
    var pos; // part of speech
    for (var i = 0; i < defs.length; i++) {
      pos = defs[i].substr(0, defs[i].indexOf('	'));
      pos = "(" + datamuseExpandPos(pos) + ") ";
      def = defs[i].substr(defs[i].indexOf(' ') + 1);
      $(".listEnDef").append("<ons-list-item>" + pos + def + "</ons-list-item>");
    }
    $('.listEnDef').parent().fadeIn();
  }
}

function enSynFill(syns) {
  if (!isNullOrEmpty(syns)) {
    for (var i = 0; i < syns.length; i++) {
      $(".listEnSyn").append("<ons-list-item>" + syns[i].word + '<div class="right"><ons-icon onclick="TTSspeak(\'' + syns[i].word + '\');" icon="ion-volume-high" class="list-item__icon"></ons-icon></div>' + "</ons-list-item>");
    }
    $('.listEnSyn').parent().fadeIn();
  }
}

function snSynFill() {
  var enMeaning = (sn2en[selectedWord][0]).trim();
  var snSyns = en2sn[enMeaning];
  if (!isNullOrEmpty(snSyns)) {
    for (var i = 0; i < snSyns.length; i++) {
      $(".listSnSyn").append("<ons-list-item>" + snSyns[i] + "</ons-list-item>");
    }
    $('.listSnSyn').parent().fadeIn();
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

  requestSend(url, "get", null, null, callback);
}

// google translate api calls
function gtranslateGet(input) {
  modalLoadingShow("Getting results...");
  var url = "http://s1.navinda.xyz:3000/osdp?word=" + input;
  $("#listSuggM").empty();

  function output(stringData) {
    // parse string data
    var data = JSON.parse(stringData);
    // check if data is not null & meaning is correct
    if (!isNullOrEmpty(data) && (langDetect(input) !== langDetect(data))) {
      // add meaning to global objects
      if (langDetect(input) == "en2sn") {
        en2sn[input] = data;
        en2snKeys.push(input);
        en2snKeys.sort();
      } else {
        sn2en[input] = data;
        sn2enKeys.push(input);
        sn2enKeys.sort();
      }
      suggListAdd(input, "online");
      modalLoadingHide();
      // send report to dev
      osdpReport(input, data);
    } else {
      modalLoadingHide();
      ons.notification.alert("Your input is incorrect!. Please check for spelling mistakes.");
    }
  }

  requestSend(url, "get", null, input, output);
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
function textCopy(text) {
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

// report unknown words
function osdpReport(word, meaning) {
  // regex to check if word is not a sentence
  var test = (/^(([\w\d]+)([\s-])([\w\d]+)|([\w\d]+))$/.test(word));
  if (test) {
    var url = "https://www.navinda.xyz/osdb/api/";
    var data = { "action": "word_add", "word": word, "meanings": meaning[0] };

    requestSend(url, "post", data, null, function (data) {
      if (data == 1) toastShow("Word has been reported to the developer!");
    });
  }
}

function requestSend(url, type, data, input, callback) {
  // url = request url
  // type = request type
  // data = data to be send
  // input = input word by the user 
  // callback = function to run after success 
  $.ajax({
    url: url,
    type: type,
    data: data,
    timeout: 30000,
    success: function (data) {
      callback(data);
    },
    error: function () {
      toastShow("Request failed!");
      modalLoadingHide();
    }
  });
}

// translator show
function tlatorShow() {
  var msg = "This translator service uses third-party sources, hence does not guarantee the accuracy or completeness at all times. Also, this service does not function offline and your use of this service may be subject to data charges depending on your data plan with your service provider."
  ons.notification.confirm(msg)
  .then(function(response) {
    if (response == 1) {
      fn.load('translator.html');
    }
  });
}

// translator translate
function tlatorTranslate() {
  var inputText = $("#txtTranslatorInput").val();
  if (!isNullOrEmpty(inputText) && onlineCheck()) {
    $("#btnTranslatorRun").prop("disabled", true);
    $("#txtTranslatorOutput").fadeOut();

    requestSend("http://s1.navinda.xyz:3000/osdp",
    "post",
    {text: inputText},
    null,
    function (stringData) {
      var data = JSON.parse(stringData);
      $("#txtTranslatorOutput").val(data[0]);
      $("#btnTranslatorRun").prop("disabled", false);
      $("#txtTranslatorOutput").fadeIn();
    }
  );
  } else {
    toastShow("Unable to translate text.");
  }
}