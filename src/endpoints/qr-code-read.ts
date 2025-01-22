import { Str, Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";

const readFromUrl = z.object({
  url: Str(),
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
                content: Str(),
              }),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    // Get validated data
    const data = await this.getValidatedData<typeof this.schema>();

    // Retrieve the validated request body
    const taskToCreate = data.body;

    // return the new task
    return {
      success: true,
      content: "TODO",
    };
  }
}
