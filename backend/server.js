
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());


function mapPlatform(platform) {
  const p = String(platform || '').toLowerCase();

  if (p === 'pc') {
    return {
      platformType: 'uplay',
      platformFamily: 'pc',
    };
  }

  if (p === 'ps' || p === 'psn' || p === 'playstation') {
    return {
      platformType: 'psn',
      platformFamily: 'console',
    };
  }

  if (p === 'xbox' || p === 'xbl') {
    return {
      platformType: 'xbl',
      platformFamily: 'console',
    };
  }

  return null; 
}
function extractRankedStats(r6Data) {
  if (
    !r6Data ||
    !Array.isArray(r6Data.platform_families_full_profiles) ||
    r6Data.platform_families_full_profiles.length === 0
  ) {
    return null;
  }


  const platformFamilyProfile = r6Data.platform_families_full_profiles[0];

  if (
    !platformFamilyProfile ||
    !Array.isArray(platformFamilyProfile.board_ids_full_profiles)
  ) {
    return null;
  }

 
  const rankedBoard = platformFamilyProfile.board_ids_full_profiles.find(
    (board) => board.board_id === 'ranked'
  );

  if (
    !rankedBoard ||
    !Array.isArray(rankedBoard.full_profiles) ||
    rankedBoard.full_profiles.length === 0
  ) {
    return null;
  }

 
  const rankedProfile = rankedBoard.full_profiles[0];

  if (!rankedProfile || !rankedProfile.profile || !rankedProfile.season_statistics) {
    return null;
  }

  const profile = rankedProfile.profile;
  const stats = rankedProfile.season_statistics;

  const kills = stats.kills || 0;
  const deaths = stats.deaths || 0;
  const wins = (stats.match_outcomes && stats.match_outcomes.wins) || 0;
  const losses = (stats.match_outcomes && stats.match_outcomes.losses) || 0;
  const abandons = (stats.match_outcomes && stats.match_outcomes.abandons) || 0;

  const matches = wins + losses + abandons;
  const kd = deaths > 0 ? kills / deaths : kills; 
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

  return {
    boardId: profile.board_id,
    seasonId: profile.season_id,
    rank: profile.rank,                  
    rankPoints: profile.rank_points,     
    maxRank: profile.max_rank,
    maxRankPoints: profile.max_rank_points,

    kills,
    deaths,
    kd,
    wins,
    losses,
    abandons,
    matches,
    winRate,
  };
}

async function fetchPlayerRankedStats(platform, name) {
  if (!name) {
    throw new Error('Missing player name');
  }

  const mapped = mapPlatform(platform);
  if (!mapped) {
    const err = new Error('Unsupported platform');
    err.code = 'UNSUPPORTED_PLATFORM';
    throw err;
  }

  const { platformType, platformFamily } = mapped;

  const baseUrl = 'https://api.r6data.eu/api/stats';


  const statsUrl =
    `${baseUrl}?type=stats` +
    `&nameOnPlatform=${encodeURIComponent(name)}` +
    `&platformType=${encodeURIComponent(platformType)}` +
    `&platform_families=${encodeURIComponent(platformFamily)}`;

  console.log('Requesting R6Data stats URL:', statsUrl);

  const response = await fetch(statsUrl);

  if (!response.ok) {
    const text = await response.text();
    console.error('R6Data stats error:', response.status, text);
    const err = new Error('Upstream API error');
    err.code = 'UPSTREAM_ERROR';
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const rankedStats = extractRankedStats(data);

 
  let rankName = null;
  let rankImageUrl = null;
  let rankColor = null;

  try {
    const seasonalUrl =
      `${baseUrl}?type=seasonalStats` +
      `&nameOnPlatform=${encodeURIComponent(name)}` +
      `&platformType=${encodeURIComponent(platformType)}`;

    console.log('Requesting R6Data seasonal URL:', seasonalUrl);

    const seasonalResp = await fetch(seasonalUrl);

    if (seasonalResp.ok) {
      const seasonalData = await seasonalResp.json();

      const history =
        seasonalData &&
        seasonalData.data &&
        seasonalData.data.history &&
        Array.isArray(seasonalData.data.history.data)
          ? seasonalData.data.history.data
          : null;

      if (history && history.length > 0) {
        
        const lastEntry = history[history.length - 1];
        const statsObj = lastEntry && lastEntry[1];
        const meta = statsObj && statsObj.metadata;

        if (meta) {
          rankName = meta.rank || null;
          rankImageUrl = meta.imageUrl || null;
          rankColor = meta.color || null;
        }
      }
    } else {
      console.warn(
        'seasonalStats not OK for',
        name,
        'status =',
        seasonalResp.status
      );
    }
  } catch (e) {
    console.error('Error fetching seasonalStats for', name, e);
  }

  
  let ranked = rankedStats;
  if (ranked && (rankName || rankImageUrl || rankColor)) {
    ranked = {
      ...ranked,
      rankName,
      rankImageUrl,
      rankColor,
    };
  }

  
  return {
    source: 'r6data',
    platform,
    name,
    ranked, 
  };
}



app.get('/api/hello', (req, res) => {
  res.json({ message: 'backend is alive!' });
});

app.get('/api/player/:platform/:name', async (req, res) => {
  try {
    const { platform, name } = req.params;

    const result = await fetchPlayerRankedStats(platform, name);

    return res.json(result);
  } catch (err) {
    console.error('Unexpected error in /api/player:', err);

    if (err.code === 'UNSUPPORTED_PLATFORM') {
      return res.status(400).json({
        error: 'Unsupported platform. Use pc, psn or xbox in the URL.',
      });
    }

    if (err.code === 'UPSTREAM_ERROR') {
      return res.status(502).json({
        error: 'Failed to fetch player stats from upstream API.',
        status: err.status || 502,
      });
    }

    return res.status(500).json({ error: 'Internal server error.' });
  }
});


app.post('/api/match', async (req, res) => {
  try {
    const { players } = req.body;

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: 'Body must contain a non-empty players array.' });
    }

    if (players.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 players per match request.' });
    }

    
    const results = await Promise.all(
      players.map(async (p) => {
        const name = p.name;
        const platform = p.platform || 'pc'; 
        const team = p.team || null;

        try {
          const playerStats = await fetchPlayerRankedStats(platform, name);
          return {
            name,
            platform,
            team,
            ranked: playerStats.ranked,
            error: null,
          };
        } catch (err) {
          console.error(`Error fetching stats for player ${name}:`, err);

          let errorMessage = 'Unknown error';
          if (err.code === 'UNSUPPORTED_PLATFORM') {
            errorMessage = 'Unsupported platform';
          } else if (err.code === 'UPSTREAM_ERROR') {
            errorMessage = 'Upstream API error';
          }

          
          return {
            name,
            platform,
            team,
            ranked: null,
            error: errorMessage,
          };
        }
      })
    );

    return res.json({ players: results });
  } catch (err) {
    console.error('Unexpected error in /api/match:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
