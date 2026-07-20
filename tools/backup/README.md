# Off-site backup stack (D1 + R2)

Backs up Cloudflare data to a store **outside** Cloudflare, so a suspended
account never means lost data. Code lives in GitHub; this covers what GitHub
does not: database rows (D1) and object storage (R2).

Pipeline: [`.github/workflows/backup.yml`](../../.github/workflows/backup.yml)
(daily cron + manual `workflow_dispatch`), running on GitHub Actions on purpose
so it survives a Cloudflare outage/ban.

## Why these primitives are portable

| Cloudflare | Really is | Restores onto |
|---|---|---|
| D1 | SQLite | any SQLite / libSQL / Turso |
| R2 | S3 API | Backblaze B2 / Wasabi / AWS S3 / self-hosted MinIO |

Nothing here is Cloudflare-proprietary, so "backup" and "exit plan" are the same
artifacts.

## Off-site target

Any S3-compatible store. **Backblaze B2** is the cheap default; Wasabi or AWS S3
also work. rclone is the engine, so the destination is swappable via secrets -
no code change to move providers.

## Setup (one time)

Create a bucket at your off-site provider, get S3 credentials, then set repo
**Secrets** and **Variables** (Settings -> Secrets and variables -> Actions) as
listed at the top of `backup.yml`. Then run the workflow manually once
(Actions -> Off-site backup -> Run workflow) to confirm it works.

## Manual / local backup

```bash
# D1 -> SQL dump
cd backend
npx wrangler@4 d1 export covenant-odyssey-db --remote --output ../backups/db.sql

# R2 -> off-site mirror (needs an rclone remote configured; see backup.yml env)
rclone sync R2:<bucket> OFF:<off-bucket>/r2/<bucket> -v
```

## Restore

### Back onto Cloudflare
```bash
# D1: import a dump into a (fresh) database
gunzip covenant-odyssey-db-YYYYMMDD-HHMMSS.sql.gz
npx wrangler@4 d1 execute covenant-odyssey-db --remote --file covenant-odyssey-db-*.sql

# R2: reverse the mirror
rclone sync OFF:<off-bucket>/r2/<bucket> R2:<bucket> -v
```

### OFF Cloudflare (the actual exit plan)
```bash
# D1 dump -> local SQLite, or push to Turso (libSQL)
gunzip -k covenant-odyssey-db-*.sql.gz
sqlite3 covenant.db < covenant-odyssey-db-*.sql          # plain SQLite
# turso db shell <name> < covenant-odyssey-db-*.sql       # Turso

# R2 mirror is already S3 at your off-site store - just repoint the app's
# S3 endpoint/credentials at OFF: (B2/Wasabi/S3) or a self-hosted MinIO.
```
The app then needs its data layer pointed at the new SQLite/libSQL + S3 endpoint.
Workers compute can move to another edge/runtime separately; the data is the part
that can't be re-derived, which is why it's backed up here.

## Notes / caveats

- R2->off-site copy streams through the Actions runner (download then upload).
  Fine for small/medium buckets; for very large R2 datasets, run rclone from a
  cheap always-on box instead of Actions, or shard the sync.
- Retention prunes D1 dumps older than `BACKUP_RETENTION_DAYS`. R2 uses `sync`
  (mirror), so deletes at source propagate - keep object versioning on at the
  destination if you want deletion protection.
- Reusable across your other projects: copy the workflow, change `D1_DATABASE`
  and the bucket variables. Same off-site account can hold all projects.
