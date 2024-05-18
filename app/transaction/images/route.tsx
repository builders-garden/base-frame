import { createImagesWorker } from "frames.js/middleware/images-worker/next";

const imagesWorker = createImagesWorker({
  imageOptions: {
    debug: true,
  },
});

export const GET = imagesWorker();
