-- Auto tool discovery RPC and AI telemetry log table

CREATE OR REPLACE FUNCTION list_ai_functions()
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'function_name', routine_name,
        'description', COALESCE(routine_comment, ''),
        'parameters', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'name', parameter_name
            )
          )
          FROM information_schema.parameters
          WHERE specific_name = r.specific_name
        )
      )
    )
    FROM information_schema.routines r
    WHERE routine_schema = 'public'
  );
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS ai_execution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  business_id uuid,
  model text,
  tool_used text,
  prompt_tokens integer,
  completion_tokens integer,
  latency_ms integer,
  success boolean,
  error_message text,
  created_at timestamptz DEFAULT now()
);
