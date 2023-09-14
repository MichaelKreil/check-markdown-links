# Container image that runs your code
FROM alpine

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY index.js package.json package-lock.json /action

WORKDIR /app

RUN apk add --no-cache nodejs npm && \
    npm i

ENTRYPOINT ["node", "index.js"]
