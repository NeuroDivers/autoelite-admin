#!/bin/bash

# Create a .npmrc file with the auth token
echo "@neurodivers:registry=https://npm.pkg.github.com" > .npmrc
echo "//npm.pkg.github.com/:_authToken=${NPM_AUTH_TOKEN}" >> .npmrc

# Install dependencies
npm install

# Disable treating warnings as errors
export CI=false

# Build the project
npm run build
