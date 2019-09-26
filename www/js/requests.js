// datamuse api calls
const datamuseGet = (word) => {
    return new Promise((resolve, reject) => {
        const url = "https://osd-online.appspot.com/datamuse";
        request(url, "get", { word }).then(res => {
            resolve(res);
        }).catch(error => {
            console.log(error);
            reject(error);
        })
    });
}

// google translate api calls
const gtranslateGet = (input) => {
    modalLoadingShow("Getting results...");
    $("#listSugg").empty();

    request("https://osd-online.appspot.com/translate", "get", { word: input }).then((data) => {
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
            suggListAppend(input, "online");
            modalLoadingHide();
        } else {
            modalLoadingHide();
            ons.notification.alert("Your input is incorrect!. Please check for spelling mistakes.");
        }
    }).catch(res => {
        console.log(res);
    })

}

const request = (url, type, data) => {
    return new Promise((resolve, reject) => {
        $("#progressBar").fadeIn();
        $.ajax({
            url: url,
            type: type,
            data: data,
            timeout: 30000,
            dataType: "json",
            success: function (res) {
                $("#progressBar").fadeOut();
                resolve(res);
            },
            error: function (error) {
                toastShow("Request failed!");
                modalLoadingHide();
                $("#progressBar").fadeOut();
                reject(error);
            }
        });
    })
}