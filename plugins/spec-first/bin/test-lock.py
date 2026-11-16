#!/usr/bin/env python3
"""The spec-first plugin's hook: while .spec-lock exists in the project, refuse edits to test files.

Claude Code runs it before every Edit, Write or MultiEdit (hooks/hooks.json) and sends the tool call as JSON on stdin.
Exit 0 lets the edit through; exit 2 blocks it, and what is written to stderr is shown to Claude Code as the reason.

A test file is one whose name contains .test. or .spec., ends in _test.<ext>, starts with test_, or sits in a
tests/, test/ or __tests__/ folder. Fails open: if anything here goes wrong, the edit is allowed, so a broken hook
never stops all work in the project.
"""
import json
import os
import re
import sys

TEST_FILE = re.compile(r"(\.(test|spec)\.[^/]+$)|(_test\.[^/]+$)|((^|/)test_[^/]+$)|((^|/)(tests?|__tests__)/)")


def main():
    try:
        call = json.load(sys.stdin)
        path = (call.get("tool_input") or {}).get("file_path") or ""
        root = call.get("cwd") or os.getcwd()
    except Exception:
        return 0
    if not path or not TEST_FILE.search(path.replace(os.sep, "/")):
        return 0
    lock = os.path.join(root, ".spec-lock")
    if not os.path.exists(lock):
        return 0
    sys.stderr.write(
        f"spec-first: {os.path.basename(path)} is a test file, and the tests are locked (.spec-lock) while the "
        "feature is built. Change the code so the test passes. If the test itself is wrong, stop and tell the user "
        "which test and why; only the user removes .spec-lock to change it.\n")
    return 2


if __name__ == "__main__":
    sys.exit(main())
