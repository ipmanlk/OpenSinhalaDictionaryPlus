const onBackKeyDown = (e) => {
  e.preventDefault();

  switch (currentPage) {
    case "def":
      fn.load('./views/search.html');
      currentPage = "search";
      break;
    default:
      ons.notification.confirm('Do you really want to close the app?')
        .then(function (index) {
          if (index === 1) { // OK button
            exitApp();
          }
        });
  }
}

const exitApp = () => navigator.app.exitApp()