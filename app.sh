#!/bin/bash
source $NVM_DIR/nvm.sh;
nvm use;
exec node --unhandled-rejections=strict app --port $1;
