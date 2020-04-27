# Databuffer UI (app)

This is the web GUI for the databuffer DAQ system.

## Developer documentation

As a prerequisite you must install [nodejs]. I use the most current LTS version, which was version 12 at the time of writing.

I strongly recommend getting [nodejs] through [nvm], if possible.

### Development workflow

1.  Clone the project
2.  Install the dependencies: `npm install`
3.  Run these two in parallel:
    - Run compilation / build in "watch" mode: `npm run build:watch`
    - Run local development server: `npm start`
4.  Run unit tests: `npm test`
5.  Run test with code coverage reporting: `npm run test:coverage`

### Building for production

- Preview the release: `npm run release`
- Create and tag the release: `npm run release:prod`
- Create a packaged file for uploading to the web server: `./package-app.sh`
- Copy the file to the web server and unpack it. **The configuration must be provided by the web server.** See notes in `./public/config/databuffer-ui.config.js`.

### Deploying work in progress to beta

- Create a packaged file for uploading to the web server: `./package-app.sh --skip-clean --skip-build`
- Copy the file to the web server and unpack it. **The configuration must be provided by the web server.** See notes in `./public/config/databuffer-ui.config.js`.

[nodejs]: https://nodejs.org/en/
[nvm]: https://github.com/nvm-sh/nvm
