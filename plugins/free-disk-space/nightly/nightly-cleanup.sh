#!/bin/bash
# Nightly cleanup from the free-disk-space plugin: removes only caches that rebuild themselves.
# Never touches node_modules, projects, documents, downloads or videos. Logs one line per run.
set -u
LOG="$HOME/Library/Logs/free-disk-space-nightly.log"
before=$(df -k /System/Volumes/Data | awk 'NR==2{print $4}')

clear_dir() {                          # empty a cache folder, keep the folder itself
  [ -d "$1" ] && find "$1" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null
}
clear_dir "$HOME/.npm/_cacache"
clear_dir "$HOME/Library/Caches/pip"
clear_dir "$HOME/Library/Caches/Homebrew"
clear_dir "$HOME/Library/Developer/Xcode/DerivedData"
clear_dir "$HOME/.nvm/.cache"
# Tool logs older than 7 days (Cloudflare Wrangler's grew to 68 GB)
[ -d "$HOME/.wrangler/logs" ] && find "$HOME/.wrangler/logs" -type f -mtime +7 -delete 2>/dev/null

after=$(df -k /System/Volumes/Data | awk 'NR==2{print $4}')
freed=$(( (after - before) / 1024 ))
echo "$(date '+%Y-%m-%d %H:%M') freed ${freed} MB, free now $(( after / 1024 / 1024 )) GB" >> "$LOG"
