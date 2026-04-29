const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { imageUrl, keyword } = JSON.parse(event.body);
        
        // Initialize the AI with your secret key
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Use the explicit version of the model to avoid the 404 error
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `Describe this image for ALT text in under 125 characters. 
        Focus on being objective and concise. 
        ${keyword ? `Include the keyword "${keyword}" naturally.` : ""} 
        Image URL: ${imageUrl}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ alt_text: text }),
        };
    } catch (error) {
        console.error("Detailed Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "The AI had trouble reading that image URL. Try a different image link!" }),
        };
    }
};
