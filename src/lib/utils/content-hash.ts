/**
 * djb2 hash function for content fingerprinting.
 * Used to skip no-op autosaves when content hasn't changed.
 */
export function djb2Hash(content: string): number {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) | 0; // hash * 33 + char
  }
  return hash >>> 0; // Convert to unsigned 32-bit
}

/**
 * Check if content has changed since last save by comparing hashes.
 */
export function hasContentChanged(content: string, lastHash: number | null): boolean {
  if (lastHash === null) return true;
  return djb2Hash(content) !== lastHash;
}
