declare module 'node-key-sender' {
  export class KeySender {
    constructor();
    sendKeys(keys: string[]): Promise<void>;
    sendKey(key: string): Promise<void>;
    sendCombination(keys: string[]): Promise<void>;
  }
}