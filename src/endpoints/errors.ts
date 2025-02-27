import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import * as err from "errors";

export class Errors extends OpenAPIRoute {
  schema = {
    tags: ["Documentation"],
    summary: "list of API errors codes and descriptions",
    request: {},
    responses: {
      "200": {
        description: "list of API errors codes and descriptions",
        content: {
          "application/json": {
            schema: z.record(z.string()),
          },
        },
      },
    },
  };

  async handle() {
    const payload = {};
    for (const errKey in err.CODE) {
      const errCode = err.CODE[errKey];
      payload[errCode] = err.DESCRIPTION[errCode] ?? errKey;
    }

    return payload;
  }
}
