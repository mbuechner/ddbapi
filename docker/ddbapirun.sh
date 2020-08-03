#! /bin/sh

set -e
NGINX_ROOT=/usr/share/nginx/html
INDEX_FILE=$NGINX_ROOT/index.html
LAST_LINE="exec nginx -g 'daemon off;'"

# Run Swagger script, but without last line
echo "Remove: $LAST_LINE"
sed -i "/$LAST_LINE/d" $NGINX_ROOT/../run.sh

$NGINX_ROOT/../run.sh

# DDBapi
rm $INDEX_FILE.gz
echo "Add DDBapi JS..."
sed -i '/window.onload = function() {/ r /usr/share/nginx/ddbapi.js' $INDEX_FILE
echo "Add DDBapi plug-in..."
sed -i 's/plugins: \[/plugins: \[ DDBLogoPlugin,/g' $INDEX_FILE
echo "Change backgroud color to white..."
sed -i 's/background: #fafafa;/background: #fff;/g' $INDEX_FILE
gzip -k $INDEX_FILE

# Run last Swagger script line
eval $LASTLINE

