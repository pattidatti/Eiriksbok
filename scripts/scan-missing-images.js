import fs from 'fs';
import path from 'path';

const CONTENT_DIR = 'public/content';

function getAllJsonFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            getAllJsonFiles(filePath, files);
        } else if (file.endsWith('.json')) {
            files.push(filePath);
        }
    });
    return files;
}

function findImages(obj, paths = []) {
    if (typeof obj === 'string' && obj.startsWith('/images/') && !obj.includes('placeholder')) {
        paths.push(obj);
    } else if (obj && typeof obj === 'object') {
        if (Array.isArray(obj)) {
            for (const item of obj) {
                findImages(item, paths);
            }
        } else {
            for (const value of Object.values(obj)) {
                findImages(value, paths);
            }
        }
    }
    return paths;
}

function run() {
    const jsonFiles = getAllJsonFiles(CONTENT_DIR);
    let foundBroken = false;

    console.log(`🔍 Scanning content files for broken image references...`);
    for (const file of jsonFiles.sort()) {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            const images = findImages(data);
            const missing = [...new Set(images)].filter(p => !fs.existsSync(path.join('public', p)));
            
            if (missing.length > 0) {
                foundBroken = true;
                console.log(`📄 ${file}`);
                missing.forEach(img => console.log(`   ❌ Missing: ${img}`));
            }
        } catch (err) {
            // Ignore parse errors or read errors
        }
    }

    if (!foundBroken) {
        console.log(`✅ No broken image references found!`);
    }
}

run();
