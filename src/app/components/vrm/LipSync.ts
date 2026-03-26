import { VRM } from '@pixiv/three-vrm';
// @ts-ignore
import { createWLipSyncNode } from 'https://cdn.jsdelivr.net/npm/wlipsync/dist/wlipsync-single.js';

/**
 * LipSyncManager: Handles professional, AI-driven mouth movement using wLipSync.
 * Analyzes audio frequencies to extract precise vowel weights (A, I, U, E, O).
 */
export class LipSyncManager {
    private vrm: VRM;
    private audioContext: AudioContext | null = null;
    private lipsyncNode: any = null;
    private isTalking: boolean = false;
    private weights: { A: number; I: number; U: number; E: number; O: number } = { A: 0, I: 0, U: 0, E: 0, O: 0 };

    constructor(vrm: VRM) {
        this.vrm = vrm;
    }

    public async connectAudio(_audioElement: HTMLAudioElement) {
        this.audioContext = (window as any)._audioCtx || this.audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();

        if (this.audioContext && !this.lipsyncNode) {
            try {
                const profile = await fetch('/profile.json').then(res => res.json());
                this.lipsyncNode = await createWLipSyncNode(this.audioContext, profile);
                
                // Connect global analyser to this node to prevent duplicate MediaElement source errors
                if ((window as any)._audioAnalyser) {
                    (window as any)._audioAnalyser.connect(this.lipsyncNode);
                }
            } catch (e) {
                console.error("🚨 wLipSync Implementation Error:", e);
                return;
            }
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    public startTalking() {
        this.isTalking = true;
    }

    public stopTalking() {
        this.isTalking = false;
        this.resetMouth();
    }

    private resetMouth() {
        if (!this.vrm.expressionManager) return;
        const vowels = ['aa', 'ih', 'ou', 'ee', 'oh', 'A', 'I', 'U', 'E', 'O'];
        vowels.forEach(v => {
            try { this.vrm.expressionManager!.setValue(v as any, 0); } catch (e) { }
        });
    }

    public update(_deltaTime: number) {
        if (!this.vrm.expressionManager || !this.lipsyncNode) return;

        const w = this.lipsyncNode.weights;
        if (!w) {
            if (this.isTalking) {
                const s = Math.abs(Math.sin(Date.now() * 0.015));
                this.weights.A = s * 0.35; // Amplified fallback (Reduced for naturalness)
            } else { this.weights.A = 0; }
            this.vrm.expressionManager.setValue('aa', this.weights.A);
            return;
        }

        // Professional manifest lerp (Reactive Smoothing)
        const s = 0.65;
        const multiplier = 0.75; // Reduced amplification for natural look
        this.weights.A += (w.A * multiplier - this.weights.A) * s;
        this.weights.I += (w.I * multiplier - this.weights.I) * s;
        this.weights.U += (w.U * multiplier - this.weights.U) * s;
        this.weights.E += (w.E * multiplier - this.weights.E) * s;
        this.weights.O += (w.O * multiplier - this.weights.O) * s;

        // Apply weights for lifelike expression
        this.vrm.expressionManager.setValue('aa', Math.min(1, this.weights.A));
        this.vrm.expressionManager.setValue('ih', Math.min(1, this.weights.I));
        this.vrm.expressionManager.setValue('ou', Math.min(1, this.weights.U));
        this.vrm.expressionManager.setValue('ee', Math.min(1, this.weights.E));
        this.vrm.expressionManager.setValue('oh', Math.min(1, this.weights.O));
    }
}
