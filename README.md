# Databuffer UI (app)

This is the web GUI for the databuffer DAQ system.

## User manual

The online manual is [located here](./docs/index.md).

## Running the UI with docker

**Note:** You need access to PSI's internal docker registry at `docker.psi.ch:5000` to initially `docker pull` the image.

Just run the image `docker.psi.ch:5000/databuffer-ui` and provide the API endpoints `QUERY_API` and `DISPATCHER_API` through the environment. Example:

```sh
docker run --rm -i -t -e QUERY_API="http://localhost:8001" -e DISPATCHER_API="http://localhost:8002" -p 3000:8080 docker.psi.ch:5000/databuffer-ui
```

The above command will

- `docker pull` the image
- Run a container with the image
- Set the query API endpoint to `http://localhost:8001`
- Set the dispatcher API endpoint to `http://localhost:8002`
- Expose the containers port 8080 on the local port 3000

So, to see databuffer-ui in action, open http://localhost:3000.

## Maintainer documentation

As a prerequisite you must install [nodejs]. I use the most current LTS version, which was version 12 at the time of writing. I strongly recommend getting [nodejs] through [nvm], if possible.

### Development workflow

1.  Clone the project
2.  Install the dependencies: `npm install`
3.  Run these in parallel:
    - Run compilation / build in "watch" mode: `npm run build:watch`
    - Run local development server: `npm start`
    - Run local data api server: `npm run dev-backend:queryrest`
4.  Run unit tests: `npm test`
5.  Run test with code coverage reporting: `npm run test:coverage`

### Building for production

- Preview the release: `npm run release`
- Create and tag the release: `npm run release:prod`
- Create a packaged file for uploading to the web server: `./package-app.sh`
- Copy the file to the web server and unpack it. **The configuration must be provided by the web server.** See notes in `./public/config/databuffer-ui.config.js`.

### Deploying work in progress to beta

- Create a packaged file for uploading to the web server: `./package-app.sh --wip`
- Copy the file to the web server and unpack it. **The configuration must be provided by the web server.** See notes in `./public/config/databuffer-ui.config.js`.

[nodejs]: https://nodejs.org/en/
[nvm]: https://github.com/nvm-sh/nvm
