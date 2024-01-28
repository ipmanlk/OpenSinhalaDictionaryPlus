let sn2en = null;
let en2sn = null;
let sn2enKeys = [];
let en2snKeys = [];
let selectedWord = null;

// variable for handling back button
let currentPage = null;

// when onsen ui ready
ons.ready(() => {
  onsenInit();
  onsenSlideBarInit();
  dbRead();
});

//  onsen ui native code
const onsenInit = () => {
  ons.disableDeviceBackButtonHandler();
  document.addEventListener("backbutton", onBackKeyDown, false);
};

const onsenSlideBarInit = () => {
  window.fn = {};
  window.fn.open = () => {
    let menu = document.getElementById("menu");
    menu.open();
  };
  window.fn.load = (page) => {
    let content = document.getElementById("content");
    let menu = document.getElementById("menu");
    content.load(page).then(menu.close.bind(menu));
  };
};

// asign json data to global en2sn & sn2en objects
const dbLoad = (data, db) => {
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
};

// resolve file system urls and call jsonFileRead
const dbRead = () => {
  modalLoadingShow("Loading Database");
  const dbEn2Sn = cordova.file.applicationDirectory + "www/db/en2sn.json";
  const dbSn2En = cordova.file.applicationDirectory + "www/db/sn2en.json";

  resolveLocalFileSystemURL(
    dbEn2Sn,
    (fileEntry) => {
      jsonFileRead(fileEntry, "en2sn").then((data) => {
        dbLoad(data.json, data.db);
      });
    },
    (error) => {
      dbLoadError(error);
      reject(error);
    }
  );

  resolveLocalFileSystemURL(
    dbSn2En,
    (fileEntry) => {
      jsonFileRead(fileEntry, "sn2en").then((data) => {
        dbLoad(data.json, data.db);
      });
    },
    (error) => {
      dbLoadError(error);
      reject(error);
    }
  );
};

// read .json files uisng file plugin
const jsonFileRead = (fileEntry, db) => {
  return new Promise((resolve, reject) => {
    fileEntry.file(
      (file) => {
        const reader = new FileReader();
        reader.onloadend = function () {
          resolve({ db, json: JSON.parse(this.result) });
        };
        reader.readAsText(file);
      },
      (error) => {
        dbLoadError(error);
        reject(error);
      }
    );
  });
};

const dbLoadError = (error) => {
  ons.notification
    .alert("Unable to load the database : " + e)
    .then(function () {
      exitApp();
    });
};

const modalLoadingShow = (txt) => {
  const modal = $("#modalLoading");
  $("#modalLoadingMsg").text(" " + txt);
  modal.show();
};

const modalLoadingHide = () => {
  const modal = $("#modalLoading");
  modal.hide();
};

const suggShow = (element) => {
  $("#listSugg").empty();
  const input = inputClean($(element).val());
  if (!isNullOrEmpty(input)) wordSearch(input);
};

//  use to search for words start with n
const wordSearch = (input) => {
  let db;
  langDetect(input) == "en2sn" ? (db = en2snKeys) : (db = sn2enKeys);
  // no of suggestions
  const limit = 10;
  let counter = 0;
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
    $("#listSugg").append(
      `<ons-card onclick="gtranslateGet('${input}')"><div class="content"><h4>Sorry! I couldn't find anything on that. Click here to get results from online.</h4></div></ons-card>`
    );
  }
};

const meaningShow = (input) => {
  if (langDetect(input) == "en2sn") {
    snMeaningShow(input);
  } else {
    enMeaningShow(input);
  }
  selectedWord = input;
  currentPage = "def";

  // save history
  historySave(input);
};

const suggListAppend = (word, type) => {
  let listItem;
  if (type == "offline") {
    listItem = `<ons-card onclick="meaningShow('${word}')"><div class="content">${word}</div></ons-card>`;
  } else {
    listItem = `<ons-card onclick="meaningShow('${word}')"><div class="content">${word}<span style="float: right"><ons-icon icon="md-translate"></ons-icon></span></div></ons-card>`;
  }
  $("#listSugg").append(listItem);
};

const inputClean = (input) => input.trim().toLowerCase();

const isNullOrEmpty = (input) => jQuery.isEmptyObject(input);

