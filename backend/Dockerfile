# Use Node.js LTS as the base image
FROM node:lts-slim

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY --chown=node:node . .

RUN mkdir -p uploads && chown -R node:node uploads

USER node

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
