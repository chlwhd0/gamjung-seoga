#!/bin/bash
git config --global --add safe.directory /app/applet
git add -A
if ! git diff-index --quiet HEAD --; then
  COMMIT_MSG="${1:-update: $(date '+%Y-%m-%d %H:%M:%S') 코드 업데이트}"
  git commit -m "$COMMIT_MSG"
  git push origin main
  echo "GitHub 동기화 완료: $(date)"
else
  echo "변경된 파일이 없어 동기화가 최신 상태입니다."
fi
