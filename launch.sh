#!/bin/bash

yes | cp -rf sources/pokemon-ui/app/src/config/original.json sources/pokemon-ui/app/src/config/settings.json

sed -i -e "s/server/$(docker-machine ip)/g" sources/pokemon-ui/app/src/config/settings.json
 
# To build the Dockerfile in nginx, we need to have the folder app inside nginx folder
rm -Rf nginx/app
cp -Rf sources/pokemon-ui/app nginx/app

docker-compose build

docker-compose up