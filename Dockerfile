FROM node:8-alpine

# Installs latest Chromium package.
RUN echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories \
	&& echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories \
	&& apk add --no-cache \
	chromium@edge \
	harfbuzz@edge \
	nss@edge \
	&& rm -rf /var/cache/*

RUN apk add --no-cache make gcc g++ python

# Add user
RUN mkdir -p /usr/src/app \
	&& adduser -D non_privileged_user \
	&& chown -R non_privileged_user:non_privileged_user /usr/src/app

USER non_privileged_user
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json ./
COPY yarn.lock ./
COPY .yarnrc ./

ARG npm_token
ENV ENV_NPMT=$npm_token
RUN npm config set //npm.api.haus/:_authToken ${ENV_NPMT}

RUN yarn install

RUN yarn add @xxorg/google-play-plugin @xxorg/app-store-plugin @xxorg/app-annie-plugin

# Bundle app source
COPY . .

RUN yarn bundle
RUN rm -rf src/

EXPOSE 7006
CMD [ "yarn", "start" ]
