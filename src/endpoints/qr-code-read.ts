import { Buffer } from "node:buffer";
import { Str, Num, Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import qr from "jsqr";
import jpeg from "jpeg-js";
import png from "upng-js";
import { logger } from "logger";
import { CODE as errors } from "errors";
import { Env, IMAGE_MAX_FILE_SIZE } from "config";
import { Context } from "hono";

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
        description: "Returns content of the QR code from the URL",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              qr: z.object({
                data: Num(),
              }),
            }),
          },
        },
      },
      "401": {
        description: "Unauthorized",
      },
      "400": {
        description: "Input error",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(false),
              error: Num(),
            }),
          },
        },
      },
      "500": {
        description: "Server error",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(false),
              error: Num(),
            }),
          },
        },
      },
    },
  };

  async handle(ctx: Context) {
    // Get validated data
    const req = await this.getValidatedData<typeof this.schema>();

    const log = logger("qr-code-reader");
    log.info("request " + req.body.url);

    const imageFetch = await fetch(req.body.url);
    log.info(
      "fetch " + req.body.url + " request response " + imageFetch.status,
    );
    if (!imageFetch.ok) {
      return { success: false, error: errors.IMAGE_UNAVAILABLE };
    }

    const contentLength = parseInt(
      imageFetch.headers.get("Content-Length"),
      10,
    );
    if (contentLength > IMAGE_MAX_FILE_SIZE) {
      log.warn(
        `image size ${contentLength} exceeds limit ${IMAGE_MAX_FILE_SIZE} ${req.body.url}`,
      );
      ctx.status(400);
      return ctx.json({
        success: false,
        error: errors.IMAGE_EXCEEDS_SIZE_LIMIT,
      });
    }

    try {
      log.info("fetch img body " + contentLength + " bytes " + req.body.url);
      const buf = await imageFetch.arrayBuffer();
      const img = await getImage(buf);
      if (!img) {
        log.warn("unsupported image format " + req.body.url);
        ctx.status(400);
        return ctx.json({
          success: false,
          error: errors.IMAGE_UNSUPPORTED_FORMAT,
        });
      }

      const qrCodeParsed = qr(img.data, img.width, img.height);
      if (!qrCodeParsed) {
        log.warn("failed to parse " + req.body.url);
        ctx.status(400);
        return ctx.json({ success: false, error: errors.QR_PARSE_ERROR });
      }

      log.info("successfully read " + req.body.url);
      return {
        success: true,
        qr: { data: qrCodeParsed.data },
      };
    } catch (err) {
      log.error(`server error: ${err.message} ${req.body.url}`);
      ctx.status(500);
      return ctx.json({
        success: false,
        error: errors.EXCEPTION,
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
