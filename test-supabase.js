const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log("Testing contact_messages insert...");
  const { error: e1 } = await supabase.from('contact_messages').insert([{
    name: 'Test', email: 'test@test.com', message: 'test'
  }]);
  console.log("contact_messages insert error:", e1);

  console.log("Testing newsletter_subscribers insert...");
  const { error: e2 } = await supabase.from('newsletter_subscribers').insert([{
    email: 'test' + Date.now() + '@test.com'
  }]);
  console.log("newsletter_subscribers insert error:", e2);

  console.log("Testing Admin Select contact_messages...");
  const { data: d3, error: e3 } = await supabase.from('contact_messages').select('*');
  console.log("contact_messages count:", d3 ? d3.length : 'null', "error:", e3);

  console.log("Testing Admin Select newsletter_subscribers...");
  const { data: d4, error: e4 } = await supabase.from('newsletter_subscribers').select('*');
  console.log("newsletter_subscribers count:", d4 ? d4.length : 'null', "error:", e4);
}

test();
