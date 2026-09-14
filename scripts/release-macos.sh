#!/usr/bin/env bash

set -euo pipefail

readonly project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly architecture="${1:-}"
readonly notary_profile="${NOTARY_PROFILE:-Cogulator_2026}"

case "$architecture" in
  arm64)
    readonly architecture_label="Apple-Silicon"
    ;;
  x64)
    readonly architecture_label="Apple-Intel"
    ;;
  *)
    echo "Usage: npm run release:mac -- <arm64|x64>" >&2
    exit 64
    ;;
esac

readonly node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
if [[ "$node_major" != "22" ]]; then
  echo "Release builds require Node 22. Run 'nvm use 22' and try again." >&2
  exit 1
fi

readonly version="$(node -p "require('./package.json').version")"
readonly app_path="$project_dir/out/Cogulator-darwin-$architecture/Cogulator.app"
readonly release_dir="$project_dir/out/release"
readonly artifact_name="Cogulator-$architecture_label-$version.zip"
readonly artifact_path="$release_dir/$artifact_name"

mkdir -p "$release_dir"
readonly work_dir="$(mktemp -d "$release_dir/.notarization.XXXXXX")"
trap 'rm -rf "$work_dir"' EXIT

cd "$project_dir"

echo "Building and signing Cogulator $version for $architecture..."
npm run make -- --arch="$architecture"

if [[ ! -d "$app_path" ]]; then
  echo "Expected signed app was not created at $app_path" >&2
  exit 1
fi

echo "Verifying Developer ID signature..."
codesign --verify --deep --strict --verbose=2 "$app_path"
echo "Signature verification passed. Notarization will perform Apple's Developer ID validation."

readonly submission_zip="$work_dir/Cogulator-$architecture-$version-notarization.zip"
echo "Creating notarization archive..."
ditto -c -k --keepParent "$app_path" "$submission_zip"

echo "Submitting to Apple's notary service..."
xcrun notarytool submit "$submission_zip" --keychain-profile "$notary_profile" --wait

echo "Stapling notarization ticket..."
xcrun stapler staple "$app_path"
xcrun stapler validate "$app_path"

echo "Confirming Gatekeeper acceptance..."
spctl --assess --type execute --verbose=2 "$app_path"

echo "Creating final release archive..."
rm -f "$artifact_path" "$artifact_path.sha256"
ditto -c -k --keepParent "$app_path" "$artifact_path"
shasum -a 256 "$artifact_path" > "$artifact_path.sha256"

echo "Release artifact: $artifact_path"
echo "Checksum: $artifact_path.sha256"
