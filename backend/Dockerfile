# Use Node.js LTS as the base image
FROM node:lts

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]