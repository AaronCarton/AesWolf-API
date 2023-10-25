FROM  node:16.14.0-alpine As build
WORKDIR /app

# install build tools (for canvas)
RUN apk add --update --no-cache \
    build-base \
    cairo-dev \
    pango-dev \
    libpng-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build app
COPY . .
RUN npm run build

# Clean modules & nstall production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Set NODE_ENV environment variable
ENV NODE_ENV production


FROM node:16.14.0-alpine As production
WORKDIR /app

RUN apk add  --no-cache cairo pango libjpeg giflib librsvg

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# # Start the server using the production build
CMD [ "node", "dist/main.js" ]