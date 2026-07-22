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

          // 1. Intentar capturar la imagen directa del RSS
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

          // 2. Si no hay imagen, analizamos el TÍTULO para asignarle una imagen dinámica y coherente
          if (!imageUrl && item.title) {
            const titleLower = item.title.toLowerCase();

            if (titleLower.includes('youtube') || titleLower.includes('video') || titleLower.includes('canal') || titleLower.includes('stream')) {
              // Imagen relacionada a video / streaming
              imageUrl = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=60';
            } else if (titleLower.includes('seo') || titleLower.includes('google') || titleLower.includes('ranking') || titleLower.includes('web') || titleLower.includes('trafico')) {
              // Imagen relacionada a SEO / analíticas
              imageUrl = 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=600&auto=format&fit=crop&q=60';
            } else if (titleLower.includes('ia') || titleLower.includes('inteligencia artificial') || titleLower.includes('gpt') || titleLower.includes('tecnologia') || titleLower.includes('app')) {
              // Imagen relacionada a Inteligencia Artificial / Código
              imageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60';
            } else if (titleLower.includes('dinero') || titleLower.includes('banco') || titleLower.includes('monetiz') || titleLower.includes('econom') || titleLower.includes('juez') || titleLower.includes('legal')) {
              // Imagen relacionada a finanzas / legal / noticias generales
              imageUrl = 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=60';
            } else {
              // Imagen genérica moderna de respaldo para noticias generales
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
