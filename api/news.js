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
        // Usamos Promise.all para consultar la imagen real de cada enlace en paralelo
        const itemsPromises = data.items.map(async (item) => {
          let imageUrl = '';

          // 1. Intentar rescatar la imagen tradicional del RSS si por milagro viene ahí
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

          // 2. Si el RSS no trae imagen, consultamos a Microlink usando el enlace de la noticia para extraer su imagen real de Open Graph
          if (!imageUrl && item.link) {
            try {
              const microlinkRes = await fetch(`https://api.microlink.co/?url=${encodeURIComponent(item.link)}`);
              const microlinkData = await microlinkRes.json();
              if (microlinkData.status === 'success' && microlinkData.data && microlinkData.data.image) {
                imageUrl = microlinkData.data.image.url;
              }
            } catch (err) {
              // Si falla Microlink, pasamos al siguiente respaldo
            }
          }

          // 3. Respaldo definitivo: si todo lo demás falla, usamos el favicon de alta calidad del dominio
          if (!imageUrl && item.link) {
            try {
              const urlObj = new URL(item.link);
              imageUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=256`;
            } catch (e) {
              imageUrl = '';
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

        return await Promise.all(itemsPromises);
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
