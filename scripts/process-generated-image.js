import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const [,, src, dest] = process.argv;

if (!src || !dest) {
    console.error("Usage: node scripts/process-generated-image.js <src> <dest>");
    process.exit(1);
}

async function run() {
    try {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        const isMap = dest.includes('map') || dest.includes('kart');
        const targetWidth = isMap ? 2560 : 1600;
        const quality = 75;

        console.log(`📷 Processing image: ${src} -> ${dest}`);
        await sharp(src)
            .resize({ width: targetWidth, withoutEnlargement: true })
            .webp({ quality })
            .toFile(dest);

        const stats = fs.statSync(dest);
        console.log(`✅ Success: Optimized image saved to ${dest} (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
        console.error(`❌ Error processing image:`, err);
        process.exit(1);
    }
}

run();
