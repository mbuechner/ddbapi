FROM swaggerapi/swagger-ui:v4.14.0
MAINTAINER Michael Büchner <m.buechner@dnb.de>

RUN rm /usr/share/nginx/html/favicon-32x32.png /usr/share/nginx/html/favicon-16x16.png
COPY images/ /usr/share/nginx/html/
COPY docker/50-swagger-ui-ddb.sh /docker-entrypoint.d/
COPY scripts/ddbapi.js /usr/share/nginx/
RUN chmod +x /docker-entrypoint.d/50-swagger-ui-ddb.sh 

EXPOSE 8080
