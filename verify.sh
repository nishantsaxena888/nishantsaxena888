#!/usr/bin/env bash
# verify.sh — static verification for the whole platform.
# Fast checks only (no dev servers needed). For browser smoke, start the
# dev servers and run: node fe/app/scripts/smoke-ui.mjs
set -e
cd "$(dirname "$0")"

echo "== backend: python syntax =="
be/.venv/bin/python -c "import ast, pathlib
[ast.parse(p.read_text()) for p in pathlib.Path('be').rglob('*.py')]"
echo "   ok"

echo "== frontend: tsc =="
(cd fe/app && npx tsc -b)
echo "   ok"

echo "== frontend: eslint (app + client boundary) =="
(cd fe/app && npx eslint . && cd .. && ./app/node_modules/.bin/eslint client)
echo "   ok"

echo "== mocks: registry/files/definitions =="
(cd fe/app && node scripts/check-mocks.mjs)
echo "   ok"

echo "== defs: page/component/session contract =="
(cd fe/app && node scripts/validate-defs.mjs)
echo "   ok"

echo "== unit/contract tests (vitest) =="
(cd fe/app && npx vitest run)
echo "   ok"

echo "ALL CHECKS PASS"
