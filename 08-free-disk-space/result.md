# The real run on Joel's Mac, 2026-11-16

- Before: 12 GB free (`df -h /System/Volumes/Data`: 884 GB used of 926).
- Scan (`scan.md`): about 50 GB safe (caches, build output, node_modules in 42 projects untouched 30+ days), 68 GB of
  Cloudflare Wrangler logs, and an Ask list.
- Joel's answers: yes to the safe list, the Wrangler logs, a WebStorm crash dump (2.6 GB) and an Acrobat installer;
  no to repos.zip (20 GB), the week's video takes (~20 GB), simulators, emulators, models and other videos.
- Moved to the Trash: 120 GB (`move-to-trash.sh`). After emptying it, free space was still 12 GB: 16 Time Machine local
  snapshots held the deleted files (no backup drive is attached). `tmutil thinlocalsnapshots` released them.
- After: 146 GB free (751 GB used).
- Nightly job installed: launchd `com.claude-code-shorts.free-disk-space`, 3:00, caches and week-old tool logs only;
  first run freed 165 MB.
