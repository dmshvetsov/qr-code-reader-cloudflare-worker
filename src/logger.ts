export function logger(service: string) {
  return {
    info(msg: string) {
      console.log(`[${service}] ` + msg);
    },
    warn(msg: string) {
      console.warn(`[${service}] ` + msg);
    },
    error(msg: string) {
      console.error(`[${service}] ` + msg);
    },
  };
}
