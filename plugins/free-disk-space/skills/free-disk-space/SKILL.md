---
name: free-disk-space
description: Free up disk space on a Mac. Measure where the space went, move to the Trash only what rebuilds itself (caches, build output, node_modules in projects not touched for 30 days), and ask the user one item at a time about large files that look safe to delete but might not be. Use when the user is out of disk space, asks to free up space or storage, or asks what is using their disk.
argument-hint: [optional: "scan only" to just show the plan]
allowed-tools: Bash(df:*), Bash(du:*), Bash(find:*), Bash(stat:*), Bash(ls:*), Bash(mdls:*)
---

# Free up disk space

## 1. Measure first

- `df -h /`: how much is free now. Say it in one line.
- Size the usual places with `du -sh` (skip any that don't exist):
  `~/Library/Caches`, `~/Library/Developer/Xcode/DerivedData`, `~/Library/Developer/CoreSimulator/Caches`,
  `~/.npm/_cacache`, `~/Library/Caches/pip`, `~/Library/Caches/Homebrew`, `~/.gradle/caches`, `~/.cargo/registry`,
  `~/Downloads`, `~/Movies`, `~/Library/Containers/com.docker.docker`.
- Find `node_modules` folders under the home folder whose project hasn't been touched in 30 days
  (`find ~ -name node_modules -type d -prune -maxdepth 6`, then the project folder's last change).
- Find large single files: `find ~ -type f -size +500M` (skip `~/Library/Mobile Documents` and Photos libraries).

## 2. Sort everything into two lists

**Safe: rebuilds itself.** Caches, Xcode DerivedData, simulator caches, package manager caches, and `node_modules`
in projects untouched for 30 days (`npm install` brings them back). Deleting these loses nothing but time.

Inside `~/Library/Caches`, leave out tool installs that live there but don't rebuild on their own, and put them on
the Ask list instead: `ms-playwright` and `Cypress` (test browsers; tests fail until `npx playwright install` or
`npx cypress install` runs again), and anything an app needs to start.

**Ask: looks safe, might not be.** Large files in Downloads (installers, zips, videos), large videos anywhere,
virtual machines, Docker images, archives. Each could be the only copy of something.

**Never touch:** anything in a git repository that isn't committed, source code, Documents, Desktop, Photos, Mail,
iCloud Drive, keychains, application support data, and anything you can't explain.

## 3. Show the plan, then act

Show the Safe list with each item's size and its total, and the Ask list with each item's size, last opened date
(`mdls -name kMDItemLastUsedDate`), and why it might matter. If the user said "scan only", stop here.

- **Safe list:** on one OK from the user, move each item to the Trash (`mv <item> ~/.Trash/`), never `rm`.
- **Ask list:** ask about each item, one at a time, with its size and why it might matter. Move it to the Trash
  only on a yes for that item.

## 4. Report

Say what was moved, how much, and `df -h /` again. Space only comes back when the Trash is emptied: say so, and
offer to empty it (that one is permanent, so wait for a clear yes).

## 5. Offer the nightly job

Offer to keep the caches from piling up again: copy `${CLAUDE_PLUGIN_ROOT}/nightly/nightly-cleanup.sh` to
`~/bin/`, fill its path into `${CLAUDE_PLUGIN_ROOT}/nightly/com.claude-code-shorts.free-disk-space.plist`, copy that
to `~/Library/LaunchAgents/`, and `launchctl load` it. It runs at 3:00 each night, removes only caches that rebuild
themselves (npm, pip, Homebrew, Xcode build output, the nvm source cache) and tool logs older than 7 days, and logs one
line to `~/Library/Logs/free-disk-space-nightly.log`. It never touches node_modules, projects, Downloads or videos.
Install it only on the user's yes; it's a standing job on their Mac.
