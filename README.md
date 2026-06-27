# Lights Off Leaderboard API

Small REST API for the Flutter game leaderboard.

## Endpoints

- `GET /health`
- `GET /leaderboard`
- `POST /leaderboard`

`POST /leaderboard` accepts the same JSON shape sent by the Flutter app:

```json
{
  "playerName": "Player",
  "scoreSeconds": 42,
  "moves": 18,
  "gridSize": 5,
  "difficulty": "normal",
  "timestamp": "2026-06-27T10:30:00.000Z",
  "source": "local"
}
```

## Local Run

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000/leaderboard
```

## Render Deploy

1. Push this project to GitHub.
2. In Render, choose **New +** then **Web Service**.
3. Connect your GitHub repository.
4. Use these settings:

```text
Root Directory: leaderboard-api
Runtime: Node
Build Command: npm install
Start Command: npm start
```

5. Optional but recommended for real persistence: add a persistent disk in **Advanced**.

```text
Mount Path: /var/data
Environment Variable:
DATA_DIR=/var/data
```

Without a persistent disk, Render's filesystem is ephemeral, so scores can be lost when the service restarts or redeploys.

6. Deploy the service.
7. Copy your Render URL, for example:

```text
https://lights-off-leaderboard.onrender.com
```

8. Build your APK with:

```powershell
& 'C:\Users\Nitin Baranwal\OneDrive\Desktop\flutter\bin\flutter.bat' build apk --release --dart-define=LEADERBOARD_URL=https://lights-off-leaderboard.onrender.com
```

Render free web services can sleep after inactivity. The first leaderboard sync after a sleep may take a little longer.
# leaderboard_api
