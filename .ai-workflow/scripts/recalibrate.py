#!/usr/bin/env python3
import json
import os
import re
import sys

def read_file(path):
    if not os.path.exists(path):
        return []
    with open(path, 'r', encoding='utf-8') as f:
        return f.readlines()

def get_roadmap_items():
    lines = read_file('ROADMAP.md')
    items = []
    for line in lines:
        # Match unchecked items: - [ ] ...
        match = re.match(r'^\s*-\s*\[\s*\]\s*(.*)', line)
        if match:
            items.append(match.group(1).strip())
            if len(items) >= 3:
                break
    return items

def get_last_session():
    lines = read_file('SESSION_LOG.md')
    # Skip header
    for line in reversed(lines):
        if line.strip().startswith('|') and not '---' in line and not 'Date' in line:
            parts = [p.strip() for p in line.split('|') if p.strip()]
            if len(parts) >= 4:
                 return {
                     "date": parts[0],
                     "agent": parts[1],
                     "action": parts[2],
                     "result": parts[3]
                 }
    return None

def main():
    roadmap = get_roadmap_items()
    last_session = get_last_session()
    
    summary = {
        "roadmap_top_3": roadmap,
        "last_session": last_session
    }
    
    print(json.dumps(summary, indent=2))

if __name__ == "__main__":
    main()
