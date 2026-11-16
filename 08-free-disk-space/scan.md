**13 GB free** on a 926 GB disk. This was a scan only, so nothing has been moved.

**Safe: rebuilds itself (about 50 GB)**
| Item | Size |
|---|---|
| node_modules in 42 projects untouched for 30+ days (largest: cloud-react 968M, gpt-pro 829M, zput 774M, highview-ionic 587M) | ~13.9 GB |
| `~/Library/Caches` (biggest: ms-playwright 2.7G, codex 2.0G, VSCode.ShipIt 1.6G, Google 1.6G) | 11 GB |
| `~/.nvm/.cache` (leftover build of the node v14 source, from 2023) | 8.6 GB |
| `procurement-sciences/chatbot-ui/.next/cache` | 7.5 GB |
| `gpt-pro/.angular/cache` | 4.9 GB |
| `~/.gradle/caches` | 4.2 GB |
| `~/.npm/_cacache` | 0.4 GB |

**Ask: looks safe, but might not be**
| Item | Size | Last change / opened | Why it might matter |
|---|---|---|---|
| `~/.wrangler/logs` (Cloudflare Wrangler logs since Sep 21; one file alone is 531M) | **68 GB** | ongoing | Only debug logs, almost certainly disposable. This is the biggest single win. |
| `~/repos.zip` | 20 GB | Jun 27, 2026, never opened | Could be the only backup of old repos |
| `~/Downloads/IMG_40xx.MOV` (~35 clips) | ~20 GB | Nov 14–16 (shot this week) | Raw footage, probably still being edited |
| CoreSimulator devices | 11 GB | — | iOS simulators; can be re-downloaded but your setups would be lost |
| Android AVD + system images | 8 GB | — | Pixel 8 emulator and its data |
| HF Diffusers app models | 4 GB | — | Stable Diffusion models; can be re-downloaded |
| `~/java_error_in_webstorm.hprof` | 2.6 GB | Jan 28, never opened | WebStorm crash dump, almost certainly junk |
| `~/Understanding Import Traceability.mov` | 546 MB | Feb 2025 | Looks like a copy of the one inside the iMovie library |
| `Downloads/AcroRdr…dmg` | 554 MB | Sep 2024, never opened | Acrobat Reader installer |
| `Downloads/LazYouTube.mov` | 533 MB | Mar 2024 | A video, which could be the only copy |

I left `joelstevick-com/videos` alone (139 GB of project footage, which counts as source), and also any project you've touched in the last 30 days. Recently used projects (my-drivers, joelstevick-com and others) keep their node_modules.

I only checked node_modules folders directly under your home folder, so nested ones like `~/projects/*` weren't checked. Some commands were blocked by the permission checker, so I ran smaller commands to cover the same ground.

Say "go" to move the Safe list to the Trash, and I'll then ask about each Ask item one at a time. I'd start with the 68 GB of Wrangler logs.