export default async function handler(req, res) {
  // Configurar caché en Vercel por 4 horas (14400 segundos)
  res.setHeader('Cache-Control', 'public, s-maxage=14400, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Función auxiliar para buscar por término en Google News
    async function fetchCategory(query) {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=es-419&gl=US&ceid=US:es-419`;
      const apiEndpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
      const response = await fetch(apiEndpoint);
      const data = await response.json();
      
      if (data.status === 'ok') {
        return data.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          description: item.description ? item.description.replace(/<[^>]*>?/gm, '') : ''
        }));
      }
      return [];
    }

    // Consultamos términos clave enfocados en tu nicho SEO y de creadores
    const youtubeItems = await fetchCategory('YouTube algoritmo monetizacion');
    const seoItems = await fetchCategory('SEO posicionamiento web trafico');
    const techItems = await fetchCategory('inteligencia artificial herramientas digitales');

    return res.status(200).json({
      success: true,
      categories: {
        youtube: youtubeItems.slice(0, 4),
        seo: seoItems.slice(0, 4),
        tech: techItems.slice(0, 4)
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
