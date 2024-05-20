import { createImagesWorker } from "frames.js/middleware/images-worker/next";
import path from "node:path";
import fs from "node:fs";

const boldFontData = fs.readFileSync(
  path.join(path.resolve(process.cwd(), "public", "fonts"), "Urbanist-Bold.ttf")
);

const imagesWorker = createImagesWorker({
  imageOptions: {
    debug: true,
    sizes: {
      "1.91:1": {
        width: 955,
        height: 500,
      },
      "1:1": {
        width: 1200,
        height: 1200,
      },
    },
    fonts: [
      {
        data: boldFontData,
        name: "Urbanist-Bold",
      },
    ],
  },
});

export const GET = imagesWorker();
