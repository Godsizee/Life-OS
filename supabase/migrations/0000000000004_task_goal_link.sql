-- M4 Extension: Task→Goal link + Weekly Review entry_type
-- Additive only, keine Breaking Changes.

-- 1. Tasks: optionale Ziel-Verknüpfung
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES goals(id) ON DELETE SET NULL;

-- 2. Journal entries: Typ-Unterscheidung (daily vs. weekly_review)
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'daily'
  CHECK (entry_type IN ('daily', 'weekly_review'));

-- Index für Goal-Task-Lookups
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks (goal_id) WHERE goal_id IS NOT NULL;
