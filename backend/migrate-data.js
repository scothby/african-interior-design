const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
    console.log('🔄 Starting data migration to Supabase...');

    // 1. Migrate Styles
    try {
        const stylesPath = path.join(__dirname, '..', 'src', 'african-styles-db.json');
        if (fs.existsSync(stylesPath)) {
            const stylesData = JSON.parse(fs.readFileSync(stylesPath, 'utf-8'));
            if (stylesData && stylesData.styles && stylesData.styles.length > 0) {
                console.log(`Found ${stylesData.styles.length} styles to migrate.`);
                const { error } = await supabase.from('styles').upsert(
                    stylesData.styles.map(s => ({
                        id: s.id,
                        name: s.name,
                        region: s.region || 'Other',
                        family: s.family || 'Other',
                        description: s.description || '',
                        prompt: s.prompt || `${s.name} interior design`,
                        materials: s.materials || [],
                        colors: s.colors || [],
                        patterns: s.patterns || [],
                        flag: s.flag || '🌍'
                    }))
                );
                if (error) throw error;
                console.log('✅ Styles migrated successfully.');
            }
        } else {
            console.log('⚠️ african-styles-db.json not found, skipping styles migration.');
        }
    } catch (err) {
        console.error('❌ Error migrating styles:', err);
    }

    // 2. Migrate Gallery
    try {
        const galleryPath = path.join(__dirname, 'gallery.json');
        if (fs.existsSync(galleryPath)) {
            const galleryData = JSON.parse(fs.readFileSync(galleryPath, 'utf-8'));
            if (galleryData && galleryData.length > 0) {
                console.log(`Found ${galleryData.length} gallery entries to migrate.`);
                const { error } = await supabase.from('gallery').upsert(
                    galleryData.map(g => ({
                        id: g.id,
                        original_image_url: g.originalImage,
                        generated_image_url: g.generatedImage,
                        style_name: g.styleName,
                        style_family: g.styleFamily,
                        style_id: g.styleId,
                        prompt: g.prompt,
                        custom_prompt: g.customPrompt,
                        mode: g.mode,
                        is_favorite: g.isFavorite,
                        world_url: g.worldUrl,
                        world_operation_id: g.worldOperationId,
                        created_at: g.createdAt || new Date().toISOString()
                    }))
                );
                if (error) throw error;
                console.log('✅ Gallery migrated successfully.');
            }
        } else {
            console.log('⚠️ gallery.json not found, skipping gallery migration.');
        }
    } catch (err) {
        console.error('❌ Error migrating gallery:', err);
    }

    console.log('🎉 Migration check complete.');
    process.exit(0);
}

migrateData();
