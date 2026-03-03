import os
import sys
import time

LOCK_FILE = "seo-engine/engine.lock"

def acquire_lock():
    if os.path.exists(LOCK_FILE):
        print(f"⚠️ CONCURRENCY ALERT: {LOCK_FILE} exists.")
        print("Another engine process is likely running. ABORTING to prevent REGISTRY corruption.")
        return False
    
    with open(LOCK_FILE, 'w') as f:
        f.write(str(time.time()))
    print("🔒 Lock acquired. Starting engine run...")
    return True

def release_lock():
    if os.path.exists(LOCK_FILE):
        os.remove(LOCK_FILE)
        print("🔓 Lock released.")
    else:
        print("Warning: Attempted to release a lock that didn't exist.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python lock_manager.py <acquire|release>")
        sys.exit(1)
    
    action = sys.argv[1].lower()
    if action == "acquire":
        if acquire_lock(): sys.exit(0)
        else: sys.exit(1)
    elif action == "release":
        release_lock()
        sys.exit(0)
    else:
        print("Invalid action.")
        sys.exit(1)
