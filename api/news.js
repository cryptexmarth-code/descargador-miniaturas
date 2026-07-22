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
        // Procesamos cada item aplicando múltiples estrategias de rescate de imágenes
        const itemsPromises = data.items.map(async (item) => {
          let imageUrl = '';

          // Estrategia 1: Thumbnail o Enclosure directo del RSS
          if (item.thumbnail) {
            imageUrl = item.thumbnail;
          } else if (item.enclosure && item.enclosure.link) {
            imageUrl = item.enclosure.link;
          } 

          // Estrategia 2: Regex exhaustiva en contenido o descripción (src, data-src, srcset)
          if (!imageUrl && (item.content || item.description)) {
            const textSource = item.content || item.description;
            const imgMatch = textSource.match(/<img[^>]+(?:src|data-src)=["']([^"'#]+)["']/i);
            if (imgMatch) {
              imageUrl = imgMatch[1];
            } else {
              // Buscar URLs sueltas de imágenes dentro de etiquetas de medios o atributos anidados
              const urlMatch = textSource.match(/(https?:\/\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp))/i);
              if (urlMatch) imageUrl = urlMatch[1];
            }
          }

          // Ajuste de protocolos incompletos tipo '//'
          if (imageUrl && imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          }

          // Estrategia 3: Si aún no hay imagen, intentamos un enlace alternativo o miniatura de previsualización web basada en servicios públicos de Open Graph / Favicon dinámico de alta calidad
          if (!imageUrl && item.link) {
            try {
              const urlObj = new URL(item.link);
              // Usamos un servicio de captura de iconos corporativos grandes o previsualización de dominio
              imageUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=256`;
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
