<script>
    let currentPlatform = 'youtube';

    function setPlatform(platform) {
        currentPlatform = platform;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        
        // Marcar visualmente el botón presionado
        const activeBtn = document.querySelector(`.tab-btn[onclick*="${platform}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        const input = document.getElementById('mediaUrl');
        if (platform === 'youtube') input.placeholder = "Pega el enlace de YouTube...";
        if (platform === 'twitch') input.placeholder = "Pega el enlace de Twitch...";
        if (platform === 'kick') input.placeholder = "Pega el enlace de Kick...";
        if (platform === 'tiktok') input.placeholder = "Pega el enlace de TikTok...";
    }

    function extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    async function processUrl() {
        const urlInput = document.getElementById('mediaUrl');
        const url = urlInput.value.trim();
        const errorDiv = document.getElementById('error');
        const resultsDiv = document.getElementById('results');
        const thumbImg = document.getElementById('thumbImg');
        const downloadBtn = document.getElementById('downloadBtn');

        errorDiv.style.display = 'none';

        if (!url) {
            errorDiv.textContent = "Por favor, pega un enlace válido.";
            errorDiv.style.display = 'block';
            resultsDiv.style.display = 'none';
            return;
        }

        // AUTO-DETECCIÓN DE PLATAFORMA (Evita errores de selección manual)
        let targetPlatform = currentPlatform;
        if (url.includes('kick.com')) targetPlatform = 'kick';
        else if (url.includes('tiktok.com')) targetPlatform = 'tiktok';
        else if (url.includes('twitch.tv')) targetPlatform = 'twitch';
        else if (url.includes('youtube.com') || url.includes('youtu.be')) targetPlatform = 'youtube';

        // 1. YouTube (Rápido en cliente)
        if (targetPlatform === 'youtube') {
            const ytId = extractYouTubeId(url);
            if (ytId) {
                const maxUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
                thumbImg.src = maxUrl;
                downloadBtn.href = maxUrl;
                resultsDiv.style.display = 'block';
            } else {
                errorDiv.textContent = "Enlace de YouTube no válido.";
                errorDiv.style.display = 'block';
                resultsDiv.style.display = 'none';
            }
            return;
        }

        // 2. Twitch, Kick, TikTok (Backend en Vercel)
        try {
            const res = await fetch(`/api/extract?platform=${targetPlatform}&url=${encodeURIComponent(url)}`);
            const data = await res.json();

            if (res.ok && data.imgUrl) {
                thumbImg.src = data.imgUrl;
                downloadBtn.href = data.imgUrl;
                resultsDiv.style.display = 'block';
            } else {
                errorDiv.textContent = "No se pudo obtener la miniatura. Verifica que el canal o video exista.";
                errorDiv.style.display = 'block';
                resultsDiv.style.display = 'none';
            }
        } catch (e) {
            errorDiv.textContent = "Error al conectar con el servidor.";
            errorDiv.style.display = 'block';
            resultsDiv.style.display = 'none';
        }
    }
</script>
