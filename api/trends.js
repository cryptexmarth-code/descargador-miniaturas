export default async function handler(req, res) {
  // Configurar caché en Vercel por 2 horas (7200 segundos)
  res.setHeader('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Permitir pasar el país por query string (ej: /api/trends?geo=ES) -> por defecto DO
  const geo = req.query.geo ? req.query.geo.toUpperCase() : 'DO';

  try {
    // RSS de Google Trends según la región solicitada
    const trendsUrl = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`;
    
    // Usamos el servicio de conversión RSS a JSON
    const apiEndpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(trendsUrl)}`;
    
    const response = await fetch(apiEndpoint);
    const data = await response.json();

    if (data.status === 'ok') {
      return res.status(200).json({
        success: true,
        region: geo,
        items: data.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          description: item.description ? item.description.replace(/<[^>]*>?/gm, '') : ''
        }))
      });
    } else {
      throw new Error('No se pudo parsear el RSS de Google Trends');
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
