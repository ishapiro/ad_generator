import { fal } from "@fal-ai/client";
import 'dotenv/config';
import { writeFileSync } from 'fs';

fal.config({ credentials: process.env.FAL_KEY });

const IMEJIS_API_KEY = process.env.IMEJIS_API_KEY;
const DESIGN_ID = process.env.IMEJIS_DESIGN_ID;

// ─── Ad design configuration ──────────────────────────────────────────────────
// Natural language color description used across all generated assets.
// Both ad_background and bullet_list use this so their colors match each other.
// Future UI: make this a user input.
const AD_BACKGROUND_DESCRIPTION = "dark navy";
const test_background = 'white';

// ─── Bullet list configuration ────────────────────────────────────────────────
// Each step becomes a row in the generated bullet_list image (300x530).
// Future UI: replace this array with user input.
const BULLET_STEPS = [
    { icon: "lightbulb",        label: "Idea"      },
    { icon: "graduation cap",   label: "Learn"     },
    { icon: "stacked layers",   label: "Build"     },
    { icon: "monitor screen",   label: "Prototype" },
    { icon: "group of people",  label: "Hire"      },
    { icon: "bar chart",        label: "Scale"     },
];
// ─────────────────────────────────────────────────────────────────────────────

async function generateAdBackground() {
    console.log("🎨 Generating Ad Background in Fal.ai...");

    const falResult = await fal.subscribe("fal-ai/flux-2-pro", {
        input: {
            prompt:
                `Solid flat ${test_background} background. ` +
                "Completely uniform color, no texture, no noise, no gradient, no pattern, no objects. " +
                "Pure flat color filling the entire canvas edge to edge.",
            image_size: "square_hd",
        },
    });

    const url = falResult.data.images[0].url;
    console.log("✅ Ad Background Created:", url);
    return url;
}

async function generateBulletList(steps) {
    console.log("📋 Generating Bullet List in Fal.ai...");

    const stepDescriptions = steps
        .map((s, i) => `${i + 1}. ${s.icon} icon beside the word "${s.label}"`)
        .join(", ");

    const falResult = await fal.subscribe("fal-ai/flux-2-pro", {
        input: {
            prompt: `
                Clean minimal flat UI graphic on a solid ${AD_BACKGROUND_DESCRIPTION} background.
                No texture, no gradient, no pattern, no noise.

                Compose a vertical startup journey timeline that fills the entire canvas edge to edge.
                Zero padding and zero outer margins.
                Icons and labels should visually reach all four edges of the image area.

                Place a glowing blue vertical line on the center-left with small filled blue circles at each node.
                At each node, place a small flat blue icon on the left and a bold white label on the right.
                Keep icon and label alignment clean and consistent.

                Steps from top to bottom: ${stepDescriptions}.
                First item flush to the top edge, last item flush to the bottom edge.
                Distribute items evenly to fill the full height.

                Flat design, crisp edges, no photography, no border, no frame, no whitespace margins.
            `.replace(/\s+/g, " ").trim(),
            image_size: { width: 300, height: 530 },
        },
    });

    const url = falResult.data.images[0].url;
    console.log("✅ Bullet List Created:", url);
    return url;
}

async function generateBacktickAd() {
    console.log("🚀 Starting generation for Backtick 'Idea to Company'...");

    try {
        // STEP 1: Generate all fal.ai images in parallel
        console.log("🎨 Generating images in Fal.ai...");
        const [falHeroResult, adBackgroundUrl, bulletListUrl] = await Promise.all([
            fal.subscribe("fal-ai/flux-2-pro", {
                input: {
                    prompt:
                        "Professional tech-office setting. A focused founder sits at a minimalist " +
                        "light-wood desk with a MacBook. Behind him is a large glass whiteboard with " +
                        "the word 'IDEA' written in blue marker. High-key lighting, soft architectural " +
                        "shadows, clean 8k photography, minimalist aesthetic. Plenty of negative space " +
                        "on the left side of the frame.",
                    image_size: "square_hd",
                },
            }),
            generateAdBackground(),
            generateBulletList(BULLET_STEPS),
        ]);

        const heroImageUrl = falHeroResult.data.images[0].url;
        console.log("✅ Hero Image Created:", heroImageUrl);

        // STEP 2: Send to Imejis.io for composition
        console.log("🏗️  Assembling Final Ad in Imejis.io...");

        const response = await fetch(`https://render.imejis.io/v1/${DESIGN_ID}`, {
            method: 'POST',
            headers: {
                'dma-api-key': IMEJIS_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ad_background: {
                    image: adBackgroundUrl,
                    opacity: 1,
                    borderColor: "transparent",
                    backgroundColor: "transparent",
                    padding: "0",
                },
                hero_image: {
                    image: heroImageUrl,
                    opacity: 1,
                    borderColor: "transparent",
                    backgroundColor: "transparent",
                    padding: "0",
                },
                bullet_list: {
                    image: bulletListUrl,
                    opacity: 1,
                    borderColor: "transparent",
                    backgroundColor: "transparent",
                    padding: "0",
                },
                headline:    "From Idea to Company.",
                subheadline: "Playbooks to build. AI to move fast. A system to scale.",
                body_copy:   "Learn how to go from idea to prototype to funded company. Then build the playbooks that train every person who joins you.",
                cta_text:    "Try Backtick Free",
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Imejis API Error: ${response.status} ${response.statusText} — ${errBody}`);
        }

        const imageBuffer = await response.arrayBuffer();
        const outputPath = './backtick-ad.jpg';
        writeFileSync(outputPath, Buffer.from(imageBuffer));

        console.log("✨ AD COMPLETE!");
        console.log("💾 Saved to:", outputPath);

    } catch (error) {
        console.error("❌ Error generating ad:", error);
    }
}

generateBacktickAd();
