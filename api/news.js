export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=14400, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    async function fetchFeed(urlOrQuery, isSearch = true) {
      const url = isSearch 
        ? `https://news.google.com/rss/search?q=${encodeURIComponent(urlOrQuery)}&hl=es-419&gl=US&ceid=US:es-419`
        : urlOrQuery;
        
      const apiEndpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
      const response = await fetch(apiEndpoint);
      const data = await response.json();
      
      if (data.status === 'ok') {
        return data.items.map((item) => {
          let imageUrl = '';

          // 1. Intentar capturar la imagen directa del RSS (thumbnail, enclosure o HTML interno)
          if (item.thumbnail) {
            imageUrl = item.thumbnail;
          } else if (item.enclosure && item.enclosure.link) {
            imageUrl = item.enclosure.link;
          } else if (item.content) {
            const imgMatch = item.content.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
            if (imgMatch) imageUrl = imgMatch[1];
          } else if (item.description) {
            const imgMatchDesc = item.description.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
            if (imgMatchDesc) imageUrl = imgMatchDesc[1];
          }

          // 2. Regla de respaldo inteligente por dominio o temática si el RSS no trae imagen
          if (!imageUrl && item.link) {
            try {
              const urlObj = new URL(item.link);
              const domain = urlObj.hostname.toLowerCase();

              // Asignación limpia según la fuente o palabras clave en el título/enlace
              if (domain.includes('youtube') || domain.includes.google) {
                imageUrl = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=60';
              } else if (domain.includes('xataka') || domain.includes('tech') || domain.includes('infobae')) {
                imageUrl = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60';
              } else {
                // Imagen genérica corporativa y moderna de respaldo para cualquier otro dominio
                imageUrl = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=60';
              }
            } catch (e) {
              imageUrl = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=60';
            }
          }

          if (imageUrl && imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          }

          return {
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            description: item.description ? item.description.replace(/<[^>]*>?/gm, '') : '',
            image: imageUrl
          };
        });
      }
      return [];
    }

    const generalItems = await fetchFeed('https://news.google.com/rss?hl=es-419&gl=US&ceid=US:es-419', false);
    const youtubeItems = await fetchFeed('YouTube algoritmo monetizacion', true);
    const seoItems = await fetchFeed('SEO posicionamiento web trafico', true);
    const techItems = await fetchFeed('inteligencia artificial herramientas digitales', true);

    return res.status(200).json({
      success: true,
      categories: {
        general: generalItems.slice(0, 4),
        youtube: youtubeItems.slice(0, 4),
        seo: seoItems.slice(0, 4),
        tech: techItems.slice(0, 4)
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
