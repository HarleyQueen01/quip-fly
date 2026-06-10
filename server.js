const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const tournamentPassword = "quipnetwork";
const dataDir = path.join(root, "data");
const tournamentFile = path.join(dataDir, "tournament-leaderboard.json");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

fs.mkdirSync(dataDir, { recursive: true });

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function readTournamentScores() {
  try {
    return JSON.parse(fs.readFileSync(tournamentFile, "utf8"));
  } catch {
    return [];
  }
}

function writeTournamentScores(scores) {
  fs.writeFileSync(tournamentFile, JSON.stringify(scores.slice(0, 500), null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20_000) {
        reject(new Error("Body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function handleApi(req, res, url) {
  if (url.pathname !== "/api/tournament/leaderboard") return false;

  if (req.method === "GET") {
    sendJson(res, 200, { scores: readTournamentScores().slice(0, 500) });
    return true;
  }

  if (req.method === "POST") {
    try {
      const body = await readBody(req);
      if (body.password !== tournamentPassword) {
        sendJson(res, 403, { error: "Tournament password is incorrect." });
        return true;
      }

      const name = String(body.name || "Player").trim().slice(0, 16) || "Player";
      const score = Math.max(0, Math.floor(Number(body.score) || 0));
      const scores = readTournamentScores();
      scores.push({ name, score, date: new Date().toISOString() });
      scores.sort((a, b) => b.score - a.score);
      writeTournamentScores(scores);
      sendJson(res, 200, { scores: scores.slice(0, 500) });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return true;
  }

  if (req.method === "DELETE") {
    try {
      const body = await readBody(req);
      if (body.password !== tournamentPassword) {
        sendJson(res, 403, { error: "Tournament password is incorrect." });
        return true;
      }

      writeTournamentScores([]);
      sendJson(res, 200, { scores: [] });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return true;
  }

  sendJson(res, 405, { error: "Method not allowed." });
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (await handleApi(req, res, url)) return;

  const cleanPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.join(root, cleanPath);
  const relative = path.relative(root, filePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "public, max-age=300"
    });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Quip Fly running on port ${port}`);
});
