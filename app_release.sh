#folder setup
JS=www/js

mkdir -p .temp

#minify js with uglify js
for file in $JS/*
do
  filename=$(basename $file)
  echo "backing up $filename..."
  cp $file .temp/$filename
  echo "minifying $filename.."
  uglifyjs $file >> $JS/temp.txt
  rm $file && mv $JS/temp.txt $JS/$filename
done

#concat js files
cat $JS/*js >> $JS/app.all.js

#minify special files
echo "minifying  special files"
cp www/index.html .temp/index.html
minify www/index.html >> www/temp.txt 
rm www/index.html
mv www/temp.txt www/index.html

#release app 
cordova run android --release -- --keystore="" --storePassword= --alias= --password=

echo "restoring special files"
#restore special files
rm www/index.html 
mv .temp/index.html www/index.html

rm $JS/*
#restore origin js files 
for file in .temp/*
do
  filename=$(basename $file)
  echo "restoring file $filename"
  mv $file $JS/$filename
done

