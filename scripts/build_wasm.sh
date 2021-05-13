#! /usr/bin/env bash

set -e

num_jobs=4
if [ -f /proc/cpuinfo ]; then
    num_jobs=$(grep ^processor /proc/cpuinfo | wc -l)
fi

cd libwally-core

./tools/cleanup.sh && ./tools/autogen.sh
source ../emsdk/emsdk_env.sh # we need to source emsdk in container

export CFLAGS="-fno-stack-protector"
emconfigure ./configure --build=$HOST_OS ac_cv_c_bigendian=no --with-field=32bit --with-scalar=32bit --with-bignum=no --disable-swig-python --disable-swig-java --enable-elements --disable-ecmult-static-precomputation --disable-tests
emmake make -j $num_jobs

: ${OPTIMIZATION_LEVEL:=3}
: ${EXTRA_EXPORTED_RUNTIME_METHODS:="['getValue', 'setValue', 'ccall']"}
: ${EXPORTED_FUNCTIONS:="['_malloc','_free','_wally_init','_wally_cleanup','_wally_elements_pegin_contract_script_from_bytes']"}

mkdir -p wally_dist

emcc -O$OPTIMIZATION_LEVEL \
-s "EXPORTED_RUNTIME_METHODS=$EXTRA_EXPORTED_RUNTIME_METHODS" \
-s "EXPORTED_FUNCTIONS=$EXPORTED_FUNCTIONS" \
-s FILESYSTEM=0 \
-s SINGLE_FILE=1 \
-s MODULARIZE=1 \
./src/.libs/*.o src/secp256k1/src/*.o src/ccan/ccan/*/.libs/*.o src/ccan/ccan/*/*/.libs/*.o \
-o wally_dist/wallycore.js \
