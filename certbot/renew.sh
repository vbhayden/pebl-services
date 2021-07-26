#!/bin/bash


docker-compose run certbot \
	renew --webroot \
	--register-unsafely-without-email \
	--file docker-compose-certbot.yml \
	--agree-tos \
	--no-random-sleep-on-renew \
	--webroot-path=/data/letsencrypt

