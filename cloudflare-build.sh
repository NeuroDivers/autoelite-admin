#!/bin/bash

# Print debug information
echo "Starting custom build script..."
echo "NPM_AUTH_TOKEN is ${NPM_AUTH_TOKEN:0:3}...${NPM_AUTH_TOKEN: -3}"

# Create a .npmrc file with the auth token
echo "@neurodivers:registry=https://npm.pkg.github.com" > .npmrc
echo "//npm.pkg.github.com/:_authToken=${NPM_AUTH_TOKEN}" >> .npmrc

echo "Created .npmrc file:"
cat .npmrc

# Alternative approach: Use npm config directly
echo "Setting npm config directly..."
npm config set @neurodivers:registry https://npm.pkg.github.com
npm config set //npm.pkg.github.com/:_authToken ${NPM_AUTH_TOKEN}

# Install dependencies
echo "Installing dependencies..."
npm install

# Disable treating warnings as errors
export CI=false

# Build the project
echo "Building project..."
npm run build