// check language
const langDetect = (txt) => {
  let selectedDb;
  const test = /^[A-Za-z][\sA-Za-z0-9.\'-]*$/.test(txt);
  test ? (selectedDb = "en2sn") : (selectedDb = "sn2en");
  return selectedDb;
};

// tasks not releated to main.html template
const snMeaningShow = (input) => {
  const content = document.querySelector("ons-splitter-content");
  content.load("./views/snMeaning.html").then(function () {
    $("#title").text(input);
    const meanings = en2sn[input];
    for (let i = 0; i < meanings.length; i++) {
      $(".listMeanings").append(
        `<ons-list-item>${meanings[i]}<div class="right"><ons-icon size="20px" onclick="textCopy(this);" icon="md-copy" class="list-item__icon"></ons-icon></div></ons-list-item>`
      );
    }
    // call for datamuse
    if (onlineCheck()) {
      datamuseGet(input)
        .then((res) => {
          enDefShow(res.defs);
          enSynShow(res.syns);
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      $(".listSynonyms").append(
        "<ons-list-item>You're offline. Please connect to the internet.</ons-list-item>"
      );
      $(".listDefinitions").append(
        "<ons-list-item>You're offline. Please connect to the internet.</ons-list-item>"
      );
    }
  });
};

const enMeaningShow = (input) => {
  const content = document.querySelector("ons-splitter-content");
  content.load("./views/enMeaning.html").then(function () {
    $("#title").text(input);
    const meanings = sn2en[input];
    for (let i = 0; i < meanings.length; i++) {
      $(".listMeanings").append(
        `<ons-list-item>${meanings[i]}<div class="right"><ons-icon size="20px" onclick="textCopy(this);" icon="md-copy" class="list-item__icon"></ons-icon></div></ons-list-item>`
      );
    }
    if (onlineCheck()) {
      datamuseGet(meanings[0])
        .then((res) => {
          enDefShow(res.defs);
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      $(".listDefinitions").append(
        "<ons-list-item>You're offline. Please connect to the internet.</ons-list-item>"
      );
    }
    snSynShow();
  });
};

const enDefShow = (defs) => {
  if (defs.length > 0) {
    for (let i = 0; i < defs.length; i++) {
      let [pos, def] = defs[i].split("\t");
      pos = `(${datamuseExpandPos(pos)})`;

      $(".listDefinitions").append(
        `<ons-list-item>${pos} ${def}</ons-list-item>`
      );
    }
  } else {
    $(".listDefinitions").append(
      "<ons-list-item>Sorry! No results found.</ons-list-item>"
    );
  }
};

const enSynShow = (syns) => {
  if (!isNullOrEmpty(syns)) {
    for (let i = 0; i < syns.length; i++) {
      $(".listSynonyms").append(
        `<ons-list-item>${syns[i].word}<div class="right"><ons-icon onclick="TTSspeak('${syns[i].word}');" icon="ion-volume-high" class="list-item__icon"></ons-icon></div></ons-list-item>`
      );
    }
  } else {
    $(".listSynonyms").append(
      "<ons-list-item>Sorry! No results found.</ons-list-item>"
    );
  }
};

const snSynShow = () => {
  const enMeaning = sn2en[selectedWord][0].trim();
  const snSyns = en2sn[enMeaning];
  if (!isNullOrEmpty(snSyns)) {
    for (let i = 0; i < snSyns.length; i++) {
      $(".listSynonyms").append(`<ons-list-item>${snSyns[i]}</ons-list-item>`);
    }
  } else {
    $(".listSynonyms").append(
      "<ons-list-item>Sorry! No results found.</ons-list-item>"
    );
  }
};

// expand part of speech
const datamuseExpandPos = (pos) => {
  let expandedPos;
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
  return expandedPos;
};

// text to speach plugin
const TTSspeak = (input) => {
  TTS.speak(input);
};

// Copy to clipboard
const textCopy = (element) => {
  const text = $(element).parent().parent().text();
  cordova.plugins.clipboard.copy(text);
  toastShow("Text copied to clipboard!");
};

const toastShow = (msg) =>
  ons.notification.toast(msg, { timeout: 1000, animation: "ascend" });

// about
const aboutShow = () => $("#modalAbout").show();

// online check
const onlineCheck = () => {
  const networkState = navigator.connection.type;
  const isOffline =
    networkState == Connection.NONE || networkState == Connection.UNKNOWN;
  return !isOffline;
};

const tabSwitch = (id) => {
  $("#listMeanings").parent().hide();
  $("#listDefinitions").parent().hide();
  $("#listSynonyms").parent().hide();

  $(id).parent().fadeIn();
};
