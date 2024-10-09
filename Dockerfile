FROM alpine

COPY index.js package.json package-lock.json /action/

WORKDIR /action

RUN apk add --no-cache nodejs npm && npm i --include prod

WORKDIR /github/workspace

ENTRYPOINT ["node", "/action/src/index.js"]
