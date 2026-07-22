const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xml2js = require('xml2js');

// Lista de canales (puedes incluir más canales virales o de gaming/tech del momento para asegurar variedad)
const channels = [
  { name: "The Verge", id: "UCRUjdVOsuuevUNSLJ2nAFUA" },
  { name: "Linus Tech Tips", id: "UCXuqSBlHAE6Xw-yeJA0Tunw" },
  { name: "MrBeast", id: "UCX6OQ3DkcsbYNE6H8uQQuVA" },
  { name: "MKBHD", id: "UCBJycsmduvYEL83R_U4JriQ" },
  { name: "Devdreaming", id: "UCi8e0iOVk1fEOohdfu4HglA" }
];

async function fetchRSS() {
  let allVideos = [];
  const parser = new xml2js.Parser();

  for (const channel of channels) {
    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`;
      const response = await axios.get(rssUrl);
      const result = await parser.parseStringPromise(response.data);
      
      if (result.feed && result.feed.entry) {
        for (const entry of result.feed.entry) {
          allVideos.push({
            titulo: entry.title[0],
            url: entry.link[0].$.href,
            videoId: entry['yt:videoId'][0],
            publicado: entry.published[0],
            canal: channel.name
          });
        }
      }
    } catch (error) {
      console.error(`Error obteniendo RSS de ${channel.name}:`, error.message);
    }
  }

  // Ordenar estrictamente del más reciente al más antiguo para reflejar tendencias reales
  allVideos.sort((a, b) => new Date(b.publicado) - new Date(a.publicado));

  // Guardar un pool fresco de los 25 videos más recientes globales
  const finalVideos = allVideos.slice(0, 25);

  const filePath = path.join(__dirname, '../data/competencia-rss.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(finalVideos, null, 2), 'utf8');
  console.log("RSS sincronizado y ordenado correctamente por fecha de tendencia.");
}

fetchRSS();
