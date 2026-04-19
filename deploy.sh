#!/bin/bash
# ─────────────────────────────────────────────────────────
#  Residence Fitness Club — Vercel Deploy Script
# ─────────────────────────────────────────────────────────
#  Usage: bash deploy.sh          (first deploy)
#         bash deploy.sh --prod   (promote to production)
# ─────────────────────────────────────────────────────────

set -e

TEAM_SLUG="varcoplays-projects"
PROJECT_NAME="residence-fitness-club"

echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │   Residence Fitness Club — Deploying    │"
echo "  └─────────────────────────────────────────┘"
echo ""

# Check Vercel CLI installed
if ! command -v vercel &> /dev/null; then
  echo "  Installing Vercel CLI..."
  npm install -g vercel
fi

# Login check
echo "  Checking Vercel auth..."
vercel whoami --scope "$TEAM_SLUG" 2>/dev/null || vercel login

echo ""

# Deploy
if [[ "$1" == "--prod" ]]; then
  echo "  Deploying to PRODUCTION..."
  vercel deploy --prod \
    --scope "$TEAM_SLUG" \
    --name "$PROJECT_NAME" \
    --yes
else
  echo "  Deploying preview (add --prod for production)..."
  vercel deploy \
    --scope "$TEAM_SLUG" \
    --name "$PROJECT_NAME" \
    --yes
fi

echo ""
echo "  ✓ Done! Check the URL above."
echo ""
