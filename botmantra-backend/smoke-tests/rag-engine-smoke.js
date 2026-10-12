// Smoke test: /api/ui-tools/rag (requires auth token)

const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
const token = process.env.UI_TOOLS_TOKEN || process.env.AUTH_TOKEN;

async function run() {
  if (!token) {
    console.log('⚠️  UI_TOOLS_TOKEN not set. Skipping RAG smoke test.');
    process.exit(0);
  }

  const payload = {
    question: 'What tables exist in this system?',
    agent: 'default'
  };

  const res = await fetch(`${baseUrl}/api/ui-tools/rag`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    console.error('❌ RAG engine failed:', res.status, data);
    process.exit(1);
  }

  console.log('✅ RAG engine response:', data);
}

run().catch((err) => {
  console.error('❌ Smoke test error:', err);
  process.exit(1);
});
