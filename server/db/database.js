import Database from 'better-sqlite3';

export function createDb(dbPath = 'ludo.db') {
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL COLLATE NOCASE,
      games_played INTEGER NOT NULL DEFAULT 0,
      games_won INTEGER NOT NULL DEFAULT 0,
      total_captures INTEGER NOT NULL DEFAULT 0,
      total_sixes INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT UNIQUE NOT NULL,
      default_timer INTEGER NOT NULL DEFAULT 10,
      max_players INTEGER NOT NULL DEFAULT 4,
      status TEXT NOT NULL DEFAULT 'LOBBY',
      winner_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS roll_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT NOT NULL,
      player_name TEXT NOT NULL,
      a INTEGER NOT NULL,
      b INTEGER NOT NULL,
      op TEXT NOT NULL,
      raw INTEGER NOT NULL,
      steps INTEGER NOT NULL,
      direction TEXT NOT NULL,
      extra_turn INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

export function getOrCreatePlayer(db, rawName) {
  const name = rawName.trim();
  const findStmt = db.prepare('SELECT * FROM players WHERE name = ? COLLATE NOCASE');
  let player = findStmt.get(name);

  if (!player) {
    db.prepare('INSERT INTO players (name) VALUES (?)').run(name);
    player = findStmt.get(name);
  } else {
    db.prepare('UPDATE players SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?').run(player.id);
  }
  return player;
}

export function recordMatchStart(db, { roomCode, timer, maxPlayers }) {
  db.prepare(`
    INSERT OR REPLACE INTO matches (room_code, default_timer, max_players, status)
    VALUES (?, ?, ?, 'PLAYING')
  `).run(roomCode, timer, maxPlayers);
}

export function recordMatchWin(db, roomCode, winnerName) {
  db.prepare(`
    UPDATE matches
    SET status = 'FINISHED', winner_name = ?, finished_at = CURRENT_TIMESTAMP
    WHERE room_code = ?
  `).run(winnerName, roomCode);

  db.prepare(`
    UPDATE players
    SET games_won = games_won + 1, games_played = games_played + 1
    WHERE name = ? COLLATE NOCASE
  `).run(winnerName);
}

export function recordPlayerCapture(db, playerName) {
  db.prepare(`
    UPDATE players
    SET total_captures = total_captures + 1
    WHERE name = ? COLLATE NOCASE
  `).run(playerName);
}

export function recordRollLog(db, { roomCode, playerName, a, b, op, raw, steps, direction, extraTurn }) {
  if (extraTurn) {
    db.prepare('UPDATE players SET total_sixes = total_sixes + 1 WHERE name = ? COLLATE NOCASE')
      .run(playerName);
  }

  db.prepare(`
    INSERT INTO roll_logs (room_code, player_name, a, b, op, raw, steps, direction, extra_turn)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(roomCode, playerName, a, b, op, raw, steps, direction, extraTurn ? 1 : 0);
}

export function getLeaderboard(db, limit = 10) {
  return db.prepare(`
    SELECT name, games_played, games_won, total_captures, total_sixes
    FROM players
    ORDER BY games_won DESC, total_captures DESC, total_sixes DESC
    LIMIT ?
  `).all(limit);
}
