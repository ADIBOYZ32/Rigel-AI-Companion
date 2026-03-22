export async function getCachedAssetUrl(url: string): Promise<string> {
    if (!window.caches || url.startsWith('blob:') || url.startsWith('data:')) return url;
    
    try {
        const cache = await caches.open('rigel-assets-v1');
        let response = await cache.match(url);
        
        if (!response) {
            response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response.clone());
            } else {
                return url; // Fallback to original url on fetch error
            }
        }
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (err) {
        console.warn('Neural Cache Bypassed:', err);
        return url; // Fallback to original url if cache fails
    }
}
