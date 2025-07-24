require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const run = async () => {
  try {
    const { data, error } = await supabase
      .from('summaries')
      .select('*');

    if (error) throw error;

    if (!data || data.length === 0) {
      console.log('No data found in summaries table.');
    } else {
      console.log('Data from summaries table:');
      console.log(data);
    }
  } catch (err) {
    console.error('Error:', err.message || err);
  }
};

run();
