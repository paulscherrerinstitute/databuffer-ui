# databuffer-ui (app)

databuffer-ui is the web GUI for the databuffer DAQ system.

## User manual

The online manual is [located here](./docs/index.md).

## Change log

The change log is [located here](./CHANGELOG.md).

## Issues

Open issues are [located here](https://github.com/paulscherrerinstitute/databuffer-ui/issues) and organized using [milestones](https://github.com/paulscherrerinstitute/databuffer-ui/milestones). The milestones roughly follow our quarterly users' meetings.

**Note:** Within the milestones view, the issues are **ordered by priority**, i.e. the top most issue has the highest priority and will be worked on next.

## Running the UI with docker

The recommended way to run the UI (e.g. if you want to test a new backend) is through docker.

### Configuration

The docker image is configured through environment variables:

| Environment variable          | Description                                             | Example                                         |
| ----------------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| `DATA_UI_DISPATCHER_API`      | Full URL to the dispatcher API endpoint.                | https://my-dispatcher.example.org/foo/bar       |
| `DATA_UI_QUERY_API`           | Full URL to the data query API endpoint.                | https://my-data-api.example.org/foo/bar         |
| `DATA_UI_TITLE`               | Application Title                                       | BETA Databuffer UI                              |
| `DATA_UI_CONTACT_EMAIL`       | Email address on home page                              | data-ui-support@example.org                     |
| `DATA_UI_COLOR_PRIMARY_HUE`   | Hue of primary color (number between 0 and 360)         | 90                                              |
| `DATA_UI_COLOR_ON_PRIMARY`    | CSS color string for text _on_ primary color elements   | `#ffffff` or `white` or `rgb(100%, 100%, 100%)` |
| `DATA_UI_COLOR_SECONDARY_HUE` | Hue of secondary color (number between 0 and 360)       | 90                                              |
| `DATA_UI_COLOR_ON_SECONDARY`  | CSS color string for text _on_ secondary color elements | `#ffffff` or `white` or `rgb(100%, 100%, 100%)` |

**⚠️ A note on the colors**

- **It is usually sufficient to only provide `DATA_UI_COLOR_PRIMARY_HUE` to visually distinguish two instances.**
- Only the colors you specify are injected through the environment; the others are left untouched.
- The primary and secondary color **must** be configured through the hue (angle on the color wheel). This is because one of the components sets we use sets color through setting the hue.
- The "on ..." color can be any valid [CSS color value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value) as a string.

### Downloading and updating the docker image

The docker image for databuffer-ui is hosted on the GitHub Container Registry. You can download and update the docker image with the `docker pull` command:

```sh
docker pull ghcr.io/paulscherrerinstitute/databuffer-ui
```

Note, that the above command does not specify a tag, and hence docker will use the default tag "latest". You can [review all available tags online](https://github.com/orgs/paulscherrerinstitute/packages/container/package/databuffer-ui). The vX.Y.Z and "latest" tags of the docker images are considered suitable for production installations; the "edge" tag is considered suitable for integration / beta / QA installations.

### Running the docker image

```sh
docker run --rm -i -t -e DATA_UI_QUERY_API=http://localhost:8001 -e DATA_UI_DISPATCHER_API=http://localhost:8002 -p 3000:8080 ghcr.io/paulscherrerinstitute/databuffer-ui
```

The above commands will...

- Set the data query API endpoint to `http://localhost:8001`
- Set the dispatcher API endpoint to `http://localhost:8002`
- Expose the web server (container's port 8080) on the local port 3000

So, to see databuffer-ui in action, open http://localhost:3000.

## Maintainer documentation

As a prerequisite you must install [nodejs]. I use the most current LTS version, which was version 12 at the time of writing. I strongly recommend getting [nodejs] through [nvm], if possible.

### Development workflow

To work on databuffer-ui locally, do the following:

1.  Clone the project
2.  Install the dependencies: `npm install`
3.  Run these in parallel:
    - Run compilation / build in "watch" mode: `npm run build:watch`
    - Run local development server: `npm start`
    - Run local data api server: `npm run dev-backend:queryrest`

The following procedure is recommended:

1.  Create an issue on GitHub describing what needs to be done, and why.
2.  Create a branch: `git checkout -b thing-i-work-on`
3.  Run the existing unit tests to verify you have a clean start: `npm test`
4.  Write tests. This is **mandatory** for business logic changes (i.e. everything that goes into the app's state), but _may be optional_ for changes that only affect the UI / presentation layer (e.g. changing a CSS style or adding a route for a new view).
5.  Implement the changes.
6.  Run all unit tests to verify you have implemented everything correctly and didn't break anything: `npm test`<br>
    You can also run the tests with code coverage reporting, if you're curious about that: `npm run test:coverage`
7.  Commit the changes with a commit message following [conventional commits guidelines](https://www.conventionalcommits.org/en/v1.0.0/). Consider closing the issue through the commit message.
8.  Merge the changes back into master. Feel free to `git rebase` to linearize the history or squash commits for a cleaner, more meaningful commit history.<br>
    It might be a good idea to merge with a merge commit that closes the issue on GitHub.
9.  Publish the changes by pushing the master branch to github. If appropriate releas the changes as a tagged version (see below).

Adhering to this workflow provides the following benefits:

- A [change log](./CHANGELOG.md) can automatically be generated, describing **what** has changed throughout the versions. The commit messages' header lines are used for that.
- The change log entries link to the GitHub issues, describing **why** the change was made, including discussions. (This is only possible, if commit messages are used to close issues.)
- The change log entries and the GitHub issues contain links to the commit, describing **how** the change was made.
- By providing information on the three aspects, _what_ has changed, _why_ it has been changed, and _how_ it was changed, and combining them in the change log, the project history is documented rather thoroughly.

### Deploying

Deployments are done through docker images. The docker images are built and published on GitHub container registry through GitHub Actions:

- When releasing a tagged version (see below), the docker image is built and published with the following tags:
  - vX.Y.Z
  - vX.Y
  - vX
  - latest
- When pushing to the master branch, the docker image is built and published with the following tags:
  - sha-xxxxxxxx
  - edge

#### Releasing a tagged version

- Preview the release and release notes: `npm run release`
- Create and tag the release: `npm run release:prod`
- Publish the tagged version on GitHub: `git push --follow-tags origin master`
- Wait for GitHub to build and publish the docker images, including the "latest" tag

#### Releasing work in progress to beta

- Publish the changes to GitHub: `git push origin master`
- Wait for GitHub to build and publish the docker images, inlcuding the "edge" tag

[nodejs]: https://nodejs.org/en/
[nvm]: https://github.com/nvm-sh/nvm
