#!/bin/bash


## Take down the actual PeBL Services stuff
docker-compose down

docker-compose run certbot \
	renew --webroot \
	--register-unsafely-without-email \
	--file docker-compose-certbot.yml \
	--agree-tos \
	--no-random-sleep-on-renew \
	--webroot-path=/data/letsencrypt

## Take the placeholder Nginx container down
docker-compose rm nginx

## Bring the PeBL Services stuff back up
docker-compose up -d
