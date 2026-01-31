#!/bin/bash

# Get the current date and time
timestamp=$(date +"%Y-%m-%d %H:%M:%S")

# Add all changes
git add .

# Commit with a default message
git commit -m "Update - $timestamp"

# Push to GitHub (change 'main' if your branch is different)
git push origin main
