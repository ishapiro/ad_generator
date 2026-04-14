import { fal } from "@fal-ai/client";
import 'dotenv/config';

const IMEJIS_API_KEY = process.env.IMEJIS_API_KEY;
const DESIGN_ID = process.env.IMEJIS_DESIGN_ID;

async function generateBacktickAd() {
    console.log("🚀 Starting generation for Backtick 'Idea to Company'...");

    try {
        // STEP 1: Generate the Hero Image using Fal.ai
        console.log("🎨 Generating Hero Scene in Fal.ai...");
        const falResult = await fal.subscribe("fal-ai/flux/pro/v1.1", {
          input: {
            prompt:
              "Professional tech-office setting. A focused founder sits at a minimalist " +
              "light-wood desk with a MacBook. Behind him is a large glass whiteboard with " +
              "the word 'IDEA' written in blue marker. High-key lighting, soft architectural " +
              "shadows, clean 8k photography, minimalist aesthetic. Plenty of negative space " +
              "on the left side of the frame.",
            aspect_ratio: "1200:628",
          },
        });

        const heroImageUrl = falResult.images[0].url;
        console.log("✅ Hero Image Created: ", heroImageUrl);

        // STEP 2: Send to Imejis.io for Composition
        console.log("🏗️  Assembling Final Ad in Imejis.io...");
        
        const response = await fetch(`https://api.imejis.io/v1/${DESIGN_ID}`, {
            method: 'POST',
            headers: {
                'X-API-KEY': IMEJIS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // These 'names' must match the layer names in your Imejis template
                hero_image: { image_url: heroImageUrl },
                headline: "From Idea to Company.",
                subheadline: "Playbooks to build. AI to move fast. A system to scale.",
                body_copy: "Learn how to go from prototype to funded company. Then build the playbooks that train your team.",
                cta_text: "Try Backtick Free"
            })
        });

        if (!response.ok) {
            throw new Error(`Imejis API Error: ${response.statusText}`);
        }

        const adData = await response.json();
        
        console.log("✨ AD COMPLETE!");
        console.log("🔗 Final Ad URL:", adData.url); // Imejis returns the URL in the 'url' field
        
    } catch (error) {
        console.error("❌ Error generating ad:", error);
    }
}

generateBacktickAd();