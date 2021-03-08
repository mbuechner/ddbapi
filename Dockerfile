FROM swaggerapi/swagger-ui:v3.44.1
MAINTAINER Michael Büchner <m.buechner@dnb.de>

RUN rm /usr/share/nginx/html/favicon-32x32.png /usr/share/nginx/html/favicon-16x16.png
COPY images/ /usr/share/nginx/html/
COPY docker/ddbapirun.sh /usr/share/nginx/
COPY scripts/ddbapi.js /usr/share/nginx/
RUN chmod +x /usr/share/nginx/ddbapirun.sh 

EXPOSE 8080

CMD ["sh", "/usr/share/nginx/ddbapirun.sh"]
