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
        return Promise.all(data.items.map(async (item) => {
          let imageUrl = item.thumbnail || '';

          // Si no hay miniatura, intentamos obtener la imagen OpenGraph (og:image) del artículo o usamos un servicio de favicon/screenshot dinámico
          if (!imageUrl && item.link) {
            try {
              // Usamos un servicio gratuito de miniaturas de webs basado en la URL del artículo
              const domain = new URL(item.link).hostname;
              imageUrl = `https://unavatar.io/${domain}`; // Extrae el logo/icono representativo de la fuente de la noticia de forma dinámica
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
        }));
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
        general: (await generalItems).slice(0, 4),
        youtube: (await youtubeItems).slice(0, 4),
        seo: (await seoItems).slice(0, 4),
        tech: (await techItems).slice(0, 4)
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
