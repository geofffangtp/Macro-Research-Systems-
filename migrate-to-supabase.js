// Run this in browser console at localhost:3000 to migrate localStorage data to Supabase
// Copy and paste this entire script into the browser console

(async function migrateToSupabase() {
  const SUPABASE_URL = 'https://qejwqjajcocmqxyzxyec.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_cQ4g8mdK_XeuuNZ83BC3lg_8uDNcEoi';

  // Get localStorage data
  const stored = localStorage.getItem('macro-research-store');
  if (!stored) {
    console.error('No localStorage data found!');
    return;
  }

  const data = JSON.parse(stored);
  const state = data.state;

  console.log('Found data:', {
    sources: state.sources?.length || 0,
    sourceItems: state.sourceItems?.length || 0,
    dataReleases: state.dataReleases?.length || 0,
    knowledgeEntries: state.knowledgeEntries?.length || 0,
    predictions: state.predictions?.length || 0,
    digests: state.digests?.length || 0,
    chatSessions: state.chatSessions?.length || 0,
    thesis: state.thesis ? 'yes' : 'no'
  });

  // Helper to convert camelCase to snake_case
  function toSnakeCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toSnakeCase);

    const result = {};
    for (const key in obj) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = obj[key];
    }
    return result;
  }

  // Helper to insert data
  async function insertData(table, items) {
    if (!items || items.length === 0) {
      console.log(`Skipping ${table} - no data`);
      return;
    }

    const snakeItems = items.map(toSnakeCase);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(snakeItems)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Error inserting ${table}:`, error);
    } else {
      console.log(`✓ Migrated ${items.length} ${table}`);
    }
  }

  // Migrate each table
  console.log('Starting migration...');

  await insertData('sources', state.sources);
  await insertData('source_items', state.sourceItems);
  await insertData('data_releases', state.dataReleases);
  await insertData('knowledge_entries', state.knowledgeEntries);
  await insertData('predictions', state.predictions);
  await insertData('digests', state.digests);
  await insertData('chat_sessions', state.chatSessions);

  // Handle thesis separately (single object)
  if (state.thesis) {
    await insertData('thesis', [state.thesis]);
  }

  console.log('Migration complete! Refresh the page to see your data.');
})();
