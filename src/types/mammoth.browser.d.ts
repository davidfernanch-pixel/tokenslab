declare module "mammoth/mammoth.browser" {
  interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  interface MammothBrowser {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
  }
  const mammoth: MammothBrowser;
  export default mammoth;
}
