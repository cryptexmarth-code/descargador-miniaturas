export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const geo = req.query.geo ? req.query.geo.toUpperCase() : 'DO';

  try {
    // Usamos el feed oficial diario de Google Trends en formato RSS XML
    const rssUrl = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`;
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al conectar con Google Trends (${response.status})`);
    }

    const xmlText = await response.text();
    
    // Parseo manual rápido y seguro de XML a JSON en Node.js (sin dependencias externas)
    const items = [];
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) ||;

    for (const itemStr of itemMatches) {
      const titleMatch = itemStr.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemStr.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemStr.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      
      // Extraer tráfico de búsqueda si está disponible en el RSS
      const trafficMatch = itemStr.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/);
      
      // Extraer imágenes o noticias relacionadas si existen
      const newsItemTitleMatch = itemStr.match(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/);
      const newsItemUrlMatch = itemStr.match(/<ht:news_item_url>([\s\S]*?)<\/ht:news_item_url>/);

      if (titleMatch) {
        // Limpiar entidades HTML comunes (como &amp;, &#39;, etc.)
        const cleanTitle = titleMatch[1]
          .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"');

        items.push({
          title: cleanTitle,
          link: linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : `https://trends.google.com/trends/trendingsearches/daily?geo=${geo}`,
          traffic: trafficMatch ? trafficMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'Tendencia activa',
          newsTitle: newsItemTitleMatch ? newsItemTitleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : '',
          newsUrl: newsItemUrlMatch ? newsItemUrlMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : ''
        });
      }
    }

    return res.status(200).json({
      success: true,
      region: geo,
      total: items.length,
      items: items
    });

  } catch (error) {
    console.error("Error en API Trends:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      items: [] 
    });
  }
}
