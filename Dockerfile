FROM ghcr.io/paulscherrerinstitute/simple-spa-server

ENV SSS_APP_NAME=databuffer-ui

COPY ./public /data/docroot
