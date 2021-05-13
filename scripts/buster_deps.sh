#! /usr/bin/env bash
set -e

dpkg --add-architecture i386

apt-get update -qq
apt-get upgrade -yqq
apt-get install git uncrustify python{,3}-distutils-extra python{,3}-dev build-essential libffi-dev swig autoconf libtool pkg-config lib32z1 openjdk-11-jdk ca-certificates-java unzip curl libc6:i386 libc6-dev:i386 libncurses5:i386 libstdc++6:i386 lib32z1 virtualenv python{,3}-setuptools apt-transport-https -yqq
update-java-alternatives -s java-1.11.0-openjdk-amd64

git clone https://github.com/juj/emsdk.git
cd emsdk
./emsdk install 2.0.9
./emsdk activate 2.0.9
source ./emsdk_env.sh

apt-get remove --purge curl unzip apt-transport-https -yqq
apt-get -yqq autoremove
apt-get -yqq clean
rm -rf /var/lib/apt/lists/* /var/cache/* /tmp/* /usr/share/locale/* /usr/share/man /usr/share/doc /lib/xtables/libip6*
