const fs = require('fs');
const axios = require('axios');
const xml2js = require('xml2js');

async function actualizarDatosCompetencia() {
    const canales = [
        // --- 5 Originales ---
        { nombre: "The Verge", id: "UCBJycsmduvYEL83R_U4JriQ" },
        { nombre: "Linus Tech Tips", id: "UCXuqSBlHAE6Xw-yeJA0Tunw" },
        { nombre: "AuronPlay", id: "UC0V8u0c4OEqCsCH0pKBnEeg" },
        { nombre: "MrBeast", id: "UCX6OQ3DkcsbYNE6H8uQQuVA" },
        { nombre: "Fazt Code", id: "UCrQ3fJPmgCGIIWdE8_4SrgQ" },

        // --- 10 Nuevos en Español e Inglés ---
        { nombre: "Midudev", id: "UC8LeimukJW82MLSWNVjW3sw" },
        { nombre: "Dalto", id: "UC9nxKNLyvyaN19UDUf24Pmw" },
        { nombre: "Ibai", id: "UC02yQWv68_c8wR299E0-lTA" },
        { nombre: "El Rubius", id: "UCpwgnzQc3mCjWwz_bB1b14Q" },
        { nombre: "The Wild Project", id: "UCwz8m4nJz8c_p_J07a3lO5w" },
        { nombre: "DotCSV", id: "UCyBVqKsrW219-X8k-wV-lYw" },
        { nombre: "MKBHD", id: "UCBJycsmduvYEL83R_U4JriQ" }, // (Nota: MKBHD / Marques Brownlee)
        { nombre: "Programación ATS", id: "UCT5ZgCeyC5Y4aT_yJ5jZ1sQ" },
        { nombre: "Devdreaming", id: "UC-lHJZR3Gqxm24_Vd_AJ5Yw" },
        { nombre: "Pelado Nerd", id: "UCu3774KYXcaUD2pS3C8C9sg" }
    ];

    let resultadosGlobales = [];

    for (let canal of canales) {
        try {
            const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${canal.id}`;
            const response = await axios.get(rssUrl);
            
            const parser = new xml2js.Parser({ explicitArray: false });
            const result = await parser.parseStringPromise(response.data);

            const entries = result.feed.entry;
            if (entries && Array.isArray(entries)) {
                const ultimosVideos = entries.slice(0, 3).map(entry => ({
                    titulo: entry.title,
                    url: entry.link['$'].href,
                    videoId: entry['yt:videoId'],
                    publicado: entry.published,
                    canal: canal.nombre
                }));

                resultadosGlobales.push(...ultimosVideos);
            }
        } catch (error) {
            console.error(`Error al leer el RSS del canal ${canal.nombre}:`, error.message);
        }
    }

    const outputDir = './data';
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync('./data/competencia-rss.json', JSON.stringify(resultadosGlobales, null, 2));
    console.log("¡Datos de RSS de competencia actualizados con éxito en data/competencia-rss.json!");
}

actualizarDatosCompetencia();
