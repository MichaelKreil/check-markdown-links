FROM alpine

COPY index.js package.json package-lock.json /action/

WORKDIR /action

RUN apk add --no-cache nodejs npm && npm i

WORKDIR /github/workspace

ENTRYPOINT ["node", "/action/index.js"]
