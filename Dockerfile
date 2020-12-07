FROM node:14.2-alpine

WORKDIR /opt/app/

COPY packages/client/serve ./packages/client/serve
COPY packages/server/serve ./packages/server/serve

EXPOSE 3000

ENTRYPOINT ["node", "packages/server/serve/index.js"]
