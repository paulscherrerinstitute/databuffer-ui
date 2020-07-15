# source this file for common docker config items

DOCKERREGISTRY=${DOCKERREGISTRY:-docker.psi.ch:5000}
DOCKERIMAGE=${DOCKERIMAGE:-databuffer-ui}
DOCKERFULL=$DOCKERREGISTRY/$DOCKERIMAGE
