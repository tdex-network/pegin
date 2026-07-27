#! /usr/bin/env bash
set -e

dpkg --add-architecture i386

# buster is EOL and its packages moved to archive.debian.org
sed -i \
    -e 's|http://deb.debian.org/debian|http://archive.debian.org/debian|g' \
    -e 's|http://security.debian.org/debian-security|http://archive.debian.org/debian-security|g' \
    /etc/apt/sources.list
sed -i '/buster-updates/d' /etc/apt/sources.list

apt-get -o Acquire::Check-Valid-Until=false update -qq
apt-get upgrade -yqq
apt-get install git uncrustify python{,3}-distutils-extra python{,3}-dev build-essential libffi-dev swig autoconf libtool pkg-config lib32z1 openjdk-11-jdk ca-certificates-java unzip curl libc6:i386 libc6-dev:i386 libncurses5:i386 libstdc++6:i386 lib32z1 virtualenv python{,3}-setuptools apt-transport-https -yqq
update-java-alternatives -s java-1.11.0-openjdk-amd64

# pin emsdk to the same release we install: current emsdk requires
# python >= 3.10, newer than buster's python 3.7
git clone --branch 2.0.9 --depth 1 https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install 2.0.9
./emsdk activate 2.0.9
source ./emsdk_env.sh

apt-get remove --purge curl unzip apt-transport-https -yqq
apt-get -yqq autoremove
apt-get -yqq clean
rm -rf /var/lib/apt/lists/* /var/cache/* /tmp/* /usr/share/locale/* /usr/share/man /usr/share/doc /lib/xtables/libip6*
