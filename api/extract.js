export default async function handler(req, res) {
    const { url, platform } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL requerida' });
    }

    try {
        // Lógica para Twitch Stream / Clip
        if (platform === 'twitch') {
            const cleanUrl = url.split('?')[0];
            if (cleanUrl.includes('/clip/')) {
                const clipId = cleanUrl.split('/clip/')[1];
                return res.status(200).json({ imgUrl: `https://clips-media-assets2.twitch.tv/${clipId}-preview-480x272.jpg` });
            }
            const channel = cleanUrl.split('twitch.tv/')[1]?.replace('/', '');
            return res.status(200).json({ imgUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel.toLowerCase()}-1920x1080.jpg` });
        }

        // Lógica para TikTok (Vía oEmbed Oficial)
        if (platform === 'tiktok') {
            const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            if (data.thumbnail_url) {
                return res.status(200).json({ imgUrl: data.thumbnail_url });
            }
        }

        // Lógica para Kick Stream
        if (platform === 'kick') {
            const channel = url.split('kick.com/')[1]?.split('?')[0]?.replace('/', '');
            const response = await fetch(`https://kick.com/api/v2/channels/${channel}`);
            const data = await response.json();
            if (data.livestream && data.livestream.thumbnail) {
                return res.status(200).json({ imgUrl: data.livestream.thumbnail.url });
            }
        }

        return res.status(400).json({ error: 'No se pudo obtener la imagen' });
    } catch (err) {
        return res.status(500).json({ error: 'Error procesando la solicitud' });
    }
}
