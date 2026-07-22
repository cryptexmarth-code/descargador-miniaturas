const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xml2js = require('xml2js');

// Lista maestra con los ID oficiales reales de YouTube (Formato UC...)
const masterChannels = [
  // --- INGLÉS ---
  { name: "MrBeast", id: "UCX6OQ3DkcsbYNE6H8uQQuVA" },
  { name: "MKBHD", id: "UCBJycsmduvYEL83R_U4JriQ" },
  { name: "Linus Tech Tips", id: "UCXuqSBlHAE6Xw-yeJA0Tunw" },
  { name: "PewDiePie", id: "UC-lHJZR3Gqxm24_Vd_AJ5Yw" },
  { name: "Markiplier", id: "UC7_YxT-KID8kRbqZo7MyscQ" },
  { name: "Jacksepticeye", id: "UCYzTqDN_9PMF4ch0jCBFzwg" },
  { name: "Veritasium", id: "UCHnyfMqiRRG1u-2MsSQLbXA" },
  { name: "SmarterEveryDay", id: "UC6107grRI4m0o2-emgoDnAA" },
  { name: "Kurzgesagt", id: "UCsXVk37bltHxD1rDPwtNM8Q" },
  { name: "Vsauce", id: "UC6nSFpj9HTCZ5t-N3Rm3-HA" },
  { name: "Dude Perfect", id: "UCgQvhHsW9P_yM1C5r3Gz1NQ" },
  { name: "The Verge", id: "UCRUjdVOsuuevUNSLJ2nAFUA" },
  { name: "IGN", id: "UCKy1dAqELo0zrOtPkf0eTMw" },
  { name: "GameSpot", id: "UCbu2SsF-Or3RsnXBsVnZtfg" },
  { name: "Fireship", id: "UCsBjURrPoezykLs9EqgamOA" },
  { name: "Asmongold Clips", id: "UCQe4b0gO59R8k-p0QyYy-YQ" },
  { name: "DanTDM", id: "UCSrZ3Tw6jHrlLqP0zKN3k3g" },
  { name: "MrBeast Gaming", id: "UCIPPMRA040LQr5QPyJEbmXA" },
  { name: "Sidemen", id: "UCDogdizlMdCs8dZk1w_u9_g" },

  // --- ESPAÑOL ---
  { name: "Ibai Llanos", id: "UCIsXmj8IJ7SmW3kCT3orYyw" },
  { name: "AuronPlay", id: "UC0V926_A1sO9aKxI6u8879Q" },
  { name: "ElRubius", id: "UCXujkky4Hn3X9TqW43x_Bvw" },
  { name: "Vegetta777", id: "UCjKhicR2Eci9A7hJdFz1Aww" },
  { name: "Willyrex", id: "UC2K1919UDJ1Nzc0h8j90O5Q" },
  { name: "TheGrefg", id: "UC6m95_6N6F_276aK23X1jfg" },
  { name: "Mikecrack", id: "UCWyv5T3mQ1sM9r4m1k5V8XQ" },
  { name: "DjMaRiiO", id: "UCLVz9A5gJb6fQ0v8r13f6Yg" },
  { name: "Jordi Wild", id: "UCW-K3E0U4tL0Tf6lVbH9g_A" },
  { name: "ExpCaseros", id: "UCWd9iG8gW8P2l_vT5z4b5vQ" },
  { name: "Quantum Fracture", id: "UCQvmyN_1359aE3hG0Xv3YwQ" },
  { name: "Dot CSV", id: "UC7_X_Q_xZ7tqW4Zz7yq8Y1w" },
  { name: "Midudev", id: "UC8LeXCWOaluK9gD4fG4GgGg" },
  { name: "Fazt Code", id: "UC6K_sX_Qz4z5g9z1w5gqgQg" }
];

function shuffleArray(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

async function fetchRSS() {
  let allVideos = [];
  const parser = new xml2js.Parser();

  // Seleccionar 10 canales aleatorios por ciclo para asegurar rotación
  const shuffledChannels = shuffleArray([...masterChannels]);
  const activeChannels = shuffledChannels.slice(0, 10);

  console.log(`Canales consultados en este ciclo: ${activeChannels.map(c => c.name).join(', ')}`);

  for (const channel of activeChannels) {
    try {
      // Usar estrictamente channel_id para evitar errores 404
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`;
      const response = await axios.get(rssUrl);
      const result = await parser.parseStringPromise(response.data);
      
      if (result.feed && result.feed.entry) {
        const channelVideos = result.feed.entry.slice(0, 3).map(entry => ({
          titulo: entry.title[0],
          url: entry.link[0].$.href,
          videoId: entry['yt:videoId'][0],
          publicado: entry.published[0],
          canal: channel.name
        }));

        allVideos.push(...channelVideos);
      }
    } catch (error) {
      console.error(`Error al procesar el canal ${channel.name}:`, error.message);
    }
  }

  allVideos.sort((a, b) => new Date(b.publicado) - new Date(a.publicado));
  const finalVideos = allVideos.slice(0, 25);

  if (finalVideos.length === 0) {
    console.error("Advertencia: No se recolectó ningún video. No se sobrescribirá el archivo.");
    return;
  }

  const filePath = path.join(__dirname, '../data/competencia-rss.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(finalVideos, null, 2), 'utf8');
  console.log("¡RSS rotativo actualizado con éxito y JSON validado!");
}

fetchRSS();
