import fs from 'fs';
import sharp from 'sharp';
import path from 'path';

const jobs = [
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/american_constitution_1783143134108.jpg',
        dest: 'public/images/den-amerikanske-revolusjonen/den-amerikanske-grunnloven-hero.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/philadelphia_convention_1783143146657.jpg',
        dest: 'public/images/den-amerikanske-revolusjonen/den-amerikanske-grunnloven-01.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/three_pillars_1783143156991.jpg',
        dest: 'public/images/den-amerikanske-revolusjonen/den-amerikanske-grunnloven-02.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/enslaved_laborers_1783143169307.jpg',
        dest: 'public/images/den-amerikanske-revolusjonen/den-amerikanske-grunnloven-03.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/american_revolution_hero_1783143185258.jpg',
        dest: 'public/images/den-amerikanske-revolusjonen/uavhengighetskrigen-hero.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/boston_tea_party_1783143198139.jpg',
        dest: 'public/images/den-amerikanske-revolusjonen/uavhengighetskrigen-01.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/signing_declaration_1783143210707.jpg',
        dest: 'public/images/den-amerikanske-revolusjonen/uavhengighetskrigen-02.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/surrender_yorktown_1783143224417.jpg',
        dest: 'public/images/den-amerikanske-revolusjonen/uavhengighetskrigen-03.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/unipolar_world_hero_1783143245840.jpg',
        dest: 'public/images/etterkrigstiden/den-unipolare-verden-hero.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/soviet_flag_lowered_1783143260001.jpg',
        dest: 'public/images/etterkrigstiden/den-unipolare-verden-01.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/container_ship_1783143275511.jpg',
        dest: 'public/images/etterkrigstiden/den-unipolare-verden-02.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/manhattan_september_11_1783143291772.jpg',
        dest: 'public/images/etterkrigstiden/den-unipolare-verden-03.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/new_world_order_hero_1783143313832.jpg',
        dest: 'public/images/etterkrigstiden/en-ny-verdensorden-hero.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/lehman_brothers_collapse_1783143330444.jpg',
        dest: 'public/images/etterkrigstiden/en-ny-verdensorden-01.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/seaport_terminal_1783143346807.jpg',
        dest: 'public/images/etterkrigstiden/en-ny-verdensorden-02.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/ships_meeting_sunset_1783143364375.jpg',
        dest: 'public/images/etterkrigstiden/en-ny-verdensorden-03.webp'
    },
    {
        src: '/home/irik/.gemini/antigravity-cli/brain/212bbd52-bbe9-463c-91cf-7bd949e9d9c6/russia_after_soviet_hero_1783143391950.jpg',
        dest: 'public/images/etterkrigstiden/russland-etter-sovjet-hero.webp'
    }
];

async function processImages() {
    for (const job of jobs) {
        if (!fs.existsSync(job.src)) {
            console.error(`Source file not found: ${job.src}`);
            continue;
        }
        fs.mkdirSync(path.dirname(job.dest), { recursive: true });
        await sharp(job.src)
            .resize(1600, null, { withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(job.dest);
        console.log(`Converted and saved: ${job.dest}`);
    }
}

processImages().catch(console.error);

