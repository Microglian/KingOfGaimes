// Tracks which cards have been exported as PNG since their last save/update.
// Stored in module scope (session-persistent).
const downloadedSet = new Set();

export function markDownloaded(cardId) {
  if (cardId) downloadedSet.add(cardId);
}

export function clearDownloaded(cardId) {
  if (cardId) downloadedSet.delete(cardId);
}

export function isDownloaded(cardId) {
  return downloadedSet.has(cardId);
}
