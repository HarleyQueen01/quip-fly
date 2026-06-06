# Quip Fly

Quip Fly is a mobile-friendly canvas arcade game inspired by the provided flappy reference, rebuilt with a carved animated butterfly that stays upright while its wings flap, multiple color variants based on the supplied image, selectable visual themes, separate solo and tournament leaderboards, and a three-round tournament mode.

## Run Locally

```bash
npm start
```

Open `http://localhost:3000`.

## Deploy On Railway

1. Create a new GitHub repository.
2. Upload or push this folder to the repository.
3. In Railway, choose **New Project** and deploy from the GitHub repo.
4. Railway will detect Node.js and run `npm start`.

No build step is required.

## Files

- `index.html` - game layout
- `styles.css` - responsive interface and butterfly color variants
- `game.js` - gameplay, scoring, upright animated butterfly drawing, menu setup, themes, character selection, solo leaderboard, tournament leaderboard, tournament mode
- `server.js` - static Node server for Railway
- `assets/butterfly-character.jpg` - supplied butterfly reference image
