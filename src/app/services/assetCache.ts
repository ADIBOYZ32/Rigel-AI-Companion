const CACHE_VERSION = 'rigel-assets-v2';

export async function getCachedAssetUrl(url: string): Promise<string> {
    if (!window.caches || url.startsWith('blob:') || url.startsWith('data:')) return url;
    
    try {
        // Purge old cache versions on first run
        const allCaches = await caches.keys();
        for (const name of allCaches) {
            if (name.startsWith('rigel-assets-') && name !== CACHE_VERSION) {
                await caches.delete(name);
            }
        }

        const cache = await caches.open(CACHE_VERSION);
        let response = await cache.match(url);
        
        if (!response) {
            response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response.clone());
            } else {
                return url;
            }
        }
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (err) {
        console.warn('Neural Cache Bypassed:', err);
        return url;
    }
}
