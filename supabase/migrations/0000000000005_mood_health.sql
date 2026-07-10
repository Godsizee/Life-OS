-- ── Mood Tracker ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mood_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces NOT NULL,
  user_id      uuid REFERENCES auth.users NOT NULL,
  date         date NOT NULL,
  score        smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  note         text,
  UNIQUE (workspace_id, user_id, date)
);
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mood_owner" ON mood_entries
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── Körper & Gesundheit ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_entries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid REFERENCES workspaces NOT NULL,
  user_id        uuid REFERENCES auth.users NOT NULL,
  date           date NOT NULL,
  weight_kg      numeric(5,2),
  sleep_h        numeric(4,2),
  water_glasses  smallint,
  energy         smallint CHECK (energy BETWEEN 1 AND 5),
  UNIQUE (workspace_id, user_id, date)
);
ALTER TABLE health_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health_owner" ON health_entries
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
