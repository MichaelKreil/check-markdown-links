FROM alpine

ADD . /action/

WORKDIR /action

RUN \
   apk add --no-cache nodejs npm && \
	npm i && \
	npm run build && \
	rm -r node_modules && \
	npm i --omit=dev && \
	rm -r ~/.npm

WORKDIR /github/workspace

ENTRYPOINT ["node", "/action/dist/index.js"]
