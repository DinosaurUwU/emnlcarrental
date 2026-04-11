#!/bin/bash

# Get the current date and time
timestamp=$(date +"%Y-%m-%d %H:%M:%S")

# Add all changes EXCEPT firebase.js
git add --all -- ':!src/app/lib/firebase.js'

# Commit with a default message
git commit -m "Update - $timestamp"

# Push to YOUR repo only (for development)
git push origin main