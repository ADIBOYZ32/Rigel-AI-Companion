import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';

export interface Live2DHandle {
    setEmotion: (emotion: string) => void;
    syncAudio: (audio: HTMLAudioElement) => void;
    setMode: (mode: string) => void;
    startTalking: () => void;
    stopTalking: () => void;
    setMouthVolume: (vol: number) => void;
}

export const Live2DViewer = forwardRef<Live2DHandle, { active?: boolean }>(({ active = true }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const modelRef = useRef<any>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    
    const zoomRef = useRef(1.0);
    const panRef = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const mouthVolumeRef = useRef(0);

    const [eyeGlow, setEyeGlow] = useState<'none' | 'brat' | 'deity'>('none');
    const glowTimeout = useRef<any>(null);

    const applyTransform = useCallback(() => {
        if (wrapperRef.current) {
            wrapperRef.current.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoomRef.current})`;
        }
    }, []);

    useImperativeHandle(ref, () => ({
        syncAudio: (audio) => { (window as any)._activeAudio = audio; },
        startTalking: () => { (window as any)._activeAudio = { paused: false, ended: false }; },
        stopTalking: () => { (window as any)._activeAudio = null; mouthVolumeRef.current = 0; },
        setMouthVolume: (vol) => { mouthVolumeRef.current = vol; },
        setEmotion: (emotion) => {
            if (!modelRef.current) return;
            const model = modelRef.current;
            const play = (name: string) => {
                try {
                    if (typeof model.expression === 'function') model.expression(name);
                    else model.internalModel?.motionManager?.expressionManager?.setExpression(name);
                } catch (e) {}
            };
            if (emotion === 'HAPPY') play('exp_02');
            else if (emotion === 'SAD') play('exp_06');
            else { try { model.internalModel?.motionManager?.expressionManager?.restoreExpression(); } catch (_e) { } }
        },
        setMode: (mode: string) => {
            if (glowTimeout.current) clearTimeout(glowTimeout.current);
            if (mode.includes('Brat')) {
               setEyeGlow('brat');
               glowTimeout.current = setTimeout(() => setEyeGlow('none'), 8000);
            } else if (mode.includes('Deity')) {
               setEyeGlow('deity');
               glowTimeout.current = setTimeout(() => setEyeGlow('none'), 8000);
            }
        }
    }));

    // Protocol: Ticker Control (Non-Destructive switching)
    useEffect(() => {
        const app = appRef.current;
        if (app) {
            if (active) {
                app.start();
                if (app.renderer?.plugins?.interaction) app.renderer.plugins.interaction.enabled = true;
            } else {
                app.stop();
                if (app.renderer?.plugins?.interaction) app.renderer.plugins.interaction.enabled = false;
            }
        }
    }, [active]);

    // Manifestation (One-time creation)
    useEffect(() => {
        if (!canvasRef.current) return;
        let lastMouthVal = 0;
        let isRendered = true;

        const initModel = async () => {
            try {
                (window as any).PIXI = PIXI;
                const { Live2DModel } = await import('pixi-live2d-display');
                
                if (!isRendered) return;

                const app = new PIXI.Application({
                    view: canvasRef.current!,
                    autoStart: active,
                    backgroundAlpha: 0,
                    resizeTo: canvasRef.current!.parentElement || undefined,
                });
                
                if (app.renderer?.plugins?.interaction) app.renderer.plugins.interaction.destroy();
                appRef.current = app;

                const model = await (Live2DModel.from as any)('/mao_pro_en/runtime/mao_pro.model3.json');
                if (!isRendered) { app.destroy(true); return; }

                modelRef.current = model;
                model.anchor.set(0.5, 0.5);
                model.interactive = false;
                
                const scale = (app.screen.height / model.height) * 1.1;
                model.scale.set(scale);
                model.x = app.screen.width / 2;
                model.y = app.screen.height / 2;
                app.stage.addChild(model as any);
                setStatus('ready');

                const updateLoop = () => {
                    const core = model.internalModel?.coreModel as any;
                    if (!core) return;
                    const elapsed = PIXI.Ticker.shared.lastTime / 1000;
                    core.setParameterValueById('ParamBreath', (Math.sin(elapsed * 1.2) + 1) / 2);
                    
                    const volume = mouthVolumeRef.current || (window as any)._rigelVolume || 0;
                    lastMouthVal += (volume - lastMouthVal) * 0.45;
                    
                    const state = Math.floor(elapsed * 5) % 5;
                    let vA = 0, vI = 0, vU = 0, vE = 0, vO = 0;
                    if (state === 0) vA = lastMouthVal;
                    else if (state === 1) vE = lastMouthVal;
                    else if (state === 2) vI = lastMouthVal;
                    else if (state === 3) vO = lastMouthVal;
                    else vU = lastMouthVal;

                    core.setParameterValueById('ParamA', vA);
                    core.setParameterValueById('ParamI', vI);
                    core.setParameterValueById('ParamU', vU);
                    core.setParameterValueById('ParamE', vE);
                    core.setParameterValueById('ParamO', vO);
                    
                    core.setParameterValueById('ParamBodyAngleX', Math.sin(elapsed * 1.5) * 5.0);
                    core.setParameterValueById('ParamBodyAngleY', Math.sin(elapsed * 1.2) * 3.0);
                };

                app.ticker.add(updateLoop);
                model.internalModel.on('beforeModelUpdate', updateLoop);
            } catch (error) { setStatus('error'); }
        };

        initModel();

        const onWheelEvent = (e: WheelEvent) => {
            if (!active) return;
            e.preventDefault();
            zoomRef.current = Math.min(Math.max(0.3, zoomRef.current - e.deltaY * 0.001), 4.0);
            applyTransform();
        };

        const wrapper = wrapperRef.current;
        if (wrapper) wrapper.addEventListener('wheel', onWheelEvent, { passive: false });

        return () => {
            isRendered = false;
            if (wrapper) wrapper.removeEventListener('wheel', onWheelEvent);
            if (appRef.current) {
                appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
                appRef.current = null;
            }
        };
    }, []); // Only run ONCE on core mount

    const handleDown = (e: React.PointerEvent) => { if (!active) return; isDragging.current = true; dragStart.current = { x: e.clientX, y: e.clientY }; };
    const handleMove = (e: React.PointerEvent) => {
        if (!active || !isDragging.current) return;
        panRef.current = { x: panRef.current.x + e.clientX - dragStart.current.x, y: panRef.current.y + e.clientY - dragStart.current.y };
        dragStart.current = { x: e.clientX, y: e.clientY };
        applyTransform();
    };
    const handleUp = () => { isDragging.current = false; };

    return (
        <div ref={wrapperRef} onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={handleUp} onPointerLeave={handleUp} className="w-full h-full relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing">
            {status === 'loading' && <div className="text-sky-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Cognitive Sync...</div>}
            <canvas ref={canvasRef} className={`w-full h-full pointer-events-none transition-opacity duration-700 ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`} />
            
            {eyeGlow === 'brat' && <div className="absolute pointer-events-none w-20 h-20 top-1/4 right-1/4 bg-red-500/10 blur-3xl animate-pulse rounded-full" />}
            {eyeGlow === 'deity' && <div className="absolute pointer-events-none w-20 h-20 top-1/4 left-1/4 bg-sky-500/10 blur-3xl animate-pulse rounded-full" />}
        </div>
    );
});
