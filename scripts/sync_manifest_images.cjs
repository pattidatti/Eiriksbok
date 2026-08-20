const fs = require('fs');
const path = require('path');
const manifestIo = require('./lib/manifest-io.cjs');

// Stien kommer fra manifest-io slik at skriptet ikke er avhengig av hvilken
// mappe cronen står i når den kaller det.
const MANIFEST_PATH = manifestIo.MANIFEST_PATH;
const CONTENT_DIR = path.resolve(__dirname, '../public/content');

function syncImages() {
    console.log('Starting manifest image sync...');

    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error('Manifest file not found at:', MANIFEST_PATH);
        return;
    }

    const manifest = manifestIo.readManifest();
    let updates = 0;

    manifest.subjects.forEach(subject => {
        if (!subject.topics) return;

        subject.topics.forEach(topic => {
            // Handle direct lessons
            if (topic.lessons) {
                topic.lessons.forEach(lesson => {
                    updates += processLesson(subject.id, topic.id, null, lesson);
                });
            }

            // Handle subtopics if they exist
            if (topic.subTopics) {
                topic.subTopics.forEach(subTopic => {
                    if (subTopic.lessons) {
                        subTopic.lessons.forEach(lesson => {
                            updates += processLesson(subject.id, topic.id, subTopic.id, lesson);
                        });
                    }
                });
            }
        });
    });

    if (updates > 0) {
        manifestIo.writeManifest(manifest);
        console.log(`\nSync complete. Updated ${updates} lessons.`);
    } else {
        console.log('\nSync complete. No updates needed.');
    }
}

function processLesson(subjectId, topicId, subTopicId, lesson) {
    // Skip if image is already set and is not a placeholder
    if (lesson.image && lesson.image.trim() !== '' && lesson.image !== '/images/placeholder.webp') {
        return 0;
    }

    // Construct potential file paths
    // Strategy 1: [subject]/[topic]/[lesson].json
    // Strategy 2: [subject]/[topic]/[subTopic]/[lesson].json (if subTopic exists)

    let filePaths = [];

    if (subTopicId) {
        filePaths.push(path.join(CONTENT_DIR, subjectId, topicId, subTopicId, `${lesson.id}.json`));
        filePaths.push(path.join(CONTENT_DIR, subjectId, topicId, `${lesson.id}.json`)); // Fallback
    } else {
        filePaths.push(path.join(CONTENT_DIR, subjectId, topicId, `${lesson.id}.json`));
    }

    for (const filePath of filePaths) {
        if (fs.existsSync(filePath)) {
            try {
                const article = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const img = article.heroImage || article.image;
                if (img) {
                    console.log(`Updating ${lesson.title} (${lesson.id}) with image: ${img}`);
                    lesson.image = img;
                    return 1;
                }
            } catch (e) {
                console.error(`Error reading/parsing ${filePath}:`, e.message);
            }
        }
    }

    return 0;
}

syncImages();
