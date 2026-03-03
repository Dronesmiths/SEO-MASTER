# Handover: SEO Factory Engine

## 🏗 System Architecture
The SEO Factory is a portable, static-site SEO engine designed for agentic maintenance.

### Key Components:
- **/seo-engine/ANALYTICS/**: Stores GSC performance snapshots.
- **`seo-engine/engine.lock`**: Process sentinel to prevent concurrent writes.
- **/seo-engine/REGISTRY.json**: The source of truth for all pages, including their unique "Skeleton Hashes."
- **/seo-engine/SCRIPTS/**:
  - `lock_manager.py`: Concurrency protection.
  - `verify_integrity.py`: Automated drift protection.
  - `rebaseline.py`: Use this if you intentionally modify the site's structural HTML (e.g., adding a tracking tag).

## 🛡 Safety Protocols
### 0. Concurrency Safety
Always run `python3 seo-engine/SCRIPTS/lock_manager.py acquire` before starting a task. If it fails, another agent is working. DO NOT force the run.

### 1. Region Locking
The engine only modifies content between `<!-- START:REGION:TAG -->` and `<!-- END:REGION:TAG -->`. 
**Agent Rule**: Never modify or remove these markers. Never edit HTML outside these markers unless explicitly re-baselining.

### 2. Checksum Enforcement
Before any reinforcement run, the engine verifies the `skeleton_hash` in `REGISTRY.json` against the physical file. If they don't match, the engine will (and should) abort to prevent corrupting manual edits.

## 🚀 Portability Guide
To drop this into a new project:
1. Copy the `/seo-engine` directory.
2. Update `COMPANY.json` and `PILLARS.json`.
3. Ensure the host project has a `/blog/` directory or equivalent.
4. Run `TASK_DAILY.md` to start the generation cycle.

## 🧹 Maintenance
- Delete `SCRIPTS/migrate_legacy_pages.py` after the first initialization (done).
- Regularly pipe GSC data into `ANALYTICS/GSC_PULL.json` to trigger the reinforcement engine.
