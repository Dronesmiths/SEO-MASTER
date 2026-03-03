import re
import hashlib
import sys
import os
import json

REGISTRY_PATH = "seo-engine/REGISTRY.json"

def get_skeleton_hash(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    skeleton = re.sub(r'<!-- START:REGION:.*? -->.*?<!-- END:REGION:.*? -->', '[REGION]', content, flags=re.DOTALL)
    return hashlib.sha256(skeleton.encode('utf-8')).hexdigest()

def verify_by_slug(slug):
    if not os.path.exists(REGISTRY_PATH):
        print("Error: Registry not found.")
        return False
    
    with open(REGISTRY_PATH, 'r') as f:
        registry = json.load(f)
    
    page = next((p for p in registry['pages'] if p['slug'] == slug), None)
    if not page or 'skeleton_hash' not in page:
        print(f"Error: No hash found for slug {slug}")
        return False
    
    file_path = page['url'].lstrip('/') + 'index.html'
    return verify_integrity(file_path, page['skeleton_hash'])

def verify_integrity(file_path, original_hash):
    current_hash = get_skeleton_hash(file_path)
    if current_hash == original_hash:
        print(f"✅ Integrity Verified: {file_path}")
        return True
    else:
        print(f"❌ INTEGRITY FAILURE: {file_path} has drifted!")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_integrity.py <slug> OR <file_path> <hash>")
        sys.exit(1)
    
    if len(sys.argv) == 2:
        # Verify by slug
        if verify_by_slug(sys.argv[1]): sys.exit(0)
        else: sys.exit(1)
    else:
        # Traditional verify
        if verify_integrity(sys.argv[1], sys.argv[2]): sys.exit(0)
        else: sys.exit(1)
