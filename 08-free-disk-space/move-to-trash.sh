#!/bin/bash
# Moves the approved items to the Trash (never deletes). Re-measured 2026-11-16.
set -u
T="$HOME/.Trash/cleanup-2026-11-16"
mkdir -p "$T/node_modules" "$T/Library-Caches"
cd "$HOME" || exit 1

# node_modules in 42 projects with no file or git change in 30+ days
for p in remix-notes-app sidenav-test hummingbird-pipeline highview pickla-v2 zonar-ui-sidenav \
  redact-1-web zonar-shell-api highview-proxy test arches-2.0 patchman cache-api zonar-ui-auth \
  maintenance-frontend self-service-1 discuss-link-info notes-app-from-scratch highview-ionic \
  cloud-react connect4 notes-app redact-1-api nextjs-supabase-email-client site hummingbird-test \
  ect2-web keycloak-deepdive-client-old zonar-ui-searchable-dropdown gpt-pro zput pong tcp-gateway \
  nextjs-dashboard zonar-ui-auth-1 krabs zonar-battlecards master-electron rag-service-ts \
  keycloak-deepdive-client less-is-more zonar-shell-client; do
  [ -d "$p/node_modules" ] && mv "$p/node_modules" "$T/node_modules/$p" || echo "skipped $p"
done

# Caches and build caches
mv ~/.nvm/.cache                                "$T/nvm-cache"
mv ~/procurement-sciences/chatbot-ui/.next/cache "$T/chatbot-ui-next-cache"
mv ~/gpt-pro/.angular/cache                     "$T/gpt-pro-angular-cache"
mv ~/.gradle/caches                             "$T/gradle-caches"
mv ~/.npm/_cacache                              "$T/npm-cacache"
# Contents of ~/Library/Caches (protected Apple folders will refuse; that's fine)
for c in ~/Library/Caches/* ~/Library/Caches/.[!.]*; do
  [ -e "$c" ] && mv "$c" "$T/Library-Caches/" 2>/dev/null
done

# Ask-list items you said yes to
mv ~/.wrangler/logs                             "$T/wrangler-logs"
mv ~/java_error_in_webstorm.hprof               "$T/"
mv ~/Downloads/AcroRdrSCADC2400320112_MUI.dmg   "$T/"

df -h /
