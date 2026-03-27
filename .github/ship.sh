#!/usr/bin/env zsh
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI required"
  exit 1
fi

branch="$(git branch --show-current)"
issue_number="${1:-}"

if [[ -z "$branch" ]]; then
  echo "No current branch"
  exit 1
fi

if [[ "$branch" == "main" ]]; then
  echo "Refusing to ship from main"
  exit 1
fi

git push -u origin "$branch"

if ! gh pr view "$branch" >/dev/null 2>&1; then
  gh pr create --fill
fi

if [[ -n "$issue_number" ]]; then
  pr_body="$(gh pr view "$branch" --json body --jq '.body')"
  closes_text="Closes #$issue_number"

  if [[ "$pr_body" != *"$closes_text"* ]]; then
    if [[ -n "$pr_body" ]]; then
      pr_body="${pr_body}

${closes_text}"
    else
      pr_body="$closes_text"
    fi

    gh pr edit "$branch" --body "$pr_body"
  fi
fi

gh pr merge "$branch" --squash --delete-branch

git checkout main
git pull --ff-only origin main
