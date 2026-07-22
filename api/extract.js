export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { url, platform } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL requerida' });
    }

    try {
        // 1. TIKTOK
        if (platform === 'tiktok') {
            const cleanUrl = url.split('?')[0];
            const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
            
            const response = await fetch(oembedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.thumbnail_url) {
                    return res.status(200).json({ imgUrl: data.thumbnail_url });
                }
            }
        }

        // 2. KICK
        if (platform === 'kick') {
            const cleanUrl = url.split('?')[0];
            const channel = cleanUrl.split('kick.com/')[1]?.replace('/', '').trim();

            if (channel) {
                const response = await fetch(`https://kick.com/api/v2/channels/${channel}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.livestream?.thumbnail?.url) {
                        return res.status(200).json({ imgUrl: data.livestream.thumbnail.url });
                    }
                    if (data.user?.profile_pic) {
                        return res.status(200).json({ imgUrl: data.user.profile_pic });
                    }
                }
            }
        }

        // 3. TWITCH
        if (platform === 'twitch') {
            const cleanUrl = url.split('?')[0];
            if (cleanUrl.includes('/clip/')) {
                const clipId = cleanUrl.split('/clip/')[1];
                return res.status(200).json({ imgUrl: `https://clips-media-assets2.twitch.tv/${clipId}-preview-480x272.jpg` });
            }
            const channel = cleanUrl.split('twitch.tv/')[1]?.replace('/', '');
            if (channel) {
                return res.status(200).json({ imgUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel.toLowerCase()}-1920x1080.jpg` });
            }
        }

        return res.status(400).json({ error: 'No se pudo procesar el enlace' });
    } catch (err) {
        return res.status(500).json({ error: 'Error en el servidor' });
    }
}
