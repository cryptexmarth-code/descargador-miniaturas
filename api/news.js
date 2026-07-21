export default async function handler(req, res) {
  // Configurar caché en Vercel por 4 horas (14400 segundos)
  res.setHeader('Cache-Control', 'public, s-maxage=14400, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // URL del RSS de Google News en español (EE.UU.)
    const rssUrl = 'https://news.google.com/rss?hl=es-419&gl=US&ceid=US:es-419';
    
    // Usamos un servicio rápido y directo para parsear XML a JSON desde el servidor
    const apiEndpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    
    const response = await fetch(apiEndpoint);
    const data = await response.json();

    if (data.status === 'ok') {
      return res.status(200).json({
        success: true,
        items: data.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          description: item.description ? item.description.replace(/<[^>]*>?/gm, '') : ''
        }))
      });
    } else {
      throw new Error('No se pudo parsear el RSS de Google');
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
