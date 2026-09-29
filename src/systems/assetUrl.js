// Appends the build ID so a new deploy never serves stale cached assets.
// Phaser's loader has no built-in query-string option, so every load call goes through this.
export const BUILD_ID = __BUILD_ID__;

export function assetUrl(path) {
  return `${path}?v=${BUILD_ID}`;
}
