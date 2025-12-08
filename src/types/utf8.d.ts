declare module 'utf8' {
  function encode(str: string): string;
  function decode(str: string): string;
  export { encode, decode };
}
