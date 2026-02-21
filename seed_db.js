import { createClient } from '@supabase/supabase-js';

const INITIAL_ARTICLES = [
    {
        title: 'M4 iPad Pro 評測：極致纖薄與強大效能的結合',
        summary: '這部影片深入探討了全新 M4 iPad Pro 的各項細節。從令人驚豔的 Tandem OLED 螢幕到不可思議的薄度，再到 M4 晶片的效能測試。MKBHD 分析了這款設備是否能夠真正取代筆記型電腦，以及它在蘋果生態系中的定位，是追求極致硬體愛好者不可錯過的評測。',
        url: 'https://www.youtube.com/watch?v=bs5BjuiaDeI',
        image_url: 'https://img.youtube.com/vi/bs5BjuiaDeI/maxresdefault.jpg',
        category: 'Tech',
        type: 'YOUTUBE',
        date: '2024-05-15',
        author_name: 'Marques Brownlee',
        is_featured: true
    },
    {
        title: '空間運算的未來：Vision Pro 深度解析',
        summary: '探討蘋果最新的空間運算設備如何重新定義我們與數位內容的互動方式，以及其對開發者生態的影響。',
        url: '#',
        image_url: 'https://picsum.photos/800/600?random=1',
        category: 'Tech',
        type: 'ARTICLE',
        date: '2023-10-24',
        author_name: 'Tech editor'
    },
    {
        title: '極簡主義設計原則在現代網頁的應用',
        summary: '如何運用負空間與排版層次，創造出既美觀又實用的使用者介面。',
        url: '#',
        image_url: 'https://picsum.photos/800/600?random=2',
        category: 'Style',
        type: 'ARTICLE',
        date: '2023-10-22',
        author_name: 'Design Lead'
    },
    {
        title: '永續能源的新突破：固態電池技術',
        summary: '科學家在固態電池領域取得重大進展，電動車續航力將迎來倍數成長。',
        url: '#',
        image_url: 'https://picsum.photos/800/600?random=3',
        category: 'Science',
        type: 'ARTICLE',
        date: '2023-10-20',
        author_name: 'Science Daily'
    },
    {
        title: '原子習慣：細微改變帶來巨大成就',
        summary: '這本書深入探討了習慣養成的心理學機制，讀後讓我重新審視每日的微小決定如何影響長期目標。',
        url: '#',
        image_url: 'https://picsum.photos/800/600?random=4',
        category: 'Books',
        type: 'BOOK',
        date: '2023-10-18',
        author_name: 'Book Lover'
    },
    {
        title: '2024 全球經濟趨勢預測',
        summary: '這部影片詳細分析了通膨、AI 產業與地緣政治對明年商業環境的影響，非常值得參考。',
        url: '#',
        image_url: 'https://picsum.photos/800/600?random=5',
        category: 'Business',
        type: 'YOUTUBE',
        date: '2023-10-15',
        author_name: 'Market Watch'
    },
    {
        title: '咖啡沖煮的科學',
        summary: '從化學角度解析萃取過程，讓每一杯咖啡都能保持最佳風味。',
        url: '#',
        image_url: 'https://picsum.photos/800/600?random=6',
        category: 'Style',
        type: 'ARTICLE',
        date: '2023-10-12',
        author_name: 'Barista Joe'
    }
];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    const { data: users, error: errorUsers } = await supabase.from('user_profiles').select('*').limit(1);
    if (!users || users.length === 0) {
        console.error("No users found to link articles to.");
        process.exit(1);
    }
    const author_id = users[0].id;

    const payload = INITIAL_ARTICLES.map(art => ({
        ...art,
        author_id
    }));

    const { error } = await supabase.from('articles').insert(payload);
    if (error) {
        console.error("Failed to seed:", error);
    } else {
        console.log("Successfully seeded 7 articles!");
    }
}

seed();
