declare module 'base-64' {
  function encode(str: string): string;
  function decode(str: string): string;
  export { encode, decode };
}
