const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
);

async function generateTools() {
  const { data, error } = await supabase.rpc("list_ai_functions");

  if (error) {
    throw error;
  }

  const tools = (data || []).map((fn) => ({
    type: "function",
    function: {
      name: fn.function_name,
      description: fn.description || "Database RPC function",
      parameters: {
        type: "object",
        properties: (fn.parameters || []).reduce((acc, p) => {
          acc[p.name] = { type: "string" };
          return acc;
        }, {}),
        required: (fn.parameters || []).map((p) => p.name)
      }
    }
  }));

  const outputPath = path.resolve(__dirname, "..", "tools", "toolRegistry.json");
  fs.writeFileSync(outputPath, JSON.stringify(tools, null, 2));

  console.log("Tool registry generated:", outputPath);
}

generateTools().catch((err) => {
  console.error("Tool registry generation failed:", err.message || err);
  process.exit(1);
});
