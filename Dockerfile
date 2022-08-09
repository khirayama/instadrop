FROM node:18-slim
RUN apt-get update -y && apt-get upgrade -y && apt-get install -y --no-install-recommends make g++ python python3
WORKDIR /usr/src/app
COPY . ./
RUN npm install
RUN npm run build
CMD [ "npm", "start" ]
