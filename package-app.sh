#!/bin/bash
#
# Package the app for deploying to a web host.

cd $(dirname $0)
SRCDIR=$PWD
PROGRAM=$(basename $0)

APPNAME=databuffer-ui
# use tag, if possible, otherwise use shortened SHA
VERSION=$(git describe --tags --exact-match 2>/dev/null || git rev-parse --short HEAD)
PKGNAME="$APPNAME-$VERSION"
PKGFILE="$PKGNAME.tar.gz"
SCPDEST=""

FLAG_FORCE=0
FLAG_SUMMARY=0
SKIP_CLEAN=0
SKIP_MANUAL=0
SKIP_TEST=0
SKIP_BUILD=0
SKIP_PACKAGE=0


print_help() {
  cat <<HERE
$PROGRAM [ OPTIONS ]

Prepare a package that is ready for deployment.
The following steps will be executed in this order, unless
skipped by an option:

  - Clean work area (i.e. clean caches and remove build outputs).
  - Run tests.
  - Run production build (i.e. minified).
  - Create the online manual.
  - Create a package for deployment.


OPTIONS
  --app-name      Override default app name.

  --app-version   Override default app version.

  -f,--force      Run, even if git working directory is not clean.

  -h,--help       Display these instructions.

  -s,--summary    Display summary information.

  --skip-build    Skip build. Use what is there.
                  Use this to package an existing development build.

  --skip-clean    Skip cleaning of work space.
                  Use this to package an existing development build.

  --skip-manual   Skip creating the online manual.
                  Use this to package an existing development build.

  --skip-package  Skip createing the package.

  --skip-test     Skip running tests.
HERE
}

summary() {
  cat <<HERE
## SUMMARY
## ----------------------------------------
## APPNAME:    $APPNAME
## VERSION:    $VERSION
## PKGNAME:    $PKGNAME
## PKGFILE:    $PKGFILE
## SRCDIR:     $SRCDIR
## ----------------------------------------
HERE
}

# parse_parameters
# see https://devhints.io/bash
while [[ "$1" =~ ^- && ! "$1" == "--" ]]; do case $1 in
  --app-version )
    shift; VERSION=$1
    ;;
  --app-name )
    shift; APPNAME=$1
    ;;
  -f | --force )
    FLAG_FORCE=1
    ;;
  -h | --help )
    print_help
    exit 0
    ;;
  -s | --summary )
    FLAG_SUMMARY=1
    ;;
  --skip-build )
    SKIP_BUILD=1
    ;;
  --skip-clean )
    SKIP_CLEAN=1
    ;;
  --skip-manual )
    SKIP_MANUAL=1
    ;;
  --skip-package )
    SKIP_PACKAGE=1
    ;;
  --skip-test )
    SKIP_TEST=1
    ;;
esac; shift; done
if [[ "$1" == '--' ]]; then shift; fi

if [[ -n "$1" ]]; then
  echo "$PROGRAM: Wrong usage. Try -h for instructions." >&2
  exit 1
fi

if [[ ! -z $(git status --porcelain) ]]; then
  echo "$PROGRAM: working directory is not clean" >&2
  if [[ $FLAG_FORCE == 1 ]]; then
    echo "$PROGRAM: proceeding on user request (--force)"
  else
    echo "$PROGRAM: commit your changes first!" >&2
    exit 1
  fi
fi


[[ $FLAG_SUMMARY == 1 ]] && summary

echo "## STEP:  CLEANING work space"
if [[ $SKIP_CLEAN == 1 ]]; then
  echo "#         Skipping on user request..."
else
	npm run clean || exit 1
fi
echo "#         Done."

echo "## STEP:  TEST app"
if [[ $SKIP_TEST == 1 ]]; then
  echo "#         Skipping on user request..."
else
	npm run test || exit 1
fi
echo "#         Done."

echo "## STEP:  BUILDING app"
if [[ $SKIP_BUILD == 1 ]]; then
  echo "#         Skipping on user request..."
else
	npm run build || exit 1
fi
echo "#         Done."

echo "## STEP:  BUILDING online manual"
if [[ $SKIP_MANUAL == 1 ]]; then
  echo "#         Skipping on user request..."
else
	pushd docs >/dev/null && mdbook build && popd >/dev/null || exit 1
fi
echo "#         Done."

echo "## STEP:  PACKAGING public/"
if [[ $SKIP_PACKAGE == 1 ]]; then
  echo "#         Skipping on user request..."
else
	pushd $SRCDIR/public >/dev/null || exit 1
	tar czvf $SRCDIR/$PKGFILE ./* || exit 1
	popd >/dev/null || exit 1
fi
echo "#         Done."

