// Smoke test: /api/kernel/execute

const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

async function run() {
  const payload = {
    nidHash: 'smoke-test-node',
    requesterUuid: '00000000-0000-0000-0000-000000000000',
    targetOwnerId: '00000000-0000-0000-0000-000000000000',
    actionType: 'read',
    principle: 'default',
    payload: { smokeTest: true },
    actionName: 'smoke_test'
  };

  const res = await fetch(`${baseUrl}/api/kernel/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    console.error('❌ Kernel execute failed:', res.status, data);
    process.exit(1);
  }

  console.log('✅ Kernel execute response:', data);
}

run().catch((err) => {
  console.error('❌ Smoke test error:', err);
  process.exit(1);
});
