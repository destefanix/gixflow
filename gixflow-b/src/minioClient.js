const Minio = require("minio");
require("dotenv").config();

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  region: process.env.MINIO_REGION,
});
// console.log(process.env.MINIO_ACCESS_KEY, "|", process.env.MINIO_SECRET_KEY);
module.exports = minioClient;

minioClient.bucketExists("gix-flow", (err) => {
  if (err && err.code === "NoSuchBucket") {
    minioClient.makeBucket("gix-flow", "us-east-1", (err) => {
      if (err) {
        console.error("Errore durante la creazione del bucket:", err);
      } else {
        console.log('Bucket "gix-flow" creato con successo.');
      }
    });
  }
});

// Test connessione e debug
/*(async () => {
  try {
    const buckets = await minioClient.listBuckets();
    console.log("[DEBUG] Buckets trovati su MinIO:", buckets);
  } catch (error) {
    console.error("[DEBUG] Errore nella connessione a MinIO:", error);
  }
})(); */

module.exports = minioClient;
