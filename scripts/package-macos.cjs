const fs = require('node:fs/promises');
const path = require('node:path');
const packager = require('@electron/packager');
const config = require('../package.json');

async function main() {
  const [output, architecture] = process.argv.slice(2);
  if (!output || !['arm64', 'x64', 'universal'].includes(architecture)) {
    throw new Error('Usage: node scripts/package-macos.cjs <output-directory> <arm64|x64|universal>');
  }
  const options = config.config.forge.packagerConfig;
  let sharedIconCatalog;
  const afterComplete = [...(options.afterComplete || [])];
  if (architecture === 'universal') {
    afterComplete.push((buildPath, _electronVersion, platform, sliceArchitecture, done) => {
      if (platform !== 'darwin' || sliceArchitecture === 'universal') return done();
      const catalog = path.join(buildPath, `${config.productName}.app`, 'Contents/Resources/Assets.car');
      // Icon Composer can embed different IDs on each compilation. Reuse one
      // catalog for both unsigned slices before universal merging and signing.
      // Store the promise before awaiting so concurrent builds use the same bytes.
      sharedIconCatalog ??= fs.readFile(catalog).catch(error => {
        if (error.code === 'ENOENT') return null; // Legacy .icns-only builds.
        throw error;
      });
      sharedIconCatalog.then(contents => contents ? fs.writeFile(catalog, contents) : undefined)
        .then(() => done(), done);
    });
  }
  const paths = await packager({
    ...options,
    dir: path.resolve(__dirname, '..'), name: config.productName, platform: 'darwin',
    arch: architecture, out: path.resolve(output),
    electronVersion: require('electron/package.json').version,
    prune: true, afterComplete,
  });
  console.log(paths.join('\n'));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
