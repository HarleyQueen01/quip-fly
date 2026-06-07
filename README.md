# Quip Fly

Quip Fly is a mobile-friendly canvas arcade game inspired by the provided flappy reference, rebuilt with a horizontal carved butterfly that stays level while its wings flap, multiple color variants based on the supplied image, selectable visual themes, separate solo and tournament leaderboards, shield nectar placed inside gate openings, and a locked three-round tournament mode.

## Run Locally

```bash
npm start
```

Open `http://localhost:3000`.

## Tournament Access

Tournament mode requires a player name and this password:

```text
quipnetwork
```

## Deploy On Railway

1. Create a new GitHub repository.
2. Upload or push this folder to the repository.
3. In Railway, choose **New Project** and deploy from the GitHub repo.
4. Railway will detect Node.js and run `npm start`.

No build step is required.

## Files

- `index.html` - game layout
- `styles.css` - responsive interface and butterfly color variants
- `game.js` - gameplay, scoring, horizontal animated butterfly drawing, shield pickups, locked tournament access, menu setup, themes, character selection, solo leaderboard, tournament leaderboard, tournament mode
- `server.js` - static Node server for Railway
- `assets/butterfly-character.jpg` - supplied butterfly reference image
