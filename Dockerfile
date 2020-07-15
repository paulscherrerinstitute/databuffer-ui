# ----------------------------------------------------------------------
FROM node:12-alpine AS build-step

COPY  ./ /databuffer-ui

WORKDIR /databuffer-ui

RUN npm config set '@psi:registry' http://npm.psi.ch
RUN npm install
RUN npm run build

# ----------------------------------------------------------------------
FROM nginx:alpine

VOLUME [ "/app", "/app/config" ]
COPY --from=build-step /databuffer-ui/public /app
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf
