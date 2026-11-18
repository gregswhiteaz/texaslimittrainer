#!/bin/bash
# Judge probe: break one config at a time in a copy of the clone and confirm the builder's tests catch it.
ROOT="$1"
mk() { S=$(mktemp -d "${TMPDIR:-/tmp}/judge-mut.XXXX"); (cd "$ROOT" && tar cf - --exclude=node_modules --exclude=dist --exclude=backlog --exclude=dreams --exclude=doit --exclude=reports --exclude=research_notes --exclude=.git .) | (cd "$S" && tar xf -); ln -s "$ROOT/node_modules" "$S/node_modules"; echo "$S"; }
mut() { local name="$1" edit="$2" tests="$3"; local S=$(mk); (cd "$S" && eval "$edit" && npx vitest run $tests) > "$S.out" 2>&1; local ec=$?; echo "== $name: vitest exit=$ec (expect non-zero)"; grep -E "Test Files|Tests " "$S.out"; rm -rf "$S" "$S.out"; }
mut "warning-only lint probe" "printf \"import { useEffect } from 'react';\n\nexport function C({ v }: { v: number }) {\n  useEffect(() => {\n    console.log(v);\n  }, []);\n  return <p />;\n}\n\" > src/ui/w.tsx; npx eslint . --max-warnings 0; echo eslint_exit=\$?; false" "tests/unit"
mut "M1 strict off" "sed -i '' 's/\"strict\": true/\"strict\": false/' tsconfig.json" "tests/toolchain/typecheck.test.ts"
mut "M2 boundary removed" "sed -i '' 's/^  headlessBoundaryConfig,$//' eslint.config.js && grep -c headlessBoundaryConfig eslint.config.js" "tests/toolchain/boundary.test.ts"
mut "M3 thresholds removed" "sed -i '' \"s/thresholds: .*/thresholds: {},/\" vite.config.ts" "tests/toolchain/coverage.test.ts"
mut "M4 prettier dropped from lint" "sed -i '' 's/ \&\& prettier --check \.//' package.json && grep '\"lint\"' package.json" "tests/toolchain/lint.test.ts"
mut "M5 src tests not discovered" "sed -i '' \"s#include: \['src/\*\*/\*.test.{ts,tsx}', #include: [#\" vite.config.ts && grep include vite.config.ts" "tests/toolchain/test-command.test.ts"
mut "M6 one global missing (window)" "sed -i '' \"s/'navigator',/'navigator',\n  ].filter((n) => n !== 'window'), ...[/\" tools/lint/headless-boundary.js" "tests/toolchain/boundary.property.test.ts"
