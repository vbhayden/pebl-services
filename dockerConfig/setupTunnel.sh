#!/bin/sh

if [ $# -eq 4 ]; then
    mkdir -p ~/.ssh/
    ssh-keyscan $3 > ~/.ssh/known_hosts

    ssh -NT -o ServerAliveInterval=60 -o ExitOnForwardFailure=yes -i $2 -L "0.0.0.0:$4:127.0.0.1:$4" $1@$3
else
    echo "./setupTunnel.sh <username> <private key path> <target ip> <port>"
fi
