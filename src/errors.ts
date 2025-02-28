import { IMAGE_MAX_FILE_SIZE } from "config";

export const CODE = {
  EXCEPTION: 0,
  IMAGE_UNAVAILABLE: 1001,
  IMAGE_UNSUPPORTED_FORMAT: 1002,
  IMAGE_EXCEEDS_SIZE_LIMIT: 1003,
  QR_PARSE_ERROR: 2001,
};

export const DESCRIPTION = {
  0: "something went wrong",
  1001: "unable to download an file from given URL",
  1002: "unsupported image format or not an image",
  1003: `image size exceeds the limit of ${IMAGE_MAX_FILE_SIZE} bytes`,
  2001: "failed to read QR code, most likely given URL is not a QR code",
};
