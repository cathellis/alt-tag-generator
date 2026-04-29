const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { imageUrl, keyword } = JSON.parse(event.body);
        
        // Initialize with your key
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // TRY THIS: Use "gemini-1.5-flash" but ensure we are calling the vision-capable method
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            apiVersion: 'v1' // Force the stable V1 API instead of beta
        });

        // 1. Fetch image with a User-Agent to bypass security blocks
        const imageResp = await axios.get(imageUrl, { 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const imageData = Buffer.from(imageResp.data).toString('base64');
        const mimeType = imageResp.headers['content-type'] || 'image/jpeg';

        // 2. Format specifically for the Vision prompt
        const prompt = `Describe this image for a screen reader. Keep it under 125 characters. ${keyword ? `Include the word "${keyword}" if relevant.` : ""}`;
        
        const imagePart = {
            inlineData: {
                data: imageData,
                mimeType: mimeType
            }
        };

        // 3. Send to AI
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ alt_text: text }),
        };
    } catch (error) {
        console.error("Critical Error:", error.message);
        
        // Fallback message that actually helps the user
        let friendlyError = "The AI is currently struggling with this image link.";
        if (error.message.includes("404")) friendlyError = "API Connection Error (404). Trying to reconnect...";
        
        return {
            statusCode: 500,
            body: JSON.stringify({ error: friendlyError, details: error.message }),
        };
    }
};
