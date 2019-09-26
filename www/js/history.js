const historyShow = () => content.load('./views/history.html').then(function () {
    let menu = document.getElementById('menu');
    menu.close();

    if (localStorage.getItem("history")) {
        let history = JSON.parse(localStorage.getItem("history"));
        history = history.reverse();

        for (let i = 0; i < history.length; i++) {
            let word = history[i];
            $('#listHistory').append("<ons-list-item onclick=\"meaningShow(\'" + word + "\')\">" + word + "</ons-list-item>");
        }
    }
})

const historySave = (word) => {
    let history = [];
    if (localStorage.getItem("history")) {
        history = JSON.parse(localStorage.getItem("history"));
        history.push(word);
    } else {
        history.push(word);
    }
    localStorage.setItem("history", JSON.stringify(history));
}

const historyClear = () => {
    localStorage.setItem("history", JSON.stringify([]));
    historyShow();
}