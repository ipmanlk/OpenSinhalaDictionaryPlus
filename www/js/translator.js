// translator show
const tlatorShow = () => {
  var msg = "This translator service uses third-party sources, hence does not guarantee the accuracy or completeness at all times. Also, this service does not function offline and your use of this service may be subject to data charges depending on your data plan with your service provider."
  ons.notification.confirm(msg)
    .then(function (response) {
      if (response == 1) {
        fn.load('./views/translator.html');
      }
    });
}

// translator translate
const tlatorTranslate = () => {
  var inputText = $("#txtTranslatorInput").val();
  if (!isNullOrEmpty(inputText) && onlineCheck()) {
    $("#btnTranslatorRun").prop("disabled", true);
    $("#txtTranslatorOutput").fadeOut();

    requestSend("https://osd-online.appspot.com/translate",
      "post",
      { text: inputText },
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