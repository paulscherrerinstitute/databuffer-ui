# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [4.5.2](https://github.com/paulscherrerinstitute/databuffer-ui/compare/v4.5.1...v4.5.2) (2021-05-27)


### Bug Fixes

* auto focus of search field ([d563224](https://github.com/paulscherrerinstitute/databuffer-ui/commit/d5632243efef5b908a7e62dc08356819a41192cf)), closes [#118](https://github.com/paulscherrerinstitute/databuffer-ui/issues/118)
* quick selection for month was wrong ([2c14abe](https://github.com/paulscherrerinstitute/databuffer-ui/commit/2c14abefdbbeeea69f81b40b16610be293084134)), closes [#107](https://github.com/paulscherrerinstitute/databuffer-ui/issues/107)
* time axis synced to query range ([6b30429](https://github.com/paulscherrerinstitute/databuffer-ui/commit/6b30429eaf6af7b03c47b817ba91d1983f2beb1b)), closes [#112](https://github.com/paulscherrerinstitute/databuffer-ui/issues/112)
* zoom with reload ([e00c2ee](https://github.com/paulscherrerinstitute/databuffer-ui/commit/e00c2ee7a782ade663a1bb0c9d52d82ca857f2f5)), closes [#73](https://github.com/paulscherrerinstitute/databuffer-ui/issues/73)

### [4.5.1](https://github.com/paulscherrerinstitute/databuffer-ui/compare/v4.5.0...v4.5.1) (2021-03-22)


### Bug Fixes

* align data by time for csv export ([00175f7](https://github.com/paulscherrerinstitute/databuffer-ui/commit/00175f7fe58bf576bc083906bce55b87322cf75c)), closes [#111](https://github.com/paulscherrerinstitute/databuffer-ui/issues/111)

## [4.5.0](https://github.com/paulscherrerinstitute/databuffer-ui/compare/v4.4.0...v4.5.0) (2021-02-24)

### Features

- add channel type as tag ([fc580cc](https://github.com/paulscherrerinstitute/databuffer-ui/commit/fc580ccd23a4f50c3ab43548271252d4a60b4aa2)), closes [#104](https://github.com/paulscherrerinstitute/databuffer-ui/issues/104)
- customize visual appearance from environment ([f7ad8ef](https://github.com/paulscherrerinstitute/databuffer-ui/commit/f7ad8ef096dbec34bb411eec98f09a9a868dbc52)), closes [#94](https://github.com/paulscherrerinstitute/databuffer-ui/issues/94)
- list available backend on home view ([0ee7261](https://github.com/paulscherrerinstitute/databuffer-ui/commit/0ee7261bbd9a1e3e0ab65c44677a46fc149d2bd5)), closes [#99](https://github.com/paulscherrerinstitute/databuffer-ui/issues/99)
- option to plot all channels on single axis ([b2cd4d4](https://github.com/paulscherrerinstitute/databuffer-ui/commit/b2cd4d4acec25b976ffe643d4dac95eadffc7463)), closes [#66](https://github.com/paulscherrerinstitute/databuffer-ui/issues/66)
- prevent string channels from being selected ([ef1b978](https://github.com/paulscherrerinstitute/databuffer-ui/commit/ef1b9784d555de9b622f326c8faf7dccebbedb0c)), closes [#103](https://github.com/paulscherrerinstitute/databuffer-ui/issues/103)
- retain custom axis settings when sharing ([c22379f](https://github.com/paulscherrerinstitute/databuffer-ui/commit/c22379f652efb18de594e98cf371916ac27de80d)), closes [#88](https://github.com/paulscherrerinstitute/databuffer-ui/issues/88)
- separate plots per channel ([59f3766](https://github.com/paulscherrerinstitute/databuffer-ui/commit/59f37660eddca467e41aa25418e1f43cc79c0b06)), closes [#67](https://github.com/paulscherrerinstitute/databuffer-ui/issues/67)

### Bug Fixes

- axis types and limits not picked up from shared link ([754e80e](https://github.com/paulscherrerinstitute/databuffer-ui/commit/754e80e6915120745bf56d1ca438689ac9160ea6)), closes [#88](https://github.com/paulscherrerinstitute/databuffer-ui/issues/88)
- env expansion broke index.html ([a9e9535](https://github.com/paulscherrerinstitute/databuffer-ui/commit/a9e9535cc5d2692a8aaa955d5f10b158c6fb762d)), closes [#98](https://github.com/paulscherrerinstitute/databuffer-ui/issues/98)
- use correct query for csv download ([f1a342b](https://github.com/paulscherrerinstitute/databuffer-ui/commit/f1a342b54ed7fd1f0fabf9093065fdfca1dfd123)), closes [#92](https://github.com/paulscherrerinstitute/databuffer-ui/issues/92)

## [4.4.0](https://github.com/paulscherrerinstitute/databuffer-ui/compare/v4.3.0...v4.4.0) (2020-09-24)

### Features

- retain custom title for plot when sharing ([b322cc2](https://github.com/paulscherrerinstitute/databuffer-ui/commit/b322cc2ebce239e7d7b10f6683236652247124d5)), closes [#65](https://github.com/paulscherrerinstitute/databuffer-ui/issues/65)
- use ISO8601 times in curl command ([2ff922f](https://github.com/paulscherrerinstitute/databuffer-ui/commit/2ff922fdd4aad1d4e1fcf7ba7494231d649ab9c9)), closes [#77](https://github.com/paulscherrerinstitute/databuffer-ui/issues/77)

### Bug Fixes

- add view-not-found element ([47c8903](https://github.com/paulscherrerinstitute/databuffer-ui/commit/47c89030b55ad270e165c8709b7f32b529ea864f)), closes [#58](https://github.com/paulscherrerinstitute/databuffer-ui/issues/58)
- circumvent race condition for browser location ([302e1b1](https://github.com/paulscherrerinstitute/databuffer-ui/commit/302e1b1ade1d16c0efde314899a9b75cf7e309ae)), closes [#6](https://github.com/paulscherrerinstitute/databuffer-ui/issues/6)
- download plot data as CSV ([2e31589](https://github.com/paulscherrerinstitute/databuffer-ui/commit/2e31589cf48f6ad1f1ca141ca6c476e18e8dcd74))
- manual scaling of y axis ([d8c0471](https://github.com/paulscherrerinstitute/databuffer-ui/commit/d8c04718b31fa0d9cc5ace21ff6ebe026bb4cf18)), closes [#74](https://github.com/paulscherrerinstitute/databuffer-ui/issues/74)
- use correct type ([71fd54d](https://github.com/paulscherrerinstitute/databuffer-ui/commit/71fd54d58bd87210be0bafb7b37e74f4b1ca9573))

## [4.3.0](https://github.com/paulscherrerinstitute/databuffer-ui/compare/v4.2.0...v4.3.0) (2020-06-25)

### Features

- copy curl command for download to clipboard ([9a77603](https://github.com/paulscherrerinstitute/databuffer-ui/commit/9a77603a610523a4938fa9b3c5843e81264d0480)), closes [#69](https://github.com/paulscherrerinstitute/databuffer-ui/issues/69)
- download channel data as CSV from data API ([88b4b4b](https://github.com/paulscherrerinstitute/databuffer-ui/commit/88b4b4bedaae41281a2d2f951e4f375fced90b4e)), closes [#17](https://github.com/paulscherrerinstitute/databuffer-ui/issues/17)

## [4.2.0](https://github.com/paulscherrerinstitute/databuffer-ui/compare/v4.1.0...v4.2.0) (2020-06-15)

### Features

- add configuration for axis min and max ([d294822](https://github.com/paulscherrerinstitute/databuffer-ui/commit/d2948223492b6d9b0aa1b61fa09598ccd742520b))
- add configuration for axis type ([652e8c5](https://github.com/paulscherrerinstitute/databuffer-ui/commit/652e8c5ecb2dfa952f705bff30769b0f421bf33b))
- add configuration for plot and axes labels ([7458c4e](https://github.com/paulscherrerinstitute/databuffer-ui/commit/7458c4eab11bbc683cef5aff5978b937c1df5bbe))
- add fixed time ranges for reporting ([7e4561f](https://github.com/paulscherrerinstitute/databuffer-ui/commit/7e4561f4abdc3a764dc21dee5f71a5824b0069c8)), closes [#52](https://github.com/paulscherrerinstitute/databuffer-ui/issues/52)
- add tooltips for buttons in toolbar ([7523ea7](https://github.com/paulscherrerinstitute/databuffer-ui/commit/7523ea7e65776e10ba399d72658025c4ff165fbf)), closes [#61](https://github.com/paulscherrerinstitute/databuffer-ui/issues/61)
- add view for configuring plot settings ([c244433](https://github.com/paulscherrerinstitute/databuffer-ui/commit/c2444332f9ac98df9eaa833c4243ecd9d4e4f453))
- enable zooming and panning with mouse ([9287d4d](https://github.com/paulscherrerinstitute/databuffer-ui/commit/9287d4df05057aada196866b2aa44a9fc462f8fe))
- plot band of min/max in background ([5ce78f9](https://github.com/paulscherrerinstitute/databuffer-ui/commit/5ce78f95d31584c3a75b7ac5fb41b15f466162aa)), closes [#20](https://github.com/paulscherrerinstitute/databuffer-ui/issues/20)
- provide online documentation ([ca80c0b](https://github.com/paulscherrerinstitute/databuffer-ui/commit/ca80c0ba0948818a5f00356c3a585772ad0da7b6)), closes [#27](https://github.com/paulscherrerinstitute/databuffer-ui/issues/27)
- reconstruct custom labels from link ([063847f](https://github.com/paulscherrerinstitute/databuffer-ui/commit/063847f99d8e0d582c5141e30c8231865131dc54)), closes [#23](https://github.com/paulscherrerinstitute/databuffer-ui/issues/23)
- zoom and reload ([ad93f3a](https://github.com/paulscherrerinstitute/databuffer-ui/commit/ad93f3ae813617be21d4b664269490cc9111925d)), closes [#14](https://github.com/paulscherrerinstitute/databuffer-ui/issues/14)

## [4.1.0](https://github.com/paulscherrerinstitute/databuffer-ui/compare/v4.0.0...v4.1.0) (2020-05-20)

### Features

- change default label of axes and data series ([85f4710](https://github.com/paulscherrerinstitute/databuffer-ui/commit/85f4710f286243012f9421459dcceca0071f3415)), closes [#53](https://github.com/paulscherrerinstitute/databuffer-ui/issues/53)
- display backend of selected channels as tag ([df11d78](https://github.com/paulscherrerinstitute/databuffer-ui/commit/df11d7804f34e5fc8f1c39aad7fc16c4761e7d0c)), closes [#50](https://github.com/paulscherrerinstitute/databuffer-ui/issues/50)
- implement app navigation with top app bar ([218e033](https://github.com/paulscherrerinstitute/databuffer-ui/commit/218e03383cc4693f8cc51e5f85f818eb4d092521)), closes [#49](https://github.com/paulscherrerinstitute/databuffer-ui/issues/49)
- move query meta info to separate view ([6721e96](https://github.com/paulscherrerinstitute/databuffer-ui/commit/6721e96f625a24421dafcfe81b78342568f4ac1d)), closes [#57](https://github.com/paulscherrerinstitute/databuffer-ui/issues/57)
- select and plot channels with entry point /preselect ([bcbe0c2](https://github.com/paulscherrerinstitute/databuffer-ui/commit/bcbe0c2ad5d326ca3d245e365261c788c5a24d51))
- share plot through direct link ([53a975d](https://github.com/paulscherrerinstitute/databuffer-ui/commit/53a975df60768877218d720e71b6693a8685fbe8)), closes [#24](https://github.com/paulscherrerinstitute/databuffer-ui/issues/24)

### Bug Fixes

- update local config ([2ebdd59](https://github.com/paulscherrerinstitute/databuffer-ui/commit/2ebdd594aa07815b90679839255e39af66d9a567))
- update snackbar to new API ([f7c3b90](https://github.com/paulscherrerinstitute/databuffer-ui/commit/f7c3b90f00961a9dfd605a3e26cc00d23737bf27)), closes [#56](https://github.com/paulscherrerinstitute/databuffer-ui/issues/56)

## 4.0.0 (2020-04-27)

### Features

- add application icon ([608ef69](https://github.com/paulscherrerinstitute/databuffer-ui/commit/608ef6913eba8e887dbac5076164df4fb0f9e081))
- change how channel selection works ([3312e28](https://github.com/paulscherrerinstitute/databuffer-ui/commit/3312e282cdbdc783c5ccdac605eab68fd1150fd9)), closes [#8](https://github.com/paulscherrerinstitute/databuffer-ui/issues/8)
- load app config from external file ([6cade06](https://github.com/paulscherrerinstitute/databuffer-ui/commit/6cade06f6f76ba46a53c35654430441ba5df0541)), closes [#7](https://github.com/paulscherrerinstitute/databuffer-ui/issues/7)
- provide channel details in search view ([8d8faa6](https://github.com/paulscherrerinstitute/databuffer-ui/commit/8d8faa6e34ec9a1e56badf9e21fc0ece7aa7f011)), closes [#3](https://github.com/paulscherrerinstitute/databuffer-ui/issues/3)

### Bug Fixes

- fix failing tests ([bb5bda7](https://github.com/paulscherrerinstitute/databuffer-ui/commit/bb5bda71730c7e0b5174976633e6ca3598713328))
- get rid of compiler error ([576702d](https://github.com/paulscherrerinstitute/databuffer-ui/commit/576702db4dec22f66cb63ec20d29e84f54f557e5)), closes [#1](https://github.com/paulscherrerinstitute/databuffer-ui/issues/1)
