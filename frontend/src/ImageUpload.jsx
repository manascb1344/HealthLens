import React, { useState } from "react";
import axios from "axios";
import { BeatLoader } from "react-spinners";
import ReactMarkdown from "react-markdown";

function ImageUpload() {
	const [imageFile, setImageFile] = useState(null);
	const [generatedContent, setGeneratedContent] = useState("");
	const [loading, setLoading] = useState(false);

	const handleFileUpload = (event) => {
		const file = event.target.files[0];
		setImageFile(file);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (!imageFile) {
			alert("Please select an image.");
			return;
		}

		setLoading(true);

		const formData = new FormData();
		formData.append("image", imageFile);

		try {
			const response = await axios.post(
				"http://localhost:3001/api/generate-content",
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
					},
				}
			);

			setGeneratedContent(response.data.generatedContent);
			console.log(response.data.generatedContent);
		} catch (error) {
			console.error("Error generating content:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<h1>HealthLens</h1>
			<form onSubmit={handleSubmit}>
				<input
					type="file"
					accept="image/*"
					onChange={handleFileUpload}
				/>
				<button type="submit" disabled={loading}>
					Generate Content
				</button>
			</form>
			<div style={{ textAlign: "center", marginTop: "20px" }}>
				<BeatLoader color={"#36D7B7"} loading={loading} size={15} />
			</div>
			{generatedContent && (
				<div>
					<h2>Results:</h2>
					<div
						className="markdown-container"
						style={{ textAlign: "left" }}
					>
						<ReactMarkdown>{generatedContent}</ReactMarkdown>
					</div>
				</div>
			)}
			{imageFile && (
				<div>
					<h2>Uploaded Image:</h2>
					<img
						src={URL.createObjectURL(imageFile)}
						alt="Uploaded"
						style={{ maxWidth: "100%", maxHeight: "400px" }}
					/>
				</div>
			)}
		</div>
	);
}

export default ImageUpload;
