import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function identifyWaste(base64Image: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Identify the category of construction or general waste in this image. Choose from: Concrete, Metal, Wood, Plastic, Hazardous, Electronic, Organic, or Other. Just return the category name." },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(',')[1] || base64Image
              }
            }
          ]
        }
      ]
    });
    return response.text?.trim() || "Other";
  } catch (error) {
    console.error("Error identifying waste:", error);
    return "Other";
  }
}
