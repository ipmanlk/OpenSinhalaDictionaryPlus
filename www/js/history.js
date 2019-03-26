function historyShow() {
    content.load('./views/history.html').then(function () {
        var menu = document.getElementById('menu');
        menu.close();

        if (localStorage.getItem("history")) {
            var history = JSON.parse(localStorage.getItem("history"));
            history = history.reverse();

            for (var i = 0; i < history.length; i++) {
                var word = history[i];
                $('#listHistory').append("<ons-list-item onclick=\"meaningShow(\'" + word + "\')\">" + word + "</ons-list-item>");
            }
        }
    });
}

function historySave(word) {
    var history = [];
    if (localStorage.getItem("history")) {
        history = JSON.parse(localStorage.getItem("history"));
        history.push(word);
    } else {
        history.push(word);
    }
    localStorage.setItem("history", JSON.stringify(history));
}

function historyClear() {
    localStorage.setItem("history", JSON.stringify([]));
    historyShow();
}