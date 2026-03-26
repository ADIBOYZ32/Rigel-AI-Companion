
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRMLoaderPlugin, VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';
import { LipSyncManager } from './vrm/LipSync';
import { loadMixamoAnimation } from './vrm/loadMixamoAnimation';
import { getCachedAssetUrl } from '../services/assetCache';

export interface VRMHandle {
    setEmotion: (emotion: string) => void;
    syncAudio: (audio: HTMLAudioElement) => void;
    setMode: (mode: string) => void;
    triggerAnim: (name: string) => void;
    startTalking: () => void;
    stopTalking: () => void;
    setMouthVolume: (vol: number) => void; 
}

export const VRMModelViewer = forwardRef<VRMHandle, { active?: boolean, onLoaded?: () => void, onProgress?: (p: number) => void }>(({ active = true, onLoaded, onProgress }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const vrmRef = useRef<VRM | null>(null);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
    const currentActionRef = useRef<THREE.AnimationAction | null>(null);
    const lipSyncRef = useRef<LipSyncManager | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const mouthVolumeRef = useRef(0);

    const blinkTimer = useRef(0);
    const isBlinking = useRef(false);

    useImperativeHandle(ref, () => ({
        setEmotion: (emotion: string) => {
            if (!vrmRef.current?.expressionManager) return;
            const map: Record<string, VRMExpressionPresetName> = {
                'HAPPY': 'happy', 'SAD': 'sad', 'ANGRY': 'angry', 'SURPRISED': 'surprised'
            };
            const preset = map[emotion.toUpperCase()] || 'neutral';
            vrmRef.current.expressionManager.setValue(preset, 1.0);
            Object.values(map).forEach(v => { if (v !== preset && vrmRef.current!.expressionManager) vrmRef.current!.expressionManager!.setValue(v, 0); });
        },
        syncAudio: (audio: HTMLAudioElement) => { if (lipSyncRef.current) lipSyncRef.current.connectAudio(audio); },
        setMode: (mode: string) => { console.log(`🚀 Mode Trigger: ${mode}`); },
        triggerAnim: (name: string) => { playAnimation(name); },
        startTalking: () => { if (lipSyncRef.current) lipSyncRef.current.startTalking(); },
        stopTalking: () => { if (lipSyncRef.current) lipSyncRef.current.stopTalking(); mouthVolumeRef.current = 0; },
        setMouthVolume: (vol) => { mouthVolumeRef.current = vol; }
    }));

    const playAnimation = (name: string) => {
        const nextAction = actionsRef.current[name];
        if (!nextAction) return;
        if (currentActionRef.current && currentActionRef.current !== nextAction) currentActionRef.current.fadeOut(0.3);
        nextAction.reset().fadeIn(0.3).play();
        currentActionRef.current = nextAction;
    };

    useEffect(() => {
        if (!active && controlsRef.current) controlsRef.current.enabled = false;
        if (active && controlsRef.current) controlsRef.current.enabled = true;
    }, [active]);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        let running = true;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.set(0, 1.3, -3.5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 2.0));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight.position.set(1, 2, 3);
        scene.add(dirLight);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1.1, 0);
        controls.enableDamping = true;
        controlsRef.current = controls;

        const loadingManager = new THREE.LoadingManager();
        loadingManager.onProgress = (_url, itemsLoaded, itemsTotal) => {
            const p = (itemsLoaded / itemsTotal) * 100;
            // Ensure we never get stuck at 99.9%
            const finalP = p > 98 ? 100 : p;
            if (onProgress) onProgress(finalP);
        };
        
        loadingManager.onError = (url) => {
            console.error(`Neural Fracture at: ${url}`);
            // Force 100% on error to prevent hanging the deity entry
            if (onProgress) onProgress(100);
            if (onLoaded) onLoaded();
        };

        const loader = new GLTFLoader(loadingManager);
        loader.register((parser) => new VRMLoaderPlugin(parser));

        const initVRM = async () => {
            const vrmUrl = await getCachedAssetUrl('https://zpzirzwzuiyyalfmdvsw.supabase.co/storage/v1/object/public/athetheria-assets/public/MRig.vrm');
            loader.load(vrmUrl, async (gltf) => {
                if (!running) return;
                const vrm = gltf.userData.vrm as VRM;
                if (!vrm) return;
                vrmRef.current = vrm;
                vrm.scene.rotation.y = Math.PI;
                scene.add(vrm.scene);
                
                // 🏙️ IMPACT: Report readiness immediately after scene manifest
                if (onLoaded) onLoaded();
                if (onProgress) onProgress(100);

                lipSyncRef.current = new LipSyncManager(vrm);
                const mixer = new THREE.AnimationMixer(vrm.scene);
                mixerRef.current = mixer;
                mixer.addEventListener('finished', () => playAnimation('Idle'));

                const anims = [
                    { name: 'Idle', path: 'https://zpzirzwzuiyyalfmdvsw.supabase.co/storage/v1/object/public/athetheria-assets/public/HappyIdle.fbx', loop: true },
                    { name: 'Backflip', path: 'https://zpzirzwzuiyyalfmdvsw.supabase.co/storage/v1/object/public/athetheria-assets/public/Backflip.fbx', loop: false },
                    { name: 'Laughing', path: 'https://zpzirzwzuiyyalfmdvsw.supabase.co/storage/v1/object/public/athetheria-assets/public/Laughing.fbx', loop: false },
                ];

                for (const anim of anims) {
                    try {
                        const clip = await loadMixamoAnimation(anim.path, vrm);
                        if (clip) {
                            const action = mixer.clipAction(clip);
                            if (anim.loop) action.setLoop(THREE.LoopRepeat, Infinity);
                            else { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; }
                            actionsRef.current[anim.name] = action;
                            if (anim.name === 'Idle') {
                                playAnimation('Idle');
                            }
                        }
                    } catch (e) { }
                }
            }, (xhr) => {
                // Byte-level siphoning for the main VRM file
                if (xhr.lengthComputable) {
                    const p = (xhr.loaded / xhr.total) * 100;
                    if (onProgress) onProgress(p);
                }
            });
        };
        
        initVRM();

        const tick = () => {
            if (!running) return;
            requestAnimationFrame(tick);
            if (!active) return; // Cognitive Throttling

            const dt = 1/60; 
            if (mixerRef.current) mixerRef.current.update(dt);
            if (vrmRef.current) vrmRef.current.update(dt);
            if (controlsRef.current) controlsRef.current.update();
            
            // 🎙️ NEURAL LIP SYNC manifestation (wLipSync + Manual Gain)
            if (lipSyncRef.current) lipSyncRef.current.update(dt);
            
            if (vrmRef.current?.expressionManager && mouthVolumeRef.current > 0) {
                // If wLipSync failed, help it out with the global volume
                const aa = vrmRef.current.expressionManager.getValue('aa') || 0;
                if (aa < mouthVolumeRef.current * 0.5) {
                   vrmRef.current.expressionManager.setValue('aa', mouthVolumeRef.current * 0.9);
                }
            } else if (vrmRef.current?.expressionManager) {
                // Secure reset for 3D manifest
                vrmRef.current.expressionManager.setValue('aa', 0);
                vrmRef.current.expressionManager.setValue('ih', 0);
                vrmRef.current.expressionManager.setValue('ou', 0);
            }

            if (vrmRef.current?.expressionManager) {
                blinkTimer.current -= dt;
                if (blinkTimer.current <= 0) {
                    const nextVal = isBlinking.current ? 0 : 1;
                    vrmRef.current.expressionManager.setValue('blink', nextVal);
                    isBlinking.current = !isBlinking.current;
                    blinkTimer.current = isBlinking.current ? 0.1 : 1 + Math.random() * 4;
                }
            }

            renderer.render(scene, camera);
        };
        tick();

        const handleResize = () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            running = false;
            window.removeEventListener('resize', handleResize);
            if (controlsRef.current) controlsRef.current.dispose();
            renderer.dispose();
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        };
    }, [active]);

    return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
});

export default VRMModelViewer;
