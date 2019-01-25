document.addEventListener("backbutton", onBackKeyDown, false);

function onBackKeyDown(e) {
  e.preventDefault();

  switch (currentPage) {
    case "def":
		fn.load('main.html');
		currentPage = "main";
    break;
    default:
    ons.notification.confirm('Do you really want to close the app?') 
    .then(function(index) {
      if (index === 1) { // OK button
        exitApp(); 
      }
    });
  }
}

function exitApp() {
  navigator.app.exitApp();
}