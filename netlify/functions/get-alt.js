const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { imageUrl, keyword } = JSON.parse(event.body);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 1. Fetch the image as raw data (this bypasses most blocks)
        const imageResp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageData = Buffer.from(imageResp.data).toString('base64');

        // 2. Prepare the payload for Gemini
        const imagePart = {
            inlineData: {
                data: imageData,
                mimeType: imageResp.headers['content-type'] || 'image/jpeg'
            }
        };

        const prompt = `Provide a concise, objective ALT text for this image (under 125 characters). ${keyword ? `Integrate the keyword "${keyword}" naturally.` : ""} Do not start with "Image of".`;

        // 3. Send raw image data + prompt to AI
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;

        return {
            statusCode: 200,
            body: JSON.stringify({ alt_text: response.text() }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "The AI couldn't access this specific image. It might be blocked by the host." }),
        };
    }
};
