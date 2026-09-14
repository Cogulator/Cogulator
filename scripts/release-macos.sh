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
readonly artifact_name="Cogulator-$architecture_label-$version.dmg"
readonly artifact_path="$release_dir/$artifact_name"

mkdir -p "$release_dir"
readonly work_dir="$(mktemp -d "$release_dir/.notarization.XXXXXX")"
readonly mount_path="$work_dir/mount"
is_mounted=false
cleanup() {
  if [[ "$is_mounted" == true ]]; then
    hdiutil detach "$mount_path" -quiet || true
  fi
  rm -rf "$work_dir"
}
trap cleanup EXIT

verify_disk_image_contents() {
  mkdir -p "$mount_path"
  hdiutil attach "$artifact_path" -readonly -nobrowse -mountpoint "$mount_path"
  is_mounted=true
  codesign --verify --deep --strict --verbose=2 "$mount_path/Cogulator.app"
  hdiutil detach "$mount_path"
  is_mounted=false
  rmdir "$mount_path"
}

cd "$project_dir"

echo "Building Cogulator $version for $architecture..."
npm run make -- --arch="$architecture"

if [[ ! -d "$app_path" ]]; then
  echo "Expected signed app was not created at $app_path" >&2
  exit 1
fi

echo "Signing finished app with the Developer ID certificate..."
./node_modules/.bin/electron-osx-sign "$app_path" --hardened-runtime

echo "Verifying Developer ID signature..."
codesign --verify --deep --strict --verbose=2 "$app_path"
echo "Signature verification passed. Notarization will perform Apple's Developer ID validation."

readonly developer_id_identity="$(security find-identity -v -p codesigning | sed -n '/"Developer ID Application:/ {s/.*"\(Developer ID Application:.*\)"/\1/p; q;}')"
if [[ -z "$developer_id_identity" ]]; then
  echo "No Developer ID Application signing identity was found." >&2
  exit 1
fi

echo "Creating signed disk image..."
rm -f "$artifact_path" "$artifact_path.sha256"
hdiutil create -volname "Cogulator" -srcfolder "$app_path" -format UDZO -ov "$artifact_path"
codesign --force --sign "$developer_id_identity" --timestamp "$artifact_path"
codesign --verify --verbose=2 "$artifact_path"
echo "Verifying app inside disk image..."
verify_disk_image_contents

echo "Submitting to Apple's notary service..."
xcrun notarytool submit "$artifact_path" --keychain-profile "$notary_profile" --wait

echo "Stapling notarization ticket to disk image..."
xcrun stapler staple "$artifact_path"
xcrun stapler validate "$artifact_path"

echo "Verifying stapled disk image..."
codesign --verify --verbose=2 "$artifact_path"
verify_disk_image_contents

shasum -a 256 "$artifact_path" > "$artifact_path.sha256"

echo "Release disk image: $artifact_path"
echo "Checksum: $artifact_path.sha256"
