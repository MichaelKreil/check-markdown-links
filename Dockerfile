FROM node:22-slim

ADD . /action/

WORKDIR /action

RUN \
	npm i && \
	npm run build && \
	rm -r node_modules && \
	npm i --omit=dev && \
	rm -r ~/.npm

WORKDIR /github/workspace

ENTRYPOINT ["node", "/action/dist/index.js"]
