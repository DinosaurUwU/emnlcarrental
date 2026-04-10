#!/bin/bash

# Get the current date and time
timestamp=$(date +"%Y-%m-%d %H:%M:%S")

# Add all changes EXCEPT firebase.js
git add --all -- ':!src/app/lib/firebase.js'

# Commit with a default message
git commit -m "Update - $timestamp"

# Push to your repo (change 'main' if your branch is different)
git push origin main

# Add client's repo (remove first to avoid duplicates)
git remote remove client 2>/dev/null || true
git remote add client https://github.com/Emnl-Car-Rental-Services/emnlcarrentalservices.git

# Push to client
git push client main