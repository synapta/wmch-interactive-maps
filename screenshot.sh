#!/bin/bash
source $NVM_DIR/nvm.sh;
nvm use;
exec node --unhandled-rejections=strict screenshot --port $1;
