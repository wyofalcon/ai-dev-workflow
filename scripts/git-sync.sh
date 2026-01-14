#!/bin/bash

# Git Sync Script
# This script automates the process of staging, committing, pulling, and pushing
# changes to a Git repository to make the workflow simpler and less error-prone.

# --- Helper Functions for Colored Output ---
# These functions add color to the output to make it easier to read.
print_header() {
    # Prints a blue header message.
    echo -e "\n\e[1;34m=================================================\e[0m"
    echo -e "\e[1;34m  $1\e[0m"
    echo -e "\e[1;34m=================================================\e[0m"
}

print_success() {
    # Prints a green success message.
    echo -e "✅ \e[32mSuccess:\e[0m $1"
}

print_error() {
    # Prints a red error message and exits the script.
    echo -e "❌ \e[1;31mError:\e[0m $1"
    exit 1
}

print_info() {
    # Prints a yellow informational message.
    echo -e "ℹ️  \e[33m$1\e[0m"
}


# --- Main Script ---

# Check if the current directory is a Git repository.
# If not, it prints an error and stops.
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    print_error "This is not a Git repository. Run 'git init' to create one."
fi

print_header "Git Sync Helper"

# --- Step 1: Stage Files ---
print_info "Staging all modified files..."
git add .
# Check if the 'git add' command was successful.
if [ $? -ne 0 ]; then
    print_error "Failed to stage files. Please check for issues."
fi
print_success "All files have been staged."
echo "" # Add a blank line for spacing

# --- Step 2: Get Commit Message ---
# Prompt the user to enter a descriptive commit message.
echo -e "💬 \e[1mPlease enter your commit message (and press Enter):\e[0m"
read commit_message

# Check if the user provided a message. If not, abort the commit.
if [ -z "$commit_message" ]; then
    print_error "Commit message cannot be empty. Aborting sync."
fi

# --- Step 3: Commit Changes ---
print_info "Committing changes..."
git commit -m "$commit_message"
# Check if the commit was successful. It might fail if there's nothing to commit.
if [ $? -ne 0 ]; then
    print_error "Failed to commit. There may be no changes to commit."
fi
print_success "Changes committed with message: \"$commit_message\""
echo ""

# --- Step 4: Pull from Remote ---
# Pulling ensures you have the latest changes from others before you push.
# This helps prevent merge conflicts.
print_info "Pulling latest changes from the remote repository..."
git pull
if [ $? -ne 0 ]; then
    print_error "Failed to pull from remote. Please resolve any merge conflicts manually."
fi
print_success "Local repository is now up-to-date."
echo ""

# --- Step 5: Push to Remote ---
# Pushing sends your committed changes to the remote repository (like GitHub).
print_info "Pushing your changes to the remote repository..."
git push
if [ $? -ne 0 ]; then
    print_error "Failed to push to remote. Check your network connection and permissions."
fi
print_success "All changes have been pushed successfully!"

print_header "Sync Complete"
