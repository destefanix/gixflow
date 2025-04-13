const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const path = require("path");
const mime = require("mime-types");

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: "https://storage.gixflow.cloud:9100", // ora è SSL!
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function generatePresignedUrl(bucket, key, expiresIn = 600) {
    const extension = path.extname(key);
    const contentType = mime.lookup(extension) || "application/octet-stream";
  
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: "inline",
      ResponseContentType: contentType,
    });
  
    return await getSignedUrl(s3Client, command, { expiresIn });
  }

module.exports = { generatePresignedUrl };



/* Questo approccio ti dà supporto automatico a:

Estensione	MIME Type	Supporto iframe
.pdf	application/pdf	✅ SI
.jpg	image/jpeg	✅ SI
.png	image/png	✅ SI
.tiff	image/tiff	⚠️ Dipende dal browser
.docx	application/vnd.openxml...	❌ No (download)
.xlsx	application/vnd.openxml...	❌ No (download)
🔥 Word / Excel non si possono vedere in iframe in modo nativo. 

Per quelli: puoi generare un presigned URL e aprire in nuova tab, o integrare un preview engine tipo OnlyOffice o Google Docs Viewer. */