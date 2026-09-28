const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '../public/content');
const OUTPUT_FILE = path.join(__dirname, '../src/data/learningPaths.json');

// Map subject IDs to display names and colors for enrichment
const SUBJECTS = {
    'historie': { name: 'Historie', color: 'amber' },
    'norsk': { name: 'Norsk', color: 'red' },
    'krle': { name: 'KRLE', color: 'violet' },
    'samfunnskunnskap': { name: 'Samfunnskunnskap', color: 'blue' },
    'musikk': { name: 'Musikk', color: 'pink' },
    'naturfag': { name: 'Naturfag', color: 'green' },
    'annet': { name: 'Annet', color: 'gray' }
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

function scanLearningPaths() {
    console.log('🔍 Scanning for learning paths...');

    const allFiles = getAllFiles(CONTENT_DIR);
    const learningPaths = [];

    allFiles.forEach(file => {
        if (/-sti(-v2)?\.json$/.test(file)) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const data = JSON.parse(content);

                // Validation logic
                if (!data.id || !data.title) {
                    console.warn(`⚠️ Skipping invalid file: ${file} (Missing id or title)`);
                    return;
                }

                // INFERENCE LOGIC
                // Get path relative to 'content' directory
                const relativePath = path.relative(CONTENT_DIR, file);
                const pathParts = relativePath.split(path.sep);

                // Default inferences
                let inferredSubject = 'annet';
                let inferredTopic = 'generelt';

                // Assuming structure: content/{subject}/{topic}/{filename}
                if (pathParts.length >= 2) {
                    inferredSubject = pathParts[0].toLowerCase();
                }
                if (pathParts.length >= 3) {
                    inferredTopic = pathParts[1].toLowerCase(); // Folder inside subject is Topic
                }

                // Use explicit values if present, otherwise inferred
                const pathData = data.learningPathV3Data || data.learningPathData;
                const subjectId = data.targetSubjectId || pathData?.targetSubjectId || inferredSubject;
                const topicId = data.targetTopicId || pathData?.targetTopicId || inferredTopic;
                const isV3 = !!data.learningPathV3Data || data.layout === 'learning-path-v3';

                // Construct the link URL
                // Route: /:subjectId/:topicId/:lessonId
                const linkUrl = `/${subjectId}/${topicId}/${data.id}`;

                // Extract Metadata
                const metadata = {
                    id: data.id,
                    title: data.title,
                    description: data.description || pathData?.description || "",
                    subjectId: subjectId,
                    subjectName: SUBJECTS[subjectId]?.name || subjectId,
                    topicId: topicId,
                    year: data.year,
                    readTime: data.readTime,
                    path: linkUrl, // Use the correct application route
                    fileRelativePath: relativePath,
                    version: isV3 ? 3 : 1
                };

                learningPaths.push(metadata);
                console.log(`✅ Found: ${metadata.title} -> ${linkUrl}`);

            } catch (err) {
                console.error(`❌ Error parsing ${file}:`, err.message);
            }
        }
    });

    // Helper to parse start year from string "750 f.Kr - 1066" or "1940"
    const getStartYear = (yearStr) => {
        if (!yearStr) return 9999;
        const firstPart = yearStr.split('-')[0].trim().toLowerCase();
        let year = parseInt(firstPart.replace(/\D/g, ''));
        if (firstPart.includes('f.kr') || firstPart.includes('b.c')) {
            year = -year;
        }
        return isNaN(year) ? 9999 : year;
    };

    // Sort by Subject then by Year (Chronological) then by Title
    learningPaths.sort((a, b) => {
        if (a.subjectId !== b.subjectId) return a.subjectId.localeCompare(b.subjectId);

        const yearA = getStartYear(a.year);
        const yearB = getStartYear(b.year);

        if (yearA !== yearB) return yearA - yearB;

        return a.title.localeCompare(b.title);
    });

    const outputData = {
        updatedAt: new Date().toISOString(),
        count: learningPaths.length,
        paths: learningPaths
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    console.log(`\n🎉 Successfully wrote ${learningPaths.length} learning paths to ${OUTPUT_FILE}`);
}

scanLearningPaths();
