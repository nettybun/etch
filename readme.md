# Etch

This is a collaborative drawing app that supports drawing with different tools,
canvas resizing, drawing offline, and changing colours. It runs over websockets
in either Node.js or Python (see other repo)

![](./demo.gif)

## Demo

You can access a demo version of Etch at http://etch.stayknit.ca. This is
running the Node.js implementation.

You can draw with the tools and open another browser tab/window to see that
actions are relayed to the other clients.

## Installing via Docker

I didn't publish this to Docker Hub. Sorry. I don't really believe in making an
account for that, and I host my own container repository locally on my server,
but it's password protected and I'd have to make credentials for you and tell
you how to write them into your ~/.docker/config.json and it's a whole mess.

Instead, here's a compressed tarball that you can tell your local Docker to turn
into an image. Name it anything you want. Nice and interoperable! If you're
curious it's based on the official Node.js 14.2 Docker image and I've just
dropped the compiled code in.

```
# 38MB Docker image of the compiled Node server/client
curl -L https://drive.stayknit.ca/s/j8Fs4HbnixGWdKm/download -o etch-docker-save.tar.gz
# Decompress inplace
gzip -d etch-docker-save.tar.gz
# Create image
docker load < etch-docker-save.tar
# Create container and run
docker run -it -p 3000:3000 registry.stayknit.ca/etch-alpine
```

Your output should be:

```
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 37.7M  100 37.7M    0     0  24.5M      0  0:00:01  0:00:01 --:--:-- 24.5M
570175f149e2: Loading layer  107.6MB/107.6MB
770786057cc0: Loading layer  7.658MB/7.658MB
10e1cb1c03c2: Loading layer  3.584kB/3.584kB
ab2f735c816e: Loading layer   2.56kB/2.56kB
14b43b09fdd5: Loading layer  208.9kB/208.9kB
3946cd8e9c2b: Loading layer  673.3kB/673.3kB
Loaded image: registry.stayknit.ca/etch-alpine:latest
Listening on:
  http://localhost:3000/
  http://172.17.0.2:3000/
```

Docker compose if you're interested:

```yml
version: "3.7"

services:
  etch:
    image: registry.stayknit.ca/etch-alpine
    container_name: etch
    hostname: etch
    networks:
      - proxy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.etch-http.entryPoints=http"
      - "traefik.http.routers.etch-http.rule=Host(`etch.stayknit.ca`)"

networks:
  proxy:
    external:
      name: proxy
```

## Installing via Git

```
git clone https://gitlab.csc.uvic.ca/courses/2020091/SENG350/teams/group_2/etch
cd etch
# Assuming you don't have Node/NPM
# Download a tool that helps you install versions of Node.js
curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n
bash n 14.2
# Should work...
node --version
# Download all dependencies for the client and server packages
npm install
# Start, in parallel, the client and server build/serve scripts
npm run start
```

After that any changes to the client code will recompile the client and notify
all connected clients to reload. Errors from connected client will appear in
your terminal. Any changes to server code will restart the server, and clients
will automatically reconnect after their connection drops.
