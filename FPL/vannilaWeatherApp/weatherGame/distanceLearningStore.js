// DistanceLearningQuiz's local data layer — three localStorage "tables",
// each laid out as the Firestore collection it's uploaded to by
// distanceLearningBoard.js, so the upload is a straight copy rather than a
// reshape. localStorage stays the first place everything is saved, so the
// quiz still works offline or without Firebase:
//
//   dlq.player    -> dlqPlayers/{uid}          (one document)
//   dlq.runs      -> dlqRuns/{runId}           (one per finished/quit quiz)
//   dlq.attempts  -> dlqAttempts/{attemptId}   (one per submitted answer or timeout)
//
// Every record carries a client-generated id (crypto.randomUUID) that is
// meant to become its Firestore document id, so a migration that dies
// halfway can simply run again: re-writing the same id is a no-op, not a
// duplicate. Every record also carries `syncedAt: null`; the migration sets
// it once a record is uploaded and skips anything already set.
//
// Timestamps are ISO strings (Firestore can store them as-is or convert to
// Timestamp on upload); durations are integer milliseconds.
//
// Same "fail silently" stance as Time Quiz's city cooldown: private
// browsing or a full quota just means nothing persists, never a broken
// page.

const DistanceLearningStore = (() => {
  const SCHEMA_VERSION = 1;
  const KEYS = {
    player: "dlq.player",
    runs: "dlq.runs",
    attempts: "dlq.attempts",
  };
  // Shared with GeoStreak and Time Quiz, so the player's existing name
  // carries over without asking again.
  const NICKNAME_KEY = "geoStreakGame_nickname";

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error("DistanceLearningStore: write failed", key, err);
    }
  }

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  // ---- dlq.player ---------------------------------------------------------
  // {
  //   schemaVersion, playerId, nickname, createdAt, updatedAt,
  //   highScore: { score, runId, roundKey, achievedAt } | null,
  //   roundHighScores: { [roundKey]: { score, runId, achievedAt } },
  //   totalRuns, totalAttempts,
  //   syncedAt, firebaseUid      // both null until the Firebase migration
  // }
  function getPlayer() {
    let player = read(KEYS.player, null);
    if (!player) {
      player = {
        schemaVersion: SCHEMA_VERSION,
        playerId: newId(),
        nickname: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        highScore: null,
        roundHighScores: {},
        totalRuns: 0,
        totalAttempts: 0,
        syncedAt: null,
        firebaseUid: null,
      };
      write(KEYS.player, player);
    }
    // Picks up a name set later in GeoStreak/Time Quiz.
    let nickname = null;
    try { nickname = localStorage.getItem(NICKNAME_KEY); } catch (err) { /* ignore */ }
    if (nickname && nickname !== player.nickname) {
      player.nickname = nickname;
      player.updatedAt = nowIso();
      write(KEYS.player, player);
    }
    return player;
  }

  // ---- dlq.runs -----------------------------------------------------------
  // {
  //   schemaVersion, runId, playerId, roundKey, roundLabel,
  //   startCity: { name, country, lat, lon },
  //   startedAt, finishedAt, durationMs,      // durationMs = time taken for the round
  //   totalScore, maxScore, questionCount, questionsPlayed, quitEarly,
  //   questions: [{
  //     number, centre: { name, country, lat, lon }, targetKm,
  //     status: "scored" | "invalid" | "timeout",
  //     answer: { name, country, lat, lon } | null,
  //     distanceKm | null, bearingDeg | null, direction | null,   // direction: "N", "NE", ... "NW"
  //     points, timeTakenMs, attemptCount
  //   }],
  //   syncedAt,
  //   scoreSyncedAt                           // public dlqScores copy uploaded (Today leaderboard)
  // }
  function getRuns() {
    return read(KEYS.runs, []);
  }

  // Saves a finished run and folds it into the player's high scores.
  // Returns { isHighScore, isRoundHighScore } for the results screen.
  function saveRun(run) {
    const record = { schemaVersion: SCHEMA_VERSION, syncedAt: null, ...run };
    const runs = getRuns();
    runs.push(record);
    write(KEYS.runs, runs);

    const player = getPlayer();
    const achievedAt = record.finishedAt;
    const isHighScore = !player.highScore || record.totalScore > player.highScore.score;
    if (isHighScore) {
      player.highScore = { score: record.totalScore, runId: record.runId, roundKey: record.roundKey, achievedAt };
    }
    const roundBest = player.roundHighScores[record.roundKey];
    const isRoundHighScore = !roundBest || record.totalScore > roundBest.score;
    if (isRoundHighScore) {
      player.roundHighScores[record.roundKey] = { score: record.totalScore, runId: record.runId, achievedAt };
    }
    player.totalRuns += 1;
    player.updatedAt = nowIso();
    write(KEYS.player, player);

    return { isHighScore, isRoundHighScore };
  }

  // ---- dlq.attempts -------------------------------------------------------
  // {
  //   schemaVersion, attemptId, runId, playerId, roundKey,
  //   questionNumber, tryNumber,                  // tryNumber: 1st, 2nd... submission on that question
  //   centre: { name, country, lat, lon }, targetKm,
  //   input,                                       // exactly what was typed ("" for a timeout)
  //   outcome: "scored" | "not_found" | "wrong_region" | "already_used" | "timeout",
  //   resolved: { name, country, lat, lon } | null,
  //   distanceKm | null, bearingDeg | null, direction | null,   // set on "scored" only
  //   points,
  //   elapsedMs,                                   // since the question appeared
  //   createdAt, syncedAt
  // }
  function getAttempts() {
    return read(KEYS.attempts, []);
  }

  function saveAttempt(attempt) {
    const record = {
      schemaVersion: SCHEMA_VERSION,
      attemptId: newId(),
      createdAt: nowIso(),
      syncedAt: null,
      ...attempt,
    };
    const attempts = getAttempts();
    attempts.push(record);
    write(KEYS.attempts, attempts);

    const player = getPlayer();
    player.totalAttempts += 1;
    player.updatedAt = nowIso();
    write(KEYS.player, player);
    return record;
  }

  // ---- Firebase sync support (used by distanceLearningBoard.js) -----------

  // Everything not yet uploaded — on first connection that's the whole
  // local history, afterwards just the latest run's records.
  function getUnsynced() {
    return {
      runs: getRuns().filter((r) => !r.syncedAt),
      attempts: getAttempts().filter((a) => !a.syncedAt),
    };
  }

  function markSynced({ runIds = [], attemptIds = [] }) {
    const at = nowIso();
    const runSet = new Set(runIds);
    const attemptSet = new Set(attemptIds);
    if (runSet.size) {
      write(KEYS.runs, getRuns().map((r) => (runSet.has(r.runId) ? { ...r, syncedAt: at } : r)));
    }
    if (attemptSet.size) {
      write(KEYS.attempts, getAttempts().map((a) => (attemptSet.has(a.attemptId) ? { ...a, syncedAt: at } : a)));
    }
  }

  // Runs finished since `sinceMs` whose public score (dlqScores, the
  // Today leaderboard) isn't uploaded yet. Tracked apart from syncedAt so
  // runs synced before that collection existed still get one, and a
  // failing score upload never holds up the run itself.
  function getUnsyncedScores(sinceMs) {
    return getRuns().filter((r) => !r.scoreSyncedAt && Date.parse(r.finishedAt) >= sinceMs);
  }

  function markScoreSynced(runId) {
    const at = nowIso();
    write(KEYS.runs, getRuns().map((r) => (r.runId === runId ? { ...r, scoreSyncedAt: at } : r)));
  }

  function setFirebaseUid(uid) {
    const player = getPlayer();
    if (player.firebaseUid === uid) return;
    player.firebaseUid = uid;
    player.syncedAt = nowIso();
    player.updatedAt = nowIso();
    write(KEYS.player, player);
  }

  // Folds the cloud copy of the player (dlqPlayers/{uid}) into the local
  // one, keeping the higher of each number — so clearing this browser's
  // storage doesn't lose high scores, and the next upload never tries to
  // lower a value Firestore's rules only allow to go up.
  function mergeRemotePlayer(remote) {
    if (!remote) return;
    const player = getPlayer();
    if (typeof remote.highScore === "number" && (!player.highScore || remote.highScore > player.highScore.score)) {
      player.highScore = { score: remote.highScore, runId: null, roundKey: remote.highScoreRoundKey || null, achievedAt: null };
    }
    Object.entries(remote.roundHighScores || {}).forEach(([roundKey, score]) => {
      const local = player.roundHighScores[roundKey];
      if (typeof score === "number" && (!local || score > local.score)) {
        player.roundHighScores[roundKey] = { score, runId: null, achievedAt: null };
      }
    });
    player.totalRuns = Math.max(player.totalRuns, remote.totalRuns || 0);
    player.totalAttempts = Math.max(player.totalAttempts, remote.totalAttempts || 0);
    if (!player.nickname && remote.nickname) player.nickname = remote.nickname;
    write(KEYS.player, player);
  }

  return {
    getPlayer, getRuns, saveRun, getAttempts, saveAttempt, newId, nowIso,
    getUnsynced, markSynced, getUnsyncedScores, markScoreSynced, setFirebaseUid, mergeRemotePlayer,
  };
})();
