import { Buffer } from "node:buffer";
import { HTTPException } from "hono/http-exception";
import { Str, Num, Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import qr from "jsqr";
import jpeg from "jpeg-js";
import png from "upng-js";
import { logger } from "logger";
import { CODE as errors } from "errors";

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
      "200": {
        description: "Returns content of a QR code from the URL",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: Bool(),
                qr: z.object({
                  data: Num(),
                }),
              }),
            }),
          },
        },
      },
      "400": {
        description: "Input error",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: z.literal(false),
                error: Num(),
              }),
            }),
          },
        },
      },
      "500": {
        description: "Server error",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: z.literal(false),
                error: Num(),
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
      return { success: false, error: errors.IMAGE_UNAVAILABLE };
    }

    try {
      const buf = await imageFetch.arrayBuffer();
      const img = await getImage(buf);
      if (!img) {
        log.warn("unsupported image format " + req.body.url);
        throw new HTTPException(400, {
          res: new Response(
            JSON.stringify({
              success: false,
              error: errors.UNSUPPORTED_IMAGE_FORMAT,
            }),
          ),
        });
      }

      const qrCodeParsed = qr(img.data, img.width, img.height);
      if (!qrCodeParsed) {
        log.warn("failed to parse " + req.body.url);
        return { success: false, error: errors.QR_PARSE_ERROR };
      }

      log.info("successfully read " + req.body.url);
      return {
        success: true,
        qr: { data: qrCodeParsed.data },
      };
    } catch (err) {
      log.error("successfully read " + req.body.url);
      throw new HTTPException(500, {
        res: new Response(
          JSON.stringify({ success: false, error: errors.EXCEPTION }),
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
