FROM node:12.18.3-alpine
WORKDIR /usr/src/app
COPY . .

RUN npm install
RUN npm install pm2 -g
EXPOSE 5000

CMD [ "pm2-runtime", "ecosystem.config.js"]
