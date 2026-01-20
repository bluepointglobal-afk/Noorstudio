#!/usr/bin/env bash
set -euo pipefail
[[ ! -f "SCOPE.md" ]] && echo "Web" && exit 0
TYPE="$(awk 'BEGIN{f=0}/^##[[:space:]]+Product[[:space:]]+Type/{f=1;next}f&&NF{print $1;exit}' SCOPE.md | tr -d '\r')"
case "$TYPE" in SaaS|Mobile|Web|API|Content) echo "$TYPE";; *) echo "Web";; esac
