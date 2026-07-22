const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xml2js = require('xml2js');

// Amplia lista de 50 creadores (Español e Inglés - Gaming, Tech, Entretenimiento y Viral)
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
  { name: "Devdreaming", id: "UCi8e0iOVk1fEOohdfu4HglA" },
  { name: "TechLead", id: "UCbprJHJknTOpcA9N8V8uJ0g" },
  { name: "Fireship", id: "UCsBjURrPoezykLs9EqgamOA" },
  { name: "Asmongold Clips", id: "UCQe4b0gO59R8k-p0QyYy-YQ" },
  { name: "Syndicate", id: "UC0Yq5Vw156-G-J03Vv0g9QQ" },
  { name: "DanTDM", id: "UCSrZ3Tw6jHrlLqP0zKN3k3g" },
  { name: "Ninja", id: "UCA9V_ivx0u7ogFwIVf_9D8g" },
  { name: "Shroud", id: "UCozAGaO_O6Q0482_U2tW02A" },
  { name: "MrBeast Gaming", id: "UCIPPMRA040LQr5QPyJEbmXA" },
  { name: "Airrack", id: "UC_b3aX2B4F8z8N_55g1p3qA" },
  { name: "Sidemen", id: "UCDogdizlMdCs8dZk1w_u9_g" },

  // --- ESPAÑOL ---
  { name: "Ibais Llanos", id: "UCv628SZXudW9n-1gW0A7L-Q" },
  { name: "AuronPlay", id: "UC0V926_A1sO9aKxI6u8879Q" },
  { name: "ElRubius", id: "UCXujkky4Hn3X9TqW43x_Bvw" },
  { name: "Vegetta777", id: "UCjKhicR2Eci9A7hJdFz1Aww" },
  { name: "Willyrex", id: "UC2K1919UDJ1Nzc0h8j90O5Q" },
  { name: "TheGrefg", id: "UC6m95_6N6F_276aK23X1jfg" },
  { name: "Ares You", id: "UCt8T1644z8g4uVz7N4rQ39w" },
  { name: "Mikecrack", id: "UCWyv5T3mQ1sM9r4m1k5V8XQ" },
  { name: "LuzuGames", id: "UCOsO36D9bF59K49_Z3_N2ng" },
  { name: "Alexby11", id: "UCVfR_jVq6g3j7zQ3n1N984A" },
  { name: "Staxx", id: "UC2K1919UDJ1Nzc0h8j90O5Q" },
  { name: "DjMaRiiO", id: "UCLVz9A5gJb6fQ0v8r13f6Yg" },
  { name: "Jordi Wild", id: "UCW-K3E0U4tL0Tf6lVbH9g_A" },
  { name: "RTVE Noticias", id: "UCQJbM5s82yC_D5y-jA1c2rQ" },
  { name: "ExpCaseros", id: "UCWd9iG8gW8P2l_vT5z4b5vQ" },
  { name: "Quantum Fracture", id: "UCQvmyN_1359aE3hG0Xv3YwQ" },
  { name: "Dot CSV", id: "UC7_X_Q_xZ7tqW4Zz7yq8Y1w" },
  { name: "Ter", id: "UClhXkXQ6j_tW9d79Z44qR6w" },
  { name: "Bojack Tech", id: "UC4_sW6N1c1zZ2m_v5R89wQw" },
  { name: "Midudev", id: "UC8LeXCWOaluK9gD4fG4GgGg" },
  { name: "Fazt Code", id: "UC6K_sX_Qz4z5g9z1w5gqgQg" },
  { name: "Jon Mircha", id: "UCwRX9WwN76h7C_j5r8q3VwQ" },
  { name: "HolaMundo", id: "UC4W_X_Qz4z5g9z1w5gqgQg" },
  { name: "Pildoras Informaticas", id: "UC_X_Qz4z5g9z1w5gqgQg" },
  { name: "LatinoGang Tech", id: "UC9_X_Qz4z5g9z1w5gqgQg" }
];

// Función para barajar el array de forma aleatoria (Fisher-Yates)
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

  // Barajar la lista maestra y seleccionar aleatoriamente solo 10 canales en esta ejecución
  // Esto asegura que cada 2 horas comparen creadores diferentes y la lista rote por completo.
  const shuffledChannels = shuffleArray([...masterChannels]);
  const activeChannels = shuffledChannels.slice(0, 10);

  console.log(`Canales seleccionados para este ciclo: ${activeChannels.map(c => c.name).join(', ')}`);

  for (const channel of activeChannels) {
    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`;
      const response = await axios.get(rssUrl);
      const result = await parser.parseStringPromise(response.data);
      
      if (result.feed && result.feed.entry) {
        // Tomar los 3 videos más recientes de cada canal activo
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
      console.error(`Error obteniendo RSS de ${channel.name}:`, error.message);
    }
  }

  // Ordenar todos los videos obtenidos estrictamente del más reciente al más antiguo
  allVideos.sort((a, b) => new Date(b.publicado) - new Date(a.publicado));

  // Limitar el resultado global a los 25 más frescos del bloque rotativo
  const finalVideos = allVideos.slice(0, 25);

  const filePath = path.join(__dirname, '../data/competencia-rss.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(finalVideos, null, 2), 'utf8');
  console.log("RSS rotativo sincronizado con éxito.");
}

fetchRSS();
