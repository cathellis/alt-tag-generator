const axios = require("axios");

exports.handler = async (event) => {
    try {
        const { imageUrl, keyword } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        // 1. Get the image
        const imageResp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const base64Data = Buffer.from(imageResp.data).toString('base64');

        // 2. Build the payload manually
        const data = {
            contents: [{
                parts: [
                    { text: `Describe this image for ALT text in under 125 characters. ${keyword ? `Include: ${keyword}` : ""}` },
                    { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                ]
            }]
        };

        // 3. Post to Google
        const aiResp = await axios.post(url, data);
        const altText = aiResp.data.candidates[0].content.parts[0].text;

        return { statusCode: 200, body: JSON.stringify({ alt_text: altText }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
