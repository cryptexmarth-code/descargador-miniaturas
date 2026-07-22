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

          // 1. Revisar thumbnail directo o enclosure estándar
          if (item.thumbnail) {
            imageUrl = item.thumbnail;
          } else if (item.enclosure && item.enclosure.link) {
            imageUrl = item.enclosure.link;
          } 
          
          // 2. Buscar en el contenido HTML o descripción (etiquetas <img> o data-src)
          if (!imageUrl && (item.content || item.description)) {
            const textSource = item.content || item.description;
            // Busca tanto src como data-src (muy usado en lazy loading)
            const imgMatch = textSource.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
            if (imgMatch) {
              imageUrl = imgMatch[1];
            }
          }

          // 3. Validación de URLs relativas y limpieza de parámetros de Google News si aplica
          if (imageUrl && imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          }

          // 4. Si no hay imagen o la encontrada es un marcador/icono vacío, usar favicon como respaldo limpio
          if (!imageUrl && item.link) {
            try {
              const urlObj = new URL(item.link);
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

-  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
