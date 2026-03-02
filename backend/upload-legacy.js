const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing credentials");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("Starting legacy images syncer...");
    const { data: gallery, error } = await supabase.from('gallery').select('*');
    if (error) { console.error("Error fetching gallery", error); return; }

    for (let item of gallery) {
        if (item.original_image_url && !item.original_image_url.startsWith('http')) {
            const filename = path.basename(item.original_image_url);
            const localPath = path.join(__dirname, 'uploads', filename);
            if (fs.existsSync(localPath)) {
                const fileBuffer = fs.readFileSync(localPath);
                await supabase.storage.from('uploads').upload(`public/${filename}`, fileBuffer, { upsert: true });
                const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(`public/${filename}`);
                await supabase.from('gallery').update({ original_image_url: publicUrlData.publicUrl }).eq('id', item.id);
                console.log('✅ Uploaded original:', filename);
            } else {
                console.log('❌ Not found locally:', localPath);
            }
        }

        if (item.generated_image_url && !item.generated_image_url.startsWith('http')) {
            const filename = path.basename(item.generated_image_url);
            const localPath = path.join(__dirname, 'generated', filename);
            if (fs.existsSync(localPath)) {
                const fileBuffer = fs.readFileSync(localPath);
                await supabase.storage.from('generated').upload(`public/${filename}`, fileBuffer, { upsert: true });
                const { data: publicUrlData } = supabase.storage.from('generated').getPublicUrl(`public/${filename}`);
                await supabase.from('gallery').update({ generated_image_url: publicUrlData.publicUrl }).eq('id', item.id);
                console.log('✅ Uploaded generated:', filename);
            } else {
                console.log('❌ Not found locally:', localPath);
            }
        }
    }
    console.log("Done!");
}
run();
