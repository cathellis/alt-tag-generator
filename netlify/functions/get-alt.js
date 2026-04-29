const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { imageUrl, keyword } = JSON.parse(event.body);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Using the 1.5 Flash model for speed and free tier access
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Act as an accessibility expert. Provide a concise ALT text (under 125 characters) for the image at this URL: ${imageUrl}. 
        ${keyword ? `Naturally include the keyword "${keyword}" if it fits the context.` : "Describe the image objectively."} 
        Do not include "Image of" or "Photo of".`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ alt_text: text }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to generate ALT text. Check if the URL is a direct image link." }),
        };
    }
};
