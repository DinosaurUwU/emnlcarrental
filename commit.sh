#!/bin/bash

# Get the current date and time
timestamp=$(date +"%Y-%m-%d %H:%M:%S")

# Add all changes EXCEPT firebase.js
git add --all -- ':!src/app/lib/firebase.js'

# Commit with a default message
git commit -m "Update - $timestamp"

# Push to GitHub (change 'main' if your branch is different)
git push origin main

# Add client's repo as remote if not exists, then push
if ! git remote | grep -q "client"; then
  git remote add client https://github.com/Emnl-Car-Rental-Services/emnlcarrentalservices.git
fi

# Push to client (excluding firebase.js)
git push client main