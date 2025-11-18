#!/bin/bash

# Get the production deployment URL
PROD_URL=$(vercel ls | grep 'Ready  *Production' | awk '{print $2}')

# Get the commit SHA from the production deployment
COMMIT_SHA=$(vercel inspect $PROD_URL | grep 'Commit' | awk '{print $2}')

# Check out the production commit
git checkout $COMMIT_SHA

# Run vercel dev
vercel dev
