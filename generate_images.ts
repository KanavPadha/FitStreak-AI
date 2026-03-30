import { GoogleGenAI } from "@google/genai";
import fs from "fs";

async function generateExerciseImages() {
  const apiKey = "AIzaSyCeI_FYxiZwRcxbED_LkzBWCZFVvg0mRvE";
  const ai = new GoogleGenAI({ apiKey });
  
  const exercises = [
    { name: "Push-ups", prompts: [
      "A high-quality, realistic, professional fitness photograph of a person in a gym performing a standard push-up. Starting position: high plank, hands shoulder-width apart, back straight, core engaged. Cinematic lighting, sharp focus, 8k resolution.",
      "A high-quality, realistic, professional fitness photograph of a person in a gym at the bottom of a push-up. Chest nearly touching the floor, elbows at 45 degrees, maintaining a straight body line. Cinematic lighting, sharp focus, 8k resolution.",
      "A high-quality, realistic, professional fitness photograph of a person in a gym pushing back up from a push-up. Showing muscle definition in chest and triceps. Cinematic lighting, sharp focus, 8k resolution."
    ] },
    { name: "Squats", prompts: [
      "A high-quality, realistic, professional fitness photograph of a person in a gym standing ready for a bodyweight squat. Feet shoulder-width apart, neutral spine. Cinematic lighting, sharp focus, 8k resolution.",
      "A high-quality, realistic, professional fitness photograph of a person in a gym at the bottom of a deep squat. Thighs parallel to the floor, chest up, weight on heels. Cinematic lighting, sharp focus, 8k resolution.",
      "A high-quality, realistic, professional fitness photograph of a person in a gym rising from a squat. Showing muscle engagement in quads and glutes. Cinematic lighting, sharp focus, 8k resolution."
    ] },
    { name: "Plank", prompts: [
      "A high-quality, realistic, professional fitness photograph of a person in a gym holding a perfect forearm plank. Side view, straight line from head to heels, core tight. Cinematic lighting, sharp focus, 8k resolution.",
      "A high-quality, realistic, professional fitness photograph of a person in a gym holding a forearm plank. Front view, focus on form and stability. Cinematic lighting, sharp focus, 8k resolution."
    ] },
    { name: "Lunges", prompts: [
      "A high-quality, realistic, professional fitness photograph of a person in a gym standing ready for a forward lunge. Cinematic lighting, sharp focus, 8k resolution.",
      "A high-quality, realistic, professional fitness photograph of a person in a gym in a deep forward lunge. Both knees at 90 degrees, torso upright, balanced. Cinematic lighting, sharp focus, 8k resolution.",
      "A high-quality, realistic, professional fitness photograph of a person in a gym stepping back from a lunge. Showing balance and control. Cinematic lighting, sharp focus, 8k resolution."
    ] },
    { name: "Burpees", prompts: [
      "A high-quality, realistic, professional fitness photograph of a person in a gym in the squat phase of a burpee. Hands on floor, ready to kick back. Cinematic lighting, sharp focus, 8k resolution.",
      "A high-quality, realistic, professional fitness photograph of a person in a gym in the plank phase of a burpee. Straight body line. Cinematic lighting, sharp focus, 8k resolution.",
      "A high-quality, realistic, professional fitness photograph of a person in a gym jumping explosively at the end of a burpee. Arms reaching up, feet off the ground. Cinematic lighting, sharp focus, 8k resolution."
    ] },
    { name: "Mountain Climbers", prompts: [
      "A high-quality, realistic, professional fitness photograph of a person in a gym in a high plank position, driving one knee towards the chest for mountain climbers. Cinematic lighting, sharp focus, 8k resolution.",
      "A high-quality, realistic, professional fitness photograph of a person in a gym switching legs rapidly during mountain climbers. Dynamic movement, focus on core stability. Cinematic lighting, sharp focus, 8k resolution."
    ] }
  ];

  const results: any = {};

  for (const ex of exercises) {
    results[ex.name] = [];
    for (const prompt of ex.prompts) {
      console.log(`Generating for ${ex.name}: ${prompt}`);
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
              imageSize: "1K"
            }
          }
        });
        
        if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              results[ex.name].push(`data:image/png;base64,${part.inlineData.data}`);
            }
          }
        }
        
        // Wait 5 seconds between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (e) {
        console.error(`Error generating ${ex.name}:`, e);
      }
    }
  }

  const fileContent = `export const exerciseImages: Record<string, string[]> = ${JSON.stringify(results, null, 2)};`;
  fs.writeFileSync("src/data/exerciseImages.ts", fileContent);
  console.log("GENERATION_COMPLETE");
}

generateExerciseImages();
