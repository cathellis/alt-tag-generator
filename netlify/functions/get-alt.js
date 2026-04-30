const axios = require("axios");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        const { imageUrl, keyword } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;
        
        // THE FIX: Pointing the URL to the active 2.5 Flash model instead of the deprecated 1.5
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        // 1. Fetch the image pixels
        const imageResp = await axios.get(imageUrl, { 
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const base64Data = Buffer.from(imageResp.data).toString('base64');
        const mimeType = imageResp.headers['content-type'] || 'image/jpeg';

        // 2. Build the manual request body
        const payload = {
            contents: [{
                parts: [
                    { text: `Provide a concise ALT text for this image (under 125 chars). ${keyword ? `Integrate the word "${keyword}" naturally.` : ""}` },
                    { inline_data: { mime_type: mimeType, data: base64Data } }
                ]
            }]
        };

        // 3. Talk to Google directly
        const aiResp = await axios.post(url, payload);
        
        // 4. Extract the text from Google's complex response
        const altText = aiResp.data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ alt_text: altText }),
        };
    } catch (error) {
        console.error("Manual API Error:", error.response ? error.response.data : error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API connection failed. Please check your API key and URL." }),
        };
    }
};
