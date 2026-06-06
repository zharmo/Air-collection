const crypto = require("crypto");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1";

const signUpload = (params, apiSecret) => {
    const payload = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&");

    return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
};

const uploadImageToCloudinary = async (file, folder = process.env.CLOUDINARY_FOLDER || "air-collection/products") => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Cloudinary credentials are missing. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env.");
    }

    if (!file?.buffer) {
        throw new Error("No image file was provided.");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signedParams = { folder, timestamp };
    const signature = signUpload(signedParams, apiSecret);

    const formData = new FormData();
    formData.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    formData.append("api_key", apiKey);
    formData.append("folder", folder);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);

    const response = await fetch(`${CLOUDINARY_UPLOAD_URL}/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result?.error?.message || "Cloudinary upload failed.");
    }

    return {
        secureUrl: result.secure_url,
        publicId: result.public_id,
    };
};

module.exports = { uploadImageToCloudinary };
