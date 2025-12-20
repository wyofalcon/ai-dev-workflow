#!/usr/bin/env python3
import subprocess
import sys
import datetime

def run_command(command):
    try:
        result = subprocess.run(
            command,
            check=True,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(e.stderr)
        sys.exit(1)

def get_current_branch():
    return run_command("git rev-parse --abbrev-ref HEAD")

def log_session(action, result):
    date_str = datetime.date.today().strftime("%Y-%m-%d")
    log_entry = f"| {date_str} | Gemini | {action} | {result} |"
    
    with open("SESSION_LOG.md", "a") as f:
        f.write("\n" + log_entry)

def main():
    current_branch = get_current_branch()
    
    target_map = {
        "dev": "staging",
        "staging": "main"
    }
    
    if current_branch not in target_map:
        print(f"Current branch '{current_branch}' is not part of the promotion pipeline (dev -> staging -> main).")
        print("Please checkout 'dev' or 'staging' to promote.")
        sys.exit(1)
        
    target_branch = target_map[current_branch]
    
    print(f"\n🚀 Promotion Pipeline: {current_branch} -> {target_branch}")
    print("---------------------------------------------------")
    
    # Check for uncommitted changes
    status = run_command("git status --porcelain")
    if status:
        print("❌ You have uncommitted changes. Please commit or stash them first.")
        sys.exit(1)
        
    # Fetch latest
    print(f"📡 Fetching origin...")
    run_command("git fetch origin")
    
    # Ensure local is up to date
    print(f"🔄 Pulling latest {current_branch}...")
    run_command(f"git pull origin {current_branch}")
    
    # Check differences
    print(f"\n📊 Checking diffs between {target_branch} and {current_branch}...")
    try:
        # Check if target branch exists locally, if not track it
        run_command(f"git rev-parse --verify {target_branch} || git checkout -b {target_branch} origin/{target_branch}")
        # Switch back
        run_command(f"git checkout {current_branch}")
        
        diff_stat = run_command(f"git diff {target_branch}...{current_branch} --stat")
        if not diff_stat:
            print("✅ No changes to promote.")
            sys.exit(0)
            
        print(diff_stat)
    except Exception as e:
        print(f"⚠️ Could not generate diff (target branch might not exist yet). Proceeding...")
        
    print(f"\n🤖 AUDITOR CHECK (Claude):")
    print(f"   Please review the changes above.")
    print(f"   If approved, type 'yes' to merge {current_branch} into {target_branch} and push.")
    
    response = input(f"\nPromote to {target_branch}? (yes/no): ").lower().strip()
    
    if response != 'yes':
        print("❌ Promotion cancelled.")
        sys.exit(0)
        
    print(f"\n🚚 Merging {current_branch} into {target_branch}...")
    run_command(f"git checkout {target_branch}")
    run_command(f"git merge {current_branch}")
    
    print(f"🚀 Pushing {target_branch} to origin...")
    run_command(f"git push origin {target_branch}")
    
    print(f"🔙 Switching back to {current_branch}...")
    run_command(f"git checkout {current_branch}")
    
    # Log it
    log_msg = f"Promoted {current_branch} to {target_branch}"
    log_session("Promote Code", log_msg)
    print(f"\n✅ Success! {target_branch} has been updated. The CI/CD pipeline should trigger shortly.")
    print("📝 Session Log updated.")

if __name__ == "__main__":
    main()
