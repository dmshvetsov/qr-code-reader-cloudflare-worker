export function logger(service: string) {
  return {
    info(msg: string) {
      console.log(`[${service}] ` + msg);
    },
  };
}
