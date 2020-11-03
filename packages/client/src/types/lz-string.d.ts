declare module 'lz-string/libs/lz-string.min.js' {
  const LZString: {
    compressToBase64(input: string): string;
    decompressFromBase64(input: string): string;

    compressToUTF16(input: string): string;
    decompressFromUTF16(compressed: string): string;

    compressToUint8Array(uncompressed: string): Uint8Array;
    decompressFromUint8Array(compressed: Uint8Array): string;

    compressToEncodedURIComponent(input: string): string;
    decompressFromEncodedURIComponent(compressed: string): string;

    compress(input: string): string;
    decompress(compressed: string): string;
  };
  export default LZString;
}
