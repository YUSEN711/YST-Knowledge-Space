import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    const { data: users, error: errorUsers } = await supabase.from('user_profiles').select('*');
    console.log("Users:", users);

    const { data: articles, error: errorArticles } = await supabase.from('articles').select('*');
    console.log("Articles:", articles?.length, "items found.");
    if (articles && articles.length > 0) {
        console.log("First article author_id:", articles[0].author_id, "is_deleted:", articles[0].is_deleted);
    }
}

checkDb();
