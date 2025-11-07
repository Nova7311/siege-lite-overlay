
const { ipcRenderer } = require('electron');

const BACKEND_URL = 'http://localhost:4000'; 

let lastOcrNames = [];


function extractNamesFromText(text) {
  if (!text) return [];

  const blacklist = new Set([
    'PLAYER',
    'PLAYERS',
    'BLUE',
    'ORANGE',
    'SIEGE',
    'MATCH',
    'STATS',
    'LITE',
    'HELP',
    'FILE',
    'EDIT',
    'VIEW',
    'WINDOW',
    'MODE',
    'OVERLAY',
  ]);

  const tokens = text.split(/\s+/);
  const candidates = [];

  for (let raw of tokens) {
    if (!raw) continue;

 
    let t = raw.replace(/^[^A-Za-z0-9_]+|[^A-Za-z0-9_]+$/g, '');
    if (!t) continue;

    if (t.length < 3 || t.length > 16) continue;
    if (!/^[A-Za-z0-9_]+$/.test(t)) continue;

    if (blacklist.has(t.toUpperCase())) continue;

    if (!candidates.includes(t)) {
      candidates.push(t);
    }
  }

  return candidates;
}

function updateOcrNames(text) {
  const namesDiv = document.getElementById('ocrNames');
  if (!namesDiv) return;

  const names = extractNamesFromText(text);
  lastOcrNames = names;

  if (!names || names.length === 0) {
    namesDiv.textContent = '[No candidate names detected]';
    return;
  }

  namesDiv.textContent = names.join(', ');
}

function applyOcrNamesToFields() {
  if (!lastOcrNames || lastOcrNames.length === 0) {
    return;
  }

  const rows = document.querySelectorAll('.player-row');
  const maxPlayers = rows.length;
  const names = lastOcrNames.slice(0, maxPlayers);

  names.forEach((name, index) => {
    const row = rows[index];
    if (!row) return;
    const nameInput = row.querySelector('.player-name');
    const teamSelect = row.querySelector('.player-team');

    if (nameInput) {
      nameInput.value = name;
    }

    
    if (teamSelect) {
      teamSelect.value = index < 5 ? 'blue' : 'orange';
    }
  });
}


