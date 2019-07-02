# Build the app
FROM node:12-alpine AS build

WORKDIR /var/app

COPY package.json /var/app

COPY yarn.lock /var/app

RUN yarn install

ADD . .

RUN yarn build

FROM nginx:1.15-alpine

# Add bash
RUN apk add --no-cache bash

# Default port exposure
EXPOSE 80

ADD nginx.conf /etc/nginx/nginx.conf
ADD entrypoint.sh /var/entrypoint.sh
ADD env.sh /var/env.sh

WORKDIR /var/www

COPY --from=build /var/app/build /var/www

ENTRYPOINT ["/var/entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
