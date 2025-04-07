import { GoogleGenerativeAI } from"@google/generative-ai";
import fs from'fs';
import { Image } from'image-js'; // or another image processing library like sharp
import exec   from 'child_process';

async function generateImageAndText() {
    const apikey ="AIzaSyBU4ghWSaoi3qMC7lDzmXXtTF-E2CAnSXE"
  const genAI = new GoogleGenerativeAI(apikey); // Ensure GOOGLE_API_KEY is set in your environment variables
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = "Hi, can you create a 3d rendered image of a pig with wings and a top hat flying over a happy futuristic scifi city with lots of greenery?";

  const result = await model.generateContent({
    contents: prompt,
    generationConfig: {
      responseMimeTypes: ["image/png", "text/plain"],
    },
  });
  
  const response = await result.response;

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData && part.inlineData.mimeType === "image/png") {
      const imageData = Buffer.from(part.inlineData.data, 'base64');
      // Save the image to a file (or process it in memory)
      const timestamp = Date.now();
      const filename = `generated_image_${timestamp}.png`;
      fs.writeFileSync(filename, imageData);
      console.log(`Image saved to ${filename}`);

      // Optional: Display the image using an image viewer. (Requires a system viewer)
      // This part is platform dependent, and may not work in all environments.
      // Example using 'open' on macOS or 'xdg-open' on Linux:

      if (process.platform === 'darwin') {
        exec(`open ${filename}`);
      } else if (process.platform === 'linux') {
          exec(`xdg-open ${filename}`);
      } else {
          console.log("Image saved. Manual opening might be needed.")
      }
      // Or, using image-js (in memory processing):

      // const image = await Image.load(imageData);
      // image.show(); // Display the image (requires a display environment)
    }
  }
}

generateImageAndText().catch(error => {
  console.error("Error:", error);
});