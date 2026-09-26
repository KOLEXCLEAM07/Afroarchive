import { supabase } from '../src/lib/supabase';

async function testConnection() {
  console.log('Testing frontend Supabase client connection (anon key)...');
  
  const { data: items, error: itemsError } = await supabase
    .from('knowledge_items')
    .select('id, title, knowledge_type, country_codes, created_at')
    .limit(5);

  if (itemsError) {
    console.error('❌ Connection error on knowledge_items:', itemsError);
  } else {
    console.log(`✅ Successfully queried knowledge_items! Found ${items?.length} items:`);
    items?.forEach((item, i) => console.log(`   ${i + 1}. [${item.knowledge_type}] ${item.title}`));
  }

  const { data: sources, error: sourcesError } = await supabase
    .from('sources')
    .select('name, slug, base_url');

  if (sourcesError) {
    console.error('❌ Connection error on sources:', sourcesError);
  } else {
    console.log(`✅ Successfully queried sources! Found ${sources?.length} sources:`);
    sources?.forEach((s) => console.log(`   - ${s.name} (${s.slug})`));
  }
}

testConnection();
