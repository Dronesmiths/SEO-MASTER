import re
import hashlib
import json
import os
import sys

REGISTRY_PATH = "seo-engine/REGISTRY.json"

def get_skeleton_hash(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    skeleton = re.sub(r'<!-- START:REGION:.*? -->.*?<!-- END:REGION:.*? -->', '[REGION]', content, flags=re.DOTALL)
    return hashlib.sha256(skeleton.encode('utf-8')).hexdigest()

def rebaseline(slug):
    if not os.path.exists(REGISTRY_PATH):
        print(f"Error: Registry not found at {REGISTRY_PATH}")
        return False
    
    with open(REGISTRY_PATH, 'r') as f:
        registry = json.load(f)
    
    page = next((p for p in registry['pages'] if p['slug'] == slug), None)
    if not page:
        print(f"Error: Slug '{slug}' not found in registry.")
        return False
    
    file_path = page['url'].lstrip('/') + 'index.html'
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        return False
    
    new_hash = get_skeleton_hash(file_path)
    page['skeleton_hash'] = new_hash
    
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(registry, f, indent=4)
    
    print(f"✅ Re-baselined: {slug}")
    print(f"New Hash: {new_hash}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python rebaseline.py <slug>")
        sys.exit(1)
    
    target_slug = sys.argv[1]
    if rebaseline(target_slug):
        sys.exit(0)
    else:
        sys.exit(1)
