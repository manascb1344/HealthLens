require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} = require("@google/generative-ai");

const app = express();
const port = 3001;
app.use(cors({ origin: "http://localhost:5173" }));

const upload = multer({ dest: "uploads/" });

const MODEL_NAME = "gemini-pro-vision";
const API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generationConfig = {
	temperature: 0.1,
	topK: 32,
	topP: 1,
	maxOutputTokens: 4096,
};

const safetySettings = [
	{
		category: HarmCategory.HARM_CATEGORY_HARASSMENT,
		threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
		threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
		threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
		threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
	},
];

app.post(
	"/api/generate-content",
	upload.single("image"),
	async (req, res) => {
		try {
			if (!req.file) {
				return res.status(400).json({ error: "No file uploaded" });
			}

			const imagePath = req.file.path;

			if (!fs.existsSync(imagePath)) {
				return res
					.status(404)
					.json({ error: "Uploaded file not found" });
			}

			const parts = [
				{
					text: "You are an AI specialized in medical image analysis, specifically tasked with diagnosing diseases based on images of various body parts. Your response should be structured to provide comprehensive information to the user, starting with the rationale behind the diagnosis and followed by detailed information about the disease, including symptoms, treatments, causes, and diagnosis methods.\n\n1. Rationale for Diagnosis:\n   - Provide a brief explanation of why the model believes the detected disease is present in the provided image, based on identified features or patterns.\n\n2. Symptoms:\n   - List common symptoms associated with the diagnosed disease, relevant to the body part depicted in the image.\n\n3. Treatments:\n   - Outline various treatment options available for managing the diagnosed disease, including medical interventions and lifestyle changes.\n\n4. Diagnosis Methods:\n   - Describe the methods or tests commonly used to confirm the presence of the disease, such as diagnostic imaging or laboratory tests.\n\n5. Causes:\n   - Explain potential causes or risk factors associated with the development of the diagnosed disease, providing insights into contributing factors.\n\nYour response should be structured in a clear and organized manner, providing valuable insights to the user and facilitating their understanding of the diagnosed disease and its management. Ensure that each section is informative and relevant to the user's query.",
				},
				{
					inlineData: {
						mimeType: "image/jpeg",
						data: Buffer.from(fs.readFileSync(imagePath)).toString(
							"base64"
						),
					},
				},
			];

			const result = await model.generateContent({
				contents: [{ role: "user", parts }],
				generationConfig,
				safetySettings,
			});

			const generatedContent = result.response.text();

			fs.unlinkSync(imagePath);

			return res.status(200).json({ generatedContent });
		} catch (error) {
			console.error("Error generating content:", error);
			return res
				.status(500)
				.json({ error: "Internal server error" });
		}
	}
);

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
