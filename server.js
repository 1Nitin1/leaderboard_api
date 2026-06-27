const fs = require('node:fs/promises');
const path = require('node:path');

const cors = require('cors');
const express = require('express');

const app = express();
const port = Number(process.env.PORT || 3000);
const maxScores = Number(process.env.MAX_SCORES || 100);
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'leaderboard.json');

app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'lights-off-leaderboard-api',
    endpoints: ['GET /health', 'GET /leaderboard', 'POST /leaderboard'],
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/leaderboard', async (_req, res, next) => {
  try {
    const scores = await readScores();
    res.json(scores);
  } catch (error) {
    next(error);
  }
});

app.post('/leaderboard', async (req, res, next) => {
  try {
    const entry = normalizeEntry(req.body);
    if (!entry) {
      return res.status(400).json({
        error:
          'Invalid score. Required: playerName, scoreSeconds, moves, gridSize, difficulty.',
      });
    }

    const scores = await readScores();
    scores.push(entry);
    scores.sort(compareScores);
    const trimmedScores = scores.slice(0, maxScores);
    await writeScores(trimmedScores);

    return res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Server error' });
});

app.listen(port, () => {
  console.log(`Leaderboard API listening on port ${port}`);
});

async function readScores() {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(Boolean).map(normalizeEntry).filter(Boolean).sort(compareScores);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeScores(scores) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, `${JSON.stringify(scores, null, 2)}\n`, 'utf8');
}

function normalizeEntry(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const playerName =
    typeof value.playerName === 'string' && value.playerName.trim()
      ? value.playerName.trim().slice(0, 32)
      : 'Player';
  const scoreSeconds = toPositiveInt(value.scoreSeconds);
  const moves = toPositiveInt(value.moves);
  const gridSize = toPositiveInt(value.gridSize);
  const difficulty =
    typeof value.difficulty === 'string' && value.difficulty.trim()
      ? value.difficulty.trim().slice(0, 24)
      : null;

  if (!scoreSeconds || !moves || !gridSize || !difficulty) {
    return null;
  }

  return {
    playerName,
    scoreSeconds,
    moves,
    gridSize,
    difficulty,
    timestamp: parseTimestamp(value.timestamp),
    source: 'online',
  };
}

function toPositiveInt(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }
  return number;
}

function parseTimestamp(value) {
  if (typeof value === 'string') {
    const timestamp = new Date(value);
    if (!Number.isNaN(timestamp.valueOf())) {
      return timestamp.toISOString();
    }
  }
  return new Date().toISOString();
}

function compareScores(a, b) {
  const timeCompare = a.scoreSeconds - b.scoreSeconds;
  if (timeCompare !== 0) {
    return timeCompare;
  }
  return a.moves - b.moves;
}
