// translator show
const tlatorShow = () => {
  const msg = "This translator service uses third-party sources, hence does not guarantee the accuracy or completeness at all times. Also, this service does not function offline and your use of this service may be subject to data charges depending on your data plan with your service provider."
  ons.notification.confirm(msg)
    .then(function (response) {
      if (response == 1) {
        fn.load('./views/translator.html');
      }
    });
}

// translator translate
const tlatorTranslate = () => {
  const inputText = $("#txtTranslatorInput").val();
  if (!isNullOrEmpty(inputText) && onlineCheck()) {
    $("#btnTranslatorRun").prop("disabled", true);
    $("#txtTranslatorOutput").fadeOut();
    request("https://osd-online.appspot.com/translate", "post", { text: inputText }).then(res => {
      if (!res.error) {
        $("#txtTranslatorOutput").val(res[0]);
        $("#txtTranslatorOutput").fadeIn();
      } else {
        toastShow("Unable to translate text.");
      }
      $("#btnTranslatorRun").prop("disabled", false);
    }).catch(error => {
      toastShow("Unable to translate text.");
      $("#btnTranslatorRun").prop("disabled", false);
    });
  } else {
    toastShow("Unable to translate text.");
  }
}