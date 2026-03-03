/**
 * Reconstructs the gallery table from the files in backend/generated for the admin user.
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
// Note: using direct strings if I can't read .env easily in a script
const SUPABASE_URL = 'https://zytruafngsrlvrfvzxnv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_ID = 'd010dae6-1b2e-44c8-9d84-b0420f37c278';

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function restore() {
    const generatedDir = 'e:\\African Interior Design\\backend\\generated';
    if (!fs.existsSync(generatedDir)) {
        console.error('Dir not found');
        return;
    }
    const files = fs.readdirSync(generatedDir);

    const entries = files.filter(f => f.startsWith('generated-') && f.endsWith('.png')).map(file => {
        const parts = file.split('-');
        if (parts.length < 2) return null;
        const timestampStr = parts[1];
        const timestamp = parseInt(timestampStr);
        if (isNaN(timestamp)) return null;

        return {
            id: `gallery-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
            generated_image_url: `/generated/${file}`,
            style_name: file.replace('generated-' + timestampStr + '-', '').replace('.png', '').replace(/-/g, ' '),
            created_at: new Date(timestamp).toISOString(),
            user_id: ADMIN_ID,
            mode: 'generate',
            is_favorite: false
        };
    }).filter(Boolean);

    console.log(`Inserting ${entries.length} entries for user ${ADMIN_ID}...`);
    const { error } = await supabase.from('gallery').insert(entries);
    if (error) {
        console.error('Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Restoration complete!');
    }
}

restore();
