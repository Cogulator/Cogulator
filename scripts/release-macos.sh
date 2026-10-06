#!/usr/bin/env bash
set -euo pipefail

readonly project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
case "${1:-}" in
  --universal|universal) readonly architecture="universal" ;;
  arm64|x64) readonly architecture="$1" ;;
  *) echo "Usage: npm run release:mac -- <--universal|arm64|x64> [--local-only]" >&2; exit 64 ;;
esac
readonly notary_profile="${NOTARY_PROFILE:-Cogulator_2026}"
readonly mode="${2:-}"
case "$mode" in ''|--local-only) ;; *) echo "Unknown option: $mode" >&2; exit 64 ;; esac
if [[ "$(node -p 'process.versions.node.split(".")[0]')" != "24" ]]; then
  echo "Release builds require Node 24. Run 'nvm use 24' and try again." >&2
  exit 1
fi
cd "$project_dir"
readonly release_dir="$project_dir/out/release"
mkdir -p "$release_dir"
readonly work_dir="$(mktemp -d "$release_dir/.zip-build-$architecture.XXXXXX")"
readonly app_path="$work_dir/build/Cogulator-darwin-$architecture/Cogulator.app"
readonly version="$(node -p "require('./package.json').version")"
readonly artifact_name="Cogulator-darwin-$architecture-$version.zip"
readonly archive_path="$work_dir/$artifact_name"
readonly artifact_path="$release_dir/$artifact_name"
cleanup() {
  local status=$?
  if [[ "$status" == "0" ]]; then
    rm -rf "$work_dir"
  else
    echo "Release failed; diagnostic files retained at: $work_dir" >&2
  fi
}
trap cleanup EXIT

readonly identity="$(security find-identity -v -p codesigning | sed -n '/"Developer ID Application:/ {s/.*"\(Developer ID Application:.*\)"/\1/p; q;}')"
if [[ -z "$identity" ]]; then echo "No Developer ID Application signing identity found." >&2; exit 1; fi

echo "Building Cogulator $version for $architecture..."
node scripts/prepare-embeddings.js
node scripts/package-macos.cjs "$work_dir/build" "$architecture"

if [[ "$architecture" == "universal" ]]; then
  echo "Verifying Intel and Apple Silicon executable slices..."
  for binary in "$app_path/Contents/MacOS/Cogulator" "$app_path/Contents/Frameworks/Electron Framework.framework/Versions/A/Electron Framework"; do
    slices=" $(lipo -archs "$binary") "
    if [[ "$slices" != *" x86_64 "* || "$slices" != *" arm64 "* ]]; then
      echo "Missing a required universal slice: $binary ($slices)" >&2
      exit 1
    fi
  done
fi

verify_signature() {
  echo "Checking signature: $1"
  codesign --verify --deep --strict --all-architectures --verbose=2 "$2" 2>&1 | tee "$work_dir/$1-signature.log"
  codesign --display --verbose=4 "$2" 2> "$work_dir/$1-details.log"
}

echo "Signing the completed app..."
./node_modules/.bin/electron-osx-sign "$app_path" --identity="$identity" --hardened-runtime
verify_signature signed "$app_path"

echo "Checking ZIP extraction before notarization..."
ditto -c -k --sequesterRsrc --keepParent "$app_path" "$work_dir/submission.zip"
ditto -x -k "$work_dir/submission.zip" "$work_dir/before-stapling"
verify_signature initial-extraction "$work_dir/before-stapling/Cogulator.app"

if [[ "$mode" == --local-only ]]; then
  echo "Local signing and ZIP extraction checks passed. No release artifact was created."
  exit 0
fi

echo "Submitting the ZIP to Apple's notary service..."
xcrun notarytool submit "$work_dir/submission.zip" --keychain-profile "$notary_profile" --wait --output-format json | tee "$work_dir/notary-result.json"
submission_id="$(node -e 'const r=require(process.argv[1]); if(r.status!=="Accepted") throw new Error(`Notarization ${r.status}`); console.log(r.id)' "$work_dir/notary-result.json")"
readonly submission_id
xcrun notarytool log "$submission_id" --keychain-profile "$notary_profile" "$work_dir/notary-log.json"

echo "Stapling the app, then immediately checking its signature..."
xcrun stapler staple "$app_path" 2>&1 | tee "$work_dir/stapling.log"
verify_signature stapled "$app_path"
xcrun stapler validate "$app_path" 2>&1 | tee "$work_dir/staple-validation.log"

echo "Creating the final ZIP from the stapled app..."
ditto -c -k --sequesterRsrc --keepParent "$app_path" "$archive_path"
ditto -x -k "$archive_path" "$work_dir/final-extraction"
readonly extracted_app="$work_dir/final-extraction/Cogulator.app"
verify_signature final-extraction "$extracted_app"
xcrun stapler validate "$extracted_app" 2>&1 | tee "$work_dir/extracted-staple.log"
spctl --assess --type execute --verbose=4 "$extracted_app" 2>&1 | tee "$work_dir/gatekeeper.log"
if command -v syspolicy_check >/dev/null; then
  syspolicy_check distribution "$extracted_app" 2>&1 | tee "$work_dir/distribution.log"
fi
# Expose a release artifact only after every check succeeds.
cp "$work_dir/notary-log.json" "$artifact_path.notary-log.json"
mv -f "$archive_path" "$artifact_path"
shasum -a 256 "$artifact_path" > "$artifact_path.sha256"
echo "Verified release ZIP: $artifact_path"
echo "Checksum: $artifact_path.sha256"
