import { Buffer } from "node:buffer";
import { HTTPException } from "hono/http-exception";
import { Str, Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import qr from "jsqr";
import jpeg from "jpeg-js";
import png from "upng-js";
import { logger } from "logger";
import { CODE as err } from "errors";

const readFromUrl = z.object({
  url: Str().url(),
});

export class UrlQrCodeRead extends OpenAPIRoute {
  schema = {
    tags: ["QR Code"],
    summary: "Read QR Code from an URL",
    request: {
      body: {
        content: {
          "application/json": {
            schema: readFromUrl,
          },
        },
      },
    },
    responses: {
      "400": {
        description: "Returns content of a QR code from the URL",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: z.literal(false),
                error: Str(),
              }),
            }),
          },
        },
      },
      "200": {
        description: "Returns content of a QR code from the URL",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: Bool(),
                qr: z.object({
                  data: Str(),
                }),
              }),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    // Get validated data
    const req = await this.getValidatedData<typeof this.schema>();

    const log = logger("read QR code");
    log.info("[read QR code] request " + req.body.url);

    const imageFetch = await fetch(req.body.url);
    log.info(
      "fetch " + req.body.url + " request response " + imageFetch.status,
    );
    if (!imageFetch.ok) {
      return { success: false, error: err.IMAGE_UNAVAILABLE };
    }

    try {
      const buf = await imageFetch.arrayBuffer();
      const img = await getImage(buf);
      if (!img) {
        throw new HTTPException(400, {
          res: new Response(
            JSON.stringify({
              success: false,
              error: err.UNSUPPORTED_IMAGE_FORMAT,
            }),
          ),
        });
      }

      const qrCodeParsed = qr(img.data, img.width, img.height);

      return {
        success: true,
        qr: { data: qrCodeParsed.data },
      };
    } catch (err) {
      throw new HTTPException(400, {
        res: new Response(
          JSON.stringify({ success: false, error: err.message }),
        ),
      });
    }
  }
}

type ImgParsed = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

async function getImage(buf: ArrayBuffer): Promise<ImgParsed | null> {
  const fileFormatSlice = Buffer.from(buf.slice(0, 3)).toString("hex");
  if (fileFormatSlice === "ffd8ff") {
    // jpeg
    const img = jpeg.decode(buf);
    console.log("jped", img);
    return {
      data: new Uint8ClampedArray(img.data),
      width: img.width,
      height: img.height,
    };
  }
  if (fileFormatSlice === "89504e") {
    // png
    const img = png.decode(buf);
    return {
      data: new Uint8ClampedArray(png.toRGBA8(img)[0]),
      width: img.width,
      height: img.height,
    };
  }
  // unsupported image format
  return null;
}
