#!/bin/bash

# Push to client's repo (production ready)
# First ensure firebase.js is excluded from push

# Add client's repo
git remote remove client 2>/dev/null || true
git remote add client https://github.com/Emnl-Car-Rental-Services/emnlcarrentalservices.git

# Push to client
git push client main

echo "✅ Pushed to client's repo!"