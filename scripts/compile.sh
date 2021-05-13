#!/bin/bash

# build the pegin container
docker build -t wallycore . -f ./resources/Dockerfile.libwally

# run the container as wallycore-pegin
docker run --name wallycore-pegin -d -i wallycore

# copy libwally-core and build script to container
docker cp ./libwally-core/. wallycore-pegin:/libwally-core
docker cp ./scripts/build_wasm.sh wallycore-pegin:/libwally-core

# launch the build_wasm.sh script
docker exec wallycore-pegin bash libwally-core/build_wasm.sh

# remove former version of wallycore.js
rm ./resources/wallycore.js

# move the newly crafted wallycore.js to resources folder
docker cp wallycore-pegin:/libwally-core/wally_dist/wallycore.js ./resources/wallycore.js

# stop and remove the container
docker stop wallycore-pegin
docker rm wallycore-pegin