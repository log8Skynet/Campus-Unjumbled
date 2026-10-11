CREATE TABLE players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  branch       TEXT NOT NULL,
  device_token TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE puzzles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id        TEXT NOT NULL UNIQUE,
  image_url        TEXT NOT NULL,
  difficulty       TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  location_name    TEXT NOT NULL,
  location_aliases JSONB NOT NULL DEFAULT '[]',
  ace_time_ms      INTEGER NOT NULL,
  par_time_ms      INTEGER NOT NULL,
  max_score        INTEGER NOT NULL DEFAULT 1000,
  published        BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE attempts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id      UUID NOT NULL REFERENCES players(id),
  puzzle_id      UUID NOT NULL REFERENCES puzzles(id),
  start_ts       TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_ts         TIMESTAMPTZ,
  duration_ms    INTEGER GENERATED ALWAYS AS (
                   EXTRACT(EPOCH FROM (end_ts - start_ts)) * 1000
                 ) STORED,
  move_count     INTEGER NOT NULL DEFAULT 0,
  gamble_choice  TEXT CHECK (gamble_choice IN ('accepted','rejected')),
  answer_given   TEXT,
  answer_correct BOOLEAN,
  final_score    INTEGER,
  speed_tier     TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attempts_puzzle_score ON attempts(puzzle_id, final_score DESC);
CREATE INDEX idx_attempts_player ON attempts(player_id);

CREATE TABLE badges (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL
);

CREATE TABLE player_badges (
  player_id  UUID NOT NULL REFERENCES players(id),
  badge_id   TEXT NOT NULL REFERENCES badges(id),
  attempt_id UUID NOT NULL REFERENCES attempts(id),
  earned_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (player_id, badge_id)
);

INSERT INTO badges (id, name, description, icon) VALUES
  ('first_solve',      'First Solve',      'Completed your first puzzle',                         '🎯'),
  ('speedster',        'Speedster',        'Solved any puzzle under its ace time',                '⚡'),
  ('campus_native',    'Campus Native',    'Solved and correctly named a location at par or ace', '🏛️'),
  ('risk_taker',       'Risk Taker',       'Won 3 double-or-nothing gambles',                     '🎲'),
  ('record_holder',    'Record Holder',    'Holds the fastest time on any puzzle',                '🥇'),
  ('campus_explorer',  'Campus Explorer',  'Completed every published puzzle',                    '🗺️'),
  ('branch_champion',  'Branch Champion',  'Your branch tops the global branch ranking',          '🏆');