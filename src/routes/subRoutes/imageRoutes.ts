import express from "express";
import multer from "multer";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const router = express.Router();

const BUCKET = "images";
const FOLDER = "documentmaster";

// ---------------- Synology C2 S3 Client ----------------
const s3 = new S3Client({
    region: "us-east-1",  // Synology requires ANY region (use us-east-1)
    endpoint: "https://in-maa-1.linodeobjects.com",
    forcePathStyle: true,
    credentials: {
        accessKeyId: "3EPN6WAZACV03T68TS93",
        secretAccessKey: "MqUqwGdyaAlKx3exvduuOyTZEQlc7TboSb7SVPhr",
    }
});

// ---------------- Multer Storage ----------------
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// ----------------------------------------------------
// Upload Image to Synology C2 Bucket
// ----------------------------------------------------
router.post("/api/upload-dm-image", (req: any, res) => {
    upload.single("image")(req, res, async (err: any) => {
        try {
            if (err?.code === "LIMIT_FILE_SIZE") {
                return res.status(400).send({
                    status: false,
                    message: "Image size should not exceed 10 MB"
                });
            }

            if (!req.file) {
                return res.status(400).send({
                    status: false,
                    message: "No file uploaded"
                });
            }

            const file = req.file;
            const fileKey =
                `${FOLDER}/IMG-${Date.now()}-${crypto.randomUUID()}-${file.originalname}`;

            await s3.send(
                new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: fileKey,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                })
            );

            // Public URL format for Synology C2
            const fileUrl = `https://${BUCKET}.in-maa-1.linodeobjects.com/${fileKey}`;

            res.send({
                status: true,
                message: "Uploaded successfully",
                url: fileUrl,
                key: fileKey
            });

        } catch (error) {
            console.error("Upload Error:", error);
            res.status(500).send({ status: false, message: "Upload failed" });
        }
    });
});

router.post("/api/upload-bom-image-or-file", (req: any, res) => {
    const BOMFOLDER = 'BOM'
    upload.single("image")(req, res, async (err: any) => {
        try {
            if (err?.code === "LIMIT_FILE_SIZE") {
                return res.status(400).send({
                    status: false,
                    message: "Image size should not exceed 10 MB"
                });
            }

            if (!req.file) {
                return res.status(400).send({
                    status: false,
                    message: "No file uploaded"
                });
            }

            const file = req.file;
            const fileKey =
                `${BOMFOLDER}/IMG-${Date.now()}-${crypto.randomUUID()}-${file.originalname}`;

            await s3.send(
                new PutObjectCommand({
                    Bucket: BUCKET,
                    Key: fileKey,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                })
            );

            // Public URL format for Synology C2
            const fileUrl = `https://${BUCKET}.in-maa-1.linodeobjects.com/${fileKey}`;

            res.send({
                status: true,
                message: "Uploaded successfully",
                url: fileUrl,
                key: fileKey
            });

        } catch (error) {
            console.error("Upload Error:", error);
            res.status(500).send({ status: false, message: "Upload failed" });
        }
    });
});

// ----------------------------------------------------
// Get Signed URL for Image (10 minutes)
// ----------------------------------------------------
router.get("/api/get-image", async (req, res) => {
    try {
        const { key } = req.query;

        if (!key) {
            return res.status(400).send({
                status: false,
                message: "Image key required"
            });
        }

        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: key as string,
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 600 });

        res.send({ status: true, url: signedUrl });

    } catch (err) {
        console.error(err);
        res.status(500).send({
            status: false,
            message: "Unable to generate signed URL"
        });
    }
});

export default router;