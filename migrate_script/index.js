const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
// Using the service role key if available for bypassing RLS during migration, or falling back to anon
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

if (!supabaseUrl || !supabaseAdminKey) {
    console.error("❌ Missing Supabase credentials in .env file.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAdminKey);

const dbPath = path.join(__dirname, '../src/african-styles-db.json');

async function migrate() {
    console.log("🚀 Starting database migration to Supabase...");

    // 1. Read JSON file
    if (!fs.existsSync(dbPath)) {
        console.error(`❌ JSON file not found at ${dbPath}`);
        process.exit(1);
    }

    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const styles = dbData.styles;

    console.log(`📦 Found ${styles.length} styles to migrate.`);

    let successCount = 0;
    let errorCount = 0;

    // 2. Insert into Supabase
    // We insert one by one or in small batches to handle potential duplicates or errors gracefully
    for (const style of styles) {
        // Construct the row mapping to Supabase columns
        // Assuming your 'styles' table in Supabase has these columns matching the JSON structure.
        // If the table schema is different, we need to map the keys accordingly.
        const styleRecord = {
            id: style.id,
            name: style.name,
            country: style.country || null,
            region: style.region || 'Other',
            family: style.family || 'Other',
            description: style.description || '',
            prompt: style.prompt || '',
            materials: style.materials || [],
            colors: style.colors || [],
            color_names: style.colorNames || [], // Mapping colorNames to color_names if needed, or keeping it as in json
            patterns: style.patterns || [],
            rooms: style.rooms || [],
            flag: style.flag || '🌍'
        };

        // Note: Supabase might expect snake_case columns if that's how it was created. 
        // We will try inserting the camelCase version first, assuming the DB matches the API expectation.
        // The /api/styles endpoint expects: name, region, family, description, prompt, materials, colors, patterns, flag

        try {
            // Use upsert to avoid duplicate key errors if run multiple times
            const { error } = await supabase
                .from('styles')
                .upsert(
                    {
                        id: style.id, // Primary key
                        name: style.name,
                        region: style.region,
                        family: style.family,
                        description: style.description,
                        prompt: style.prompt,
                        materials: style.materials,
                        colors: style.colors,
                        patterns: style.patterns,
                        flag: style.flag,
                    },
                    { onConflict: 'id' }
                );

            if (error) {
                console.error(`❌ Error migrating style '${style.name}':`, error.message);

                // If the error is about a missing column (like color_names or rooms), we might need to alter the table or skip those fields.
                // Let's log it and continue
                errorCount++;
            } else {
                process.stdout.write('.');
                successCount++;
            }
        } catch (e) {
            console.error(`❌ Unexpected error on '${style.name}':`, e);
            errorCount++;
        }
    }

    console.log("\n✅ Migration complete!");
    console.log(`📊 Successfully migrated: ${successCount}/${styles.length}`);
    if (errorCount > 0) {
        console.log(`⚠️ Errors encountered: ${errorCount}. Check logs above.`);
    }
}

migrate();
