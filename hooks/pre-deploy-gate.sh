#!/bin/bash
# PreToolUse hook — blocks deploy commands unless /checklist pre-deploy passed
# Reads JSON from stdin, checks for deploy patterns, verifies marker file exists.
# SECURITY: This script MUST fail closed — any parse error blocks deploy (exit 2).

INPUT=$(cat)

# Fail-closed: we need either jq or python3 to parse JSON
HAS_JQ=false
HAS_PY=false
command -v jq >/dev/null 2>&1 && HAS_JQ=true
command -v python3 >/dev/null 2>&1 && HAS_PY=true

if ! $HAS_JQ && ! $HAS_PY; then
    echo "Deploy blocked: neither jq nor python3 found — cannot parse hook input" >&2
    exit 2
fi

# Parse JSON fields — prefer jq, fall back to python3
if $HAS_JQ; then
    TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null) || TOOL_NAME=""
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null) || COMMAND=""
    SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null) || SESSION_ID="unknown"
    CWD=$(echo "$INPUT" | jq -r '.cwd // "."' 2>/dev/null) || CWD="."
elif $HAS_PY; then
    TOOL_NAME=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null) || TOOL_NAME=""
    COMMAND=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null) || COMMAND=""
    SESSION_ID=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('session_id','unknown'))" 2>/dev/null) || SESSION_ID="unknown"
    CWD=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('cwd','.'))" 2>/dev/null) || CWD="."
fi

# Fail-closed: if we couldn't parse the tool name, block
if [ -z "$TOOL_NAME" ]; then
    echo "Deploy blocked: failed to parse tool_name from hook input" >&2
    exit 2
fi

# Only check Bash commands
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

# Check if command matches deploy patterns
IS_DEPLOY=false
case "$COMMAND" in
  *"git push"*)           IS_DEPLOY=true ;;
  *"vercel --prod"*)      IS_DEPLOY=true ;;
  *"vercel deploy"*)      IS_DEPLOY=true ;;
  *"railway up"*)         IS_DEPLOY=true ;;
  *"railway deploy"*)     IS_DEPLOY=true ;;
  *"eas build"*)          IS_DEPLOY=true ;;
  *"eas submit"*)         IS_DEPLOY=true ;;
  *"npm publish"*)        IS_DEPLOY=true ;;
  *"docker push"*)        IS_DEPLOY=true ;;
  *"fly deploy"*)         IS_DEPLOY=true ;;
  *"az containerapp"*)    IS_DEPLOY=true ;;
esac

if [ "$IS_DEPLOY" = false ]; then
  exit 0
fi

# Check for marker file
MARKER_DIR="/tmp/.claude-checklist"

# Determine project path: if command starts with "cd /path && ...", use that path.
# Otherwise fall back to CWD. Agents often do "cd /project && git push" from ~.
PROJECT_DIR="$CWD"
CD_TARGET=$(echo "$COMMAND" | sed -n 's/^cd \([^ ]*\).*/\1/p')
if [ -n "$CD_TARGET" ] && [ -d "$CD_TARGET" ]; then
  PROJECT_DIR="$CD_TARGET"
fi

# Canonicalize to match check.sh (which does: cd "$PROJECT" && pwd)
# This prevents hash mismatches from symlinks, trailing slashes, or relative paths.
CWD_CANONICAL=$(cd "$PROJECT_DIR" 2>/dev/null && pwd) || CWD_CANONICAL="$PROJECT_DIR"
PROJECT_HASH=$(echo -n "$CWD_CANONICAL" | md5 2>/dev/null || echo -n "$CWD_CANONICAL" | md5sum 2>/dev/null | cut -d' ' -f1)
MARKER_FILE="$MARKER_DIR/${PROJECT_HASH}-${SESSION_ID}"
MARKER_FILE_UNKNOWN="$MARKER_DIR/${PROJECT_HASH}-unknown"

# Check session-specific marker first, then fall back to "unknown" marker.
# Agents can't determine their own session ID, so check.sh writes "unknown".
FOUND_MARKER=""
if [ -f "$MARKER_FILE" ]; then
  FOUND_MARKER="$MARKER_FILE"
elif [ -f "$MARKER_FILE_UNKNOWN" ]; then
  FOUND_MARKER="$MARKER_FILE_UNKNOWN"
fi

if [ -n "$FOUND_MARKER" ]; then
  # Marker exists — check it's not stale (older than 2 hours)
  if [ "$(uname)" = "Darwin" ]; then
    MARKER_AGE=$(( $(date +%s) - $(stat -f %m "$FOUND_MARKER") ))
  else
    MARKER_AGE=$(( $(date +%s) - $(stat -c %Y "$FOUND_MARKER") ))
  fi

  if [ "$MARKER_AGE" -gt 7200 ]; then
    echo "Deploy blocked: checklist marker is stale ($(( MARKER_AGE / 60 ))min old). Run /checklist pre-deploy again." >&2
    exit 2
  fi

  # Valid marker — allow deploy
  exit 0
fi

# No marker — block
echo "Deploy blocked: pre-deploy checklist has not been run in this session. Run /checklist pre-deploy first." >&2
exit 2
