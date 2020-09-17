# ----------------------------------------------------------------------
FROM node:12-alpine AS build-ui

COPY  ./ /databuffer-ui

WORKDIR /databuffer-ui

RUN npm config set '@psi:registry' http://npm.psi.ch
RUN npm install
RUN npm run build

# ----------------------------------------------------------------------
FROM docker.psi.ch:5000/simple-spa-server

COPY --from=build-ui /databuffer-ui/public /data/docroot
