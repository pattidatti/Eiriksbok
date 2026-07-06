import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const JOBS_FILE = 'scripts/image-jobs.json';

async function run() {
    if (!fs.existsSync(JOBS_FILE)) {
        console.log(`ℹ️ No image jobs found at ${JOBS_FILE}`);
        return;
    }

    try {
        const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
        console.log(`🚀 Processing ${jobs.length} image optimization jobs...`);

        for (const job of jobs) {
            const { src, dest } = job;
            if (!src || !dest) {
                console.warn(`⚠️ Warning: Invalid job entry:`, job);
                continue;
            }

            const destDir = path.dirname(dest);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            const isMap = dest.includes('map') || dest.includes('kart');
            const targetWidth = isMap ? 2560 : 1600;
            const quality = 75;

            console.log(`📷 Processing: ${src} -> ${dest}`);
            await sharp(src)
                .resize({ width: targetWidth, withoutEnlargement: true })
                .webp({ quality })
                .toFile(dest);

            const stats = fs.statSync(dest);
            console.log(`   ✅ Optimized: ${(stats.size / 1024).toFixed(1)} KB`);
        }

        // Clean up the jobs file after successful processing
        fs.unlinkSync(JOBS_FILE);
        console.log(`✨ All jobs processed and ${JOBS_FILE} cleaned up!`);
    } catch (err) {
        console.error(`❌ Error running image jobs:`, err);
        process.exit(1);
    }
}

run();
