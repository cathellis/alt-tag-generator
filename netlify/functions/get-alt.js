const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { imageUrl, keyword } = JSON.parse(event.body);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // FIX: Using the explicit model version string
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // 1. Fetch image with a User-Agent to bypass security
        const imageResp = await axios.get(imageUrl, { 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const imageData = Buffer.from(imageResp.data).toString('base64');

        // 2. Prepare the payload
        const imagePart = {
            inlineData: {
                data: imageData,
                mimeType: imageResp.headers['content-type'] || 'image/jpeg'
            }
        };

        const prompt = `Provide a concise, objective ALT text for this image (under 125 characters). ${keyword ? `Integrate the keyword "${keyword}" naturally.` : ""} Do not start with "Image of" or "Photo of".`;

        // 3. Generate content
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ alt_text: text }),
        };
    } catch (error) {
        console.error("Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "The AI is having trouble accessing that model or image. Please try again in a moment." }),
        };
    }
};
