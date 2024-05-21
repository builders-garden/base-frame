import { createImagesWorker } from "frames.js/middleware/images-worker/next";
import path from "node:path";
import fs from "node:fs";

const regularFontData = fs.readFileSync(
  path.join(
    path.resolve(process.cwd(), "public", "fonts"),
    "Urbanist-Regular.ttf"
  )
);
const boldFontData = fs.readFileSync(
  path.join(path.resolve(process.cwd(), "public", "fonts"), "Urbanist-Bold.ttf")
);

const imagesWorker = createImagesWorker({
  imageOptions: {
    debug: false,
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
        data: regularFontData,
        name: "Urbanist-Regular",
      },
      {
        data: boldFontData,
        name: "Urbanist-Bold",
      },
    ],
  },
});

export const GET = imagesWorker();
