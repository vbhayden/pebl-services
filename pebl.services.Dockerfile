FROM node:14.7.0

COPY pebl-services/localhost.crt /ssl/fullchain.pem
COPY pebl-services/localhost.key /ssl/privkey.pem
COPY pebl-services/ca.pem /ssl/ca.pem

COPY pebl-services /srv

WORKDIR /srv/

RUN npm install --production \
	&& npm install -g typescript typescript-formatter \
	&& npm install @types/express --save-dev \
	&& npm run compile

COPY pebl-services/dockerConfig/startServices.sh /srv/startServices.sh
RUN mv dockerConfig/startServices.sh ./startServices.sh && chmod 755 ./startServices.sh

COPY pebl-services/src/sampleServerConfig.json /srv/dist/serverConfig.json

ENTRYPOINT ["/srv/startServices.sh"]
