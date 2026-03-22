declare module 'edge-tts-universal' {
    export class Communicate {
        constructor(text: string, options: any);
        stream(): AsyncIterable<{ type: string; data?: any; text?: string; duration?: number; audioOffset?: number }>;
    }
    export class VoicesManager {
        static create(): Promise<VoicesManager>;
        voices: any[];
    }
}