function renderMatchView(data) {
  const container = document.getElementById('matchView');

  if (!data || !Array.isArray(data.players)) {
    container.innerHTML = '<div class="team-empty">No data</div>';
    return;
  }

  const players = data.players;

 
  const blueTeam = players.filter(
    (p) => (p.team || '').toLowerCase() === 'blue'
  );
  const orangeTeam = players.filter(
    (p) => (p.team || '').toLowerCase() === 'orange'
  );

  function makeTeamTable(teamName, teamPlayers) {
    if (teamPlayers.length === 0) {
      return `
        <div class="team-container">
          <div class="team-title">${teamName}</div>
          <div class="team-empty">No players</div>
        </div>
      `;
    }

       const rows = teamPlayers
      .map((p) => {
        const r = p.ranked;

        if (!r) {
          const errorText = p.error || 'No ranked data';
          return `
            <tr>
              <td>${p.name}</td>
              <td colspan="5">${errorText}</td>
            </tr>
          `;
        }

                const kd = r.kd != null ? r.kd.toFixed(2) : 'N/A';
        const winRate =
          r.winRate != null ? r.winRate.toFixed(1) + '%' : 'N/A';
        const matches = r.matches != null ? r.matches : 'N/A';
        const mmr =
          r.rankPoints != null ? Math.round(r.rankPoints) : 'N/A';

    
        const rankText =
          r.rankName || (r.rank != null ? r.rank : 'N/A');
        const rankColor = r.rankColor || null;
        const rankStyle = rankColor
          ? ` style="color: ${rankColor};"`
          : '';
        const rankImg = r.rankImageUrl || null;
        const rankIconHtml = rankImg
          ? `<img class="rank-icon" src="${rankImg}" alt="${rankText}">`
          : '';

        return `
          <tr>
            <td>${p.name}</td>
            <td>
              <div class="rank-cell"${rankStyle}>
                ${rankIconHtml}
                <span>${rankText}</span>
              </div>
            </td>
            <td>${mmr}</td>
            <td>${kd}</td>
            <td>${matches}</td>
            <td>${winRate}</td>
          </tr>
        `;

      })
      .join('');


    return `
      <div class="team-container">
        <div class="team-title">${teamName}</div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Rank</th>
              <th>MMR</th>
              <th>K/D</th>
              <th>Matches</th>
              <th>Win %</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  const blueHtml = makeTeamTable('Blue Team', blueTeam);
  const orangeHtml = makeTeamTable('Orange Team', orangeTeam);

  container.innerHTML = blueHtml + orangeHtml;
}


function createPlayerRows() {
  const container = document.getElementById('players');
  container.innerHTML = '';

  for (let i = 0; i < 10; i++) {
    const row = document.createElement('div');
    row.className = 'player-row';


    row.innerHTML = `
      <span>Player ${i + 1}:</span>
      <input type="text" class="player-name" placeholder="Name" />
      <select class="player-team">
        <option value="blue">Blue</option>
        <option value="orange">Orange</option>
      </select>
    `;

    container.appendChild(row);
  }
}



async function captureScreenAndOCR() {
  const ocrOutputDiv = document.getElementById('ocrOutput');
  const statusDiv = document.getElementById('status');
  const errorDiv = document.getElementById('error');

  errorDiv.textContent = '';
  statusDiv.textContent = 'Capturing screen and running OCR...';
  ocrOutputDiv.textContent = '';

  try {
    const ocrResult = await ipcRenderer.invoke('capture-and-ocr');

    if (!ocrResult || !ocrResult.ok) {
      const msg =
        (ocrResult && ocrResult.error) || 'Unknown OCR error (main process)';
      statusDiv.textContent = '';
      errorDiv.textContent = 'Error during OCR: ' + msg;
      return;
    }

    const text = ocrResult.text || '';

    statusDiv.textContent = 'OCR finished.';
    ocrOutputDiv.textContent = text || '[No text detected]';

   
    updateOcrNames(text);
  } catch (err) {
    console.error('Error in captureScreenAndOCR:', err);
    statusDiv.textContent = '';
    errorDiv.textContent =
      'Error during OCR: ' + (err.message || String(err));
  }
}





async function fetchMatchStats() {
  const platformSelect = document.getElementById('platform');
  const platform = platformSelect.value;

  const errorDiv = document.getElementById('error');
  const statusDiv = document.getElementById('status');
  const resultsDiv = document.getElementById('results');

  errorDiv.textContent = '';
  statusDiv.textContent = '';
  resultsDiv.textContent = '';

  // Gather players from the rows
  const rows = document.querySelectorAll('.player-row');
  const players = [];

  rows.forEach((row) => {
    const nameInput = row.querySelector('.player-name');
    const teamSelect = row.querySelector('.player-team');
    const name = nameInput.value.trim();
    const team = teamSelect.value;

    if (name) {
      players.push({
        name,
        platform, // same platform for all for now
        team,
      });
    }
  });

  if (players.length === 0) {
    errorDiv.textContent = 'Please enter at least one player name.';
    return;
  }

  statusDiv.textContent = 'Requesting stats...';

  try {
    const response = await fetch(`${BACKEND_URL}/api/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ players }),
    });

     const data = await response.json();

    statusDiv.textContent = `Response status: ${response.status}`;

    // Render nice tables
    renderMatchView(data);

    // Still show raw JSON below for debugging
    resultsDiv.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error('Error calling /api/match:', err);
    errorDiv.textContent = 'Error contacting backend. Is it running on port 4000?';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  createPlayerRows();

  const fetchButton = document.getElementById('fetchButton');
  fetchButton.addEventListener('click', () => {
    fetchMatchStats();
  });

  const ocrButton = document.getElementById('ocrButton');
  ocrButton.addEventListener('click', () => {
    captureScreenAndOCR();
  });

  const applyOcrButton = document.getElementById('applyOcrNames');
  if (applyOcrButton) {
    applyOcrButton.addEventListener('click', () => {
      applyOcrNamesToFields();
    });
  }

  const overlayModeCheckbox = document.getElementById('overlayMode');
  const responseContainer = document.getElementById('responseContainer');

  overlayModeCheckbox.addEventListener('change', () => {
    if (overlayModeCheckbox.checked) {
      responseContainer.style.display = 'none';
    } else {
      responseContainer.style.display = 'block';
    }
  });
});



