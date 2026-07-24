import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Sveip hele public/ - bildene ligger i public/images (1300+), ikke bare i
// public/content. Filteret nedenfor plukker uansett kun .webp.
const SWEEP_ROOTS = ['public'];
const STANDARDS = {
    MAP_WIDTH: 2560,
    IMAGE_WIDTH: 1600,
    QUALITY: 75,
    MAP_THRESHOLD: 500 * 1024, // 500KB
    IMAGE_THRESHOLD: 150 * 1024 // 150KB
};

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

async function optimize() {
    console.log(`🚀 Starting project-wide image optimization sweep in ${SWEEP_ROOTS.join(', ')}...`);
    const files = SWEEP_ROOTS.filter(root => fs.existsSync(root))
        .flatMap(root => getAllFiles(root))
        .filter(f => f.endsWith('.webp'));
    console.log(`🔍 Found ${files.length} WebP files.`);

    let optimizedCount = 0;
    let totalSaved = 0;

    for (const filePath of files) {
        const stats = fs.statSync(filePath);
        const isMap = filePath.includes('map') || filePath.includes('kart');
        const threshold = isMap ? STANDARDS.MAP_THRESHOLD : STANDARDS.IMAGE_THRESHOLD;
        const targetWidth = isMap ? STANDARDS.MAP_WIDTH : STANDARDS.IMAGE_WIDTH;

        if (stats.size > threshold) {
            const fileName = path.basename(filePath);
            console.log(`\n📦 Optimizing: ${fileName} (${(stats.size / 1024).toFixed(0)}KB)`);

            const tempPath = filePath + '.opt.webp';
            try {
                const image = sharp(filePath);
                const metadata = await image.metadata();

                if (metadata.width > targetWidth) {
                    await image
                        .resize({ width: targetWidth, withoutEnlargement: true })
                        .webp({ quality: STANDARDS.QUALITY, effort: 6 })
                        .toFile(tempPath);
                } else {
                    await image
                        .webp({ quality: STANDARDS.QUALITY, effort: 6 })
                        .toFile(tempPath);
                }

                const newStats = fs.statSync(tempPath);

                if (newStats.size < stats.size) {
                    const saved = stats.size - newStats.size;
                    totalSaved += saved;
                    optimizedCount++;

                    fs.copyFileSync(tempPath, filePath);
                    console.log(`✅ Done: ${(newStats.size / 1024).toFixed(0)}KB (Saved ${(saved / 1024).toFixed(0)}KB)`);
                } else {
                    console.log(`⏩ Skipped: Original was already better.`);
                }

                fs.unlinkSync(tempPath);
            } catch (err) {
                console.error(`❌ Error optimizing ${fileName}:`, err.message);
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }
        }
    }

    console.log(`\n✨ Optimization Sweep Complete!`);
    console.log(`🔹 Files optimized: ${optimizedCount}`);
    console.log(`🔹 Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
}

optimize();
