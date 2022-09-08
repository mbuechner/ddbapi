#! /bin/sh
set -e

NGINX_ROOT=/usr/share/nginx/html
INDEX_FILE=$NGINX_ROOT/index.html
INIT_FILE=$NGINX_ROOT/swagger-initializer.js
FIRSTRUN=$NGINX_ROOT/../firstrun.txt

if [ ! -f $FIRSTRUN ]
then
	# DDBapi
	rm $INDEX_FILE.gz
	rm $INIT_FILE.gz
	echo "Add DDBapi JS..."
	sed -i '/window.onload = function() {/ r /usr/share/nginx/ddbapi.js' $INIT_FILE
	echo "Add DDBapi plug-in..."
	sed -i 's/plugins: \[/plugins: \[ DDBLogoPlugin,/g' $INIT_FILE
	echo "Change title..."
	sed -i 's/<title>Swagger UI<\/title>/<title>DDBapi | Documentation of the Application Programming Interface (API)<\/title>/g' $INDEX_FILE
	gzip -k $INDEX_FILE
	gzip -k $INIT_FILE
	touch $FIRSTRUN
fi
