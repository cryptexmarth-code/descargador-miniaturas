export default async function handler(req, res) {
    // 1. Configurar Cabeceras CORS (Permitir que tu web consulte esta API)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejar petición pre-flight (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, platform } = req.query;

    // Validar parámetros básicos
    if (!url || !platform) {
        return res.status(400).json({ error: 'URL y Plataforma requeridas' });
    }

    // Cabeceras simuladas de navegador para evitar bloqueos
    const browserHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    };

    try {
        console.log(`Procesando ${platform}: ${url}`);

        // --- LÓGICA TIKTOK ---
        if (platform === 'tiktok') {
            // Limpiar URL de TikTok de parámetros de rastreo
            const cleanTiktokUrl = url.split('?')[0];
            const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanTiktokUrl)}`;
            
            const response = await fetch(oembedUrl, { headers: browserHeaders });

            if (response.ok) {
                const data = await response.json();
                if (data.thumbnail_url) {
                    console.log("Imagen TikTok obtenida");
                    return res.status(200).json({ imgUrl: data.thumbnail_url });
                }
            }
            console.error("TikTok oEmbed falló:", response.status);
        }

        // --- LÓGICA KICK ---
        if (platform === 'kick') {
            // Limpiar URL de Kick
            const cleanKickUrl = url.split('?')[0];
            
            // Usamos oEmbed público de Kick, no su API privada bloqueada
            const kickOembedUrl = `https://kick.com/oembed?url=${encodeURIComponent(cleanKickUrl)}`;
            
            const response = await fetch(kickOembedUrl, { headers: browserHeaders });

            if (response.ok) {
                const data = await response.json();
                if (data.thumbnail_url) {
                    // Kick a veces devuelve URLs de imágenes relativas, las hacemos absolutas
                    let img = data.thumbnail_url;
                    if (img.startsWith('/')) {
                        img = `https://kick.com${img}`;
                    }
                    console.log("Imagen Kick obtenida");
                    return res.status(200).json({ imgUrl: img });
                }
            }
            console.error("Kick oEmbed falló:", response.status);
        }

        // --- LÓGICA TWITCH (Ya funcionaba) ---
        if (platform === 'twitch') {
            const cleanTwitchUrl = url.split('?')[0];
            // Clips
            if (cleanTwitchUrl.includes('/clip/')) {
                const clipId = cleanTwitchUrl.split('/clip/')[1];
                return res.status(200).json({ imgUrl: `https://clips-media-assets2.twitch.tv/${clipId}-preview-480x272.jpg` });
            }
            // Canales en vivo
            const channel = cleanTwitchUrl.split('twitch.tv/')[1]?.replace('/', '');
            if (channel) {
                return res.status(200).json({ imgUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel.toLowerCase()}-1920x1080.jpg` });
            }
        }

        // Si llega aquí, algo falló
        return res.status(404).json({ error: 'No se pudo extraer la imagen de este enlace' });

    } catch (err) {
        console.error("Error Servidor:", err.message);
        return res.status(500).json({ error: 'Error interno consultando la plataforma' });
    }
}
