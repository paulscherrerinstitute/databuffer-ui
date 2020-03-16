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

- Set `APP_VERSION` in the environment, e.g. `export APP_VERSION=9.12.3564-RC72.3-and-a-half`.
- Run `npm build`.
- Copy contents of `./public/` folder to web server.
- **TODO**: Configuration needs to be picked up from environment on the web server. (See comment in `public/index.html`.)

[nodejs]: https://nodejs.org/en/
[nvm]: https://github.com/nvm-sh/nvm
