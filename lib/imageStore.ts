// Shared image store - in production, use Redis or Database
export const imageStore = new Map<string, { imageUrl: string; timestamp: number }>();

// Clean up old entries (older than 24 hours)
export function cleanupOldEntries() {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  for (const [id, data] of imageStore.entries()) {
    if (data.timestamp < oneDayAgo) {
      imageStore.delete(id);
    }
  }
}

export function storeImageData(id: string, imageUrl: string) {
  imageStore.set(id, { imageUrl, timestamp: Date.now() });
  cleanupOldEntries();
}

export function getImageData(id: string) {
  return imageStore.get(id);
}