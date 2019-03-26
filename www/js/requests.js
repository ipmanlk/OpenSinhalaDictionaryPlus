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
    var url = "https://osdp.herokuapp.com?word=" + input;
    $("#listSugg").empty();

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

function requestSend(url, type, data, input, callback) {
    // url = request url
    // type = request type
    // data = data to be send
    // input = input word by the user 
    // callback = function to run after success 
    $("#progressBar").fadeIn();
    $.ajax({
      url: url,
      type: type,
      data: data,
      timeout: 30000,
      success: function (data) {
        callback(data);
        $("#progressBar").fadeOut();
      },
      error: function () {
        toastShow("Request failed!");
        modalLoadingHide();
        $("#progressBar").fadeOut();
      }
    });
  }