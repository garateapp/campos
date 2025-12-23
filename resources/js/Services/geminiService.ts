import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiChat = () => {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        systemInstruction: "You are GreenexCampos AI, a world-class agronomist and farm management assistant. Help users with crop health, pest control, financial planning, and irrigation management. Be concise, professional, and helpful.",
    });
    return model.startChat();
};

export const analyzeCropImage = async (base64Image: string, prompt: string) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent([
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: prompt || "Analyze this crop image for any signs of disease, nutrient deficiency, or pest infestation. Provide actionable recommendations." }
    ]);
    const response = await result.response;
    return response.text();
};

export const analyzeWorkVideo = async (videoUri: string, prompt: string) => {
    // Placeholder for video analysis logic
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(prompt || "Analyze this farm work footage for efficiency and compliance with safety standards.");
    const response = await result.response;
    return response.text();
};
