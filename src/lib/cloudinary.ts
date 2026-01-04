import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET,
});

export const uploadImage = async (file: File, folder = "profiles"): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error || !result) {
                    reject(error || new Error("Failed to upload image"));
                    return;
                }
                resolve(result.secure_url);
            }
        );

        uploadStream.end(buffer);
    });
};

export default cloudinary;