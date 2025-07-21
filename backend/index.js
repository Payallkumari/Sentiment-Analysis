require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Hardcoded app names to count
const hardcodedApps = ['sunwai', 'ubl digital', 'hbl', 'meezan bank', 'al habib'];

const run = async () => {
  try {
    const { count: totalCount, error: countError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    console.log(`Total rows in 'reviews': ${totalCount}`);

    const { data: filteredData, error: filteredError } = await supabase
      .from('reviews')
      .select('app')
      .in('app', ['Sunwai', 'UBL Digital']);

    if (filteredError) throw filteredError;
    console.log(`Total reviews for 'Sunwai' and 'UBL Digital': ${filteredData.length}`);

    const { data: oneRowEach, error: rowError } = await supabase
      .from('reviews')
      .select('*')
      .in('app', ['Sunwai', 'UBL Digital'])
      .limit(2);

    if (rowError) throw rowError;
    console.log('Sample data for Sunwai and UBL Digital:');
    oneRowEach.forEach(row => console.log(row));

    const { data: allData, error: allError } = await supabase
      .from('reviews')
      .select('*');

    if (allError) throw allError;

    const counts = {};
    hardcodedApps.forEach(app => counts[app] = 0); // Initialize counts for hardcoded apps

    allData.forEach(row => {
      const app = row.app?.toString().replace(/\s+/g, ' ').trim().toLowerCase() || 'unknown';
      if (hardcodedApps.includes(app)) {
        counts[app] = (counts[app] || 0) + 1;
      }
    });

    console.log('Review counts for hardcoded apps:');
    for (const [app, count] of Object.entries(counts)) {
      console.log(`${app}: ${count}`);
    }

  } catch (err) {
    console.error('Error:', err.message || err);
  }
};

run();