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
        return data.items.map(item => {
          let imageUrl = '';

          // 1. Revisar si viene en el thumbnail directo
          if (item.thumbnail) {
            imageUrl = item.thumbnail;
          } 
          // 2. Revisar si viene en enclosure (multimedia adjunta de RSS)
          else if (item.enclosure && item.enclosure.link) {
            imageUrl = item.enclosure.link;
          } 
          // 3. Buscar etiquetas <img> dentro del contenido o descripción completa
          else if (item.content) {
            const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch) imageUrl = imgMatch[1];
          } else if (item.description) {
            const imgMatchDesc = item.description.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatchDesc) imageUrl = imgMatchDesc[1];
          }

          // 4. Si de plano no hay imagen en el RSS, generamos una miniatura limpia basada en el dominio de la fuente
          if (!imageUrl && item.link) {
            try {
              const urlObj = new URL(item.link);
              // Usamos un servicio de captura limpia del icono/og-image o la dejamos vacía para control CSS
              imageUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
            } catch (e) {
              imageUrl = '';
            }
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
