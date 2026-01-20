-- Analytics Events Table
-- Stores all analytics events from client tracking

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL,
  session_id TEXT,
  project_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_project_id ON analytics_events(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id) WHERE session_id IS NOT NULL;

-- Composite index for user + time queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp DESC);

-- Composite index for event type + time queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp ON analytics_events(event_type, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own events
CREATE POLICY "Users can insert own events"
  ON analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own events
CREATE POLICY "Users can view own events"
  ON analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all events (for dashboard)
-- Note: Requires an is_admin column or function in your auth setup
-- For now, we'll create a function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in metadata
  -- This can be customized based on your auth setup
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'is_admin')::BOOLEAN,
      FALSE
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can view all events"
  ON analytics_events
  FOR SELECT
  USING (is_admin());

-- Create a view for daily aggregations (useful for dashboards)
CREATE OR REPLACE VIEW analytics_daily_summary AS
SELECT
  DATE(timestamp) as date,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
GROUP BY DATE(timestamp), event_type
ORDER BY date DESC, event_count DESC;

-- Grant permissions
GRANT SELECT ON analytics_daily_summary TO authenticated;

-- Add comment
COMMENT ON TABLE analytics_events IS 'Stores client-side analytics events for tracking user behavior and system usage';
