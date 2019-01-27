#folder setup
JS=www/js

#concat js files
cat $JS/*js >> $JS/app.all.js

#release app 
cordova run android

rm $JS/app.all.js
