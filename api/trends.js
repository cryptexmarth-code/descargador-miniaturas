export default async function handler(req, res) {
    // Permitir CORS por si acaso
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { geo = 'DO' } = req.query;

    try {
        const rssUrl = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`;
        const response = await fetch(rssUrl);
        
        if (!response.ok) {
            throw new Error(`Google Trends respondió con estado ${response.status}`);
        }

        const xmlText = await response.text();
        const items = [];

        // Extraer cada bloque <item> del RSS
        const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);

        for (const match of itemMatches) {
            const itemContent = match[1];

            // Extraer título
            const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
            // Extraer tráfico de búsqueda aproximado
            const trafficMatch = itemContent.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/);
            // Extraer enlace de la noticia/tendencia
            const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);

            if (titleMatch) {
                let title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
                let traffic = trafficMatch ? trafficMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '+10K búsquedas';
                let link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : 'https://trends.google.com';

                items.push({ title, traffic, link });
            }
        }

        return res.status(200).json({ success: true, items });

    } catch (error) {
        console.error("Error al obtener tendencias:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
