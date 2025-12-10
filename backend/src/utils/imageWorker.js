import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadImageInWorker = (file, folder) => {
  return new Promise((resolve, reject) => {
    const workerPath = path.join(__dirname, "../workers/imageUploadProcessor.js");

    const worker = new Worker(workerPath, {
      workerData: {
        buffer: file.buffer,
        originalname: file.originalname,
        folder,
      }
    });

    worker.on("message", (msg) => {
      if (msg.success) resolve(msg.result);
      else reject(new Error(msg.error));
    });

    worker.on("error", reject);

    worker.on("exit", (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
    });
  });
};
