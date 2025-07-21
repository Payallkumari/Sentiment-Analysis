// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwhxwprzaqyfvqgqxpnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aHh3cHJ6YXF5ZnZxZ3F4cG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzA0NDMsImV4cCI6MjA2NzcwNjQ0M30.64E6f1xmdUWrJShyS2RfzAXmNUUHqMDf1CX2-xvBY9Y'; // Replace with your public anon key

export const supabase = createClient(supabaseUrl, supabaseKey);
