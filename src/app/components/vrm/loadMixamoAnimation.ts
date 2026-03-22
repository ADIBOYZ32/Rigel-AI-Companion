import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { VRM } from '@pixiv/three-vrm';
import { mixamoVRMRigMap } from './mixamoVRMRigMap';
import { getCachedAssetUrl } from '../../services/assetCache';

export async function loadMixamoAnimation(url: string, vrm: VRM): Promise<THREE.AnimationClip | null> {
    const loader = new FBXLoader();
    const asset = await loader.loadAsync(await getCachedAssetUrl(url));

    let clip = THREE.AnimationClip.findByName(asset.animations, 'mixamo.com');
    if (!clip || clip.tracks.length === 0) {
        clip = asset.animations.find(a => a.tracks.length > 0) || asset.animations[0];
    }

    if (!clip || clip.tracks.length === 0) return null;

    const tracks: THREE.KeyframeTrack[] = [];
    const restRotationInverse = new THREE.Quaternion();
    const parentRestWorldRotation = new THREE.Quaternion();
    const tempQuat = new THREE.Quaternion();
    const tempVec = new THREE.Vector3();

    const motionHips = asset.getObjectByName('mixamorigHips') || asset.getObjectByName('mixamorig:Hips') || asset.getObjectByName('Hips');
    const vrmHips = vrm.humanoid?.getNormalizedBoneNode('hips');

    let hipsPositionScale = 1.0;
    if (motionHips && vrmHips) {
        const motionHipsHeight = motionHips.position.y;
        const vrmHipsY = vrmHips.getWorldPosition(tempVec).y;
        const vrmRootY = vrm.scene.getWorldPosition(new THREE.Vector3()).y;
        const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
        if (motionHipsHeight !== 0) hipsPositionScale = vrmHipsHeight / motionHipsHeight;
    }

    clip.tracks.forEach((track) => {
        const trackNameParts = track.name.split('.');
        const rawBoneName = trackNameParts[0].replace(/.*:/, '').replace(/^mixamorig/, '');
        const lowerRaw = rawBoneName.toLowerCase();
        let humanBoneName = mixamoVRMRigMap[lowerRaw as keyof typeof mixamoVRMRigMap];

        if (!humanBoneName) {
            for (const key in mixamoVRMRigMap) {
                if (key.toLowerCase() === lowerRaw || lowerRaw.includes(key.toLowerCase())) {
                    humanBoneName = mixamoVRMRigMap[key as keyof typeof mixamoVRMRigMap];
                    break;
                }
            }
        }

        const vrmNode = humanBoneName ? vrm.humanoid?.getNormalizedBoneNode(humanBoneName) : null;
        const assetNode = asset.getObjectByName(trackNameParts[0]);

        if (vrmNode && assetNode) {
            const propertyName = trackNameParts[1];
            assetNode.getWorldQuaternion(restRotationInverse).invert();
            if (assetNode.parent) assetNode.parent.getWorldQuaternion(parentRestWorldRotation);
            else parentRestWorldRotation.identity();

            if (track instanceof THREE.QuaternionKeyframeTrack) {
                const values = new Float32Array(track.values.length);
                for (let i = 0; i < track.values.length; i += 4) {
                    tempQuat.fromArray(track.values, i);
                    tempQuat.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
                    const isVRM0 = (vrm.meta as any)?.metaVersion === '0';
                    values[i] = isVRM0 ? -tempQuat.x : tempQuat.x;
                    values[i + 1] = tempQuat.y;
                    values[i + 2] = isVRM0 ? -tempQuat.z : tempQuat.z;
                    values[i + 3] = tempQuat.w;
                }
                tracks.push(new THREE.QuaternionKeyframeTrack(`${vrmNode.name}.${propertyName}`, track.times, values));
            } else if (track instanceof THREE.VectorKeyframeTrack) {
                const isVRM0 = (vrm.meta as any)?.metaVersion === '0';
                const values = new Float32Array(track.values.length);
                for (let i = 0; i < track.values.length; i += 3) {
                    values[i] = (isVRM0 ? -track.values[i] : track.values[i]) * hipsPositionScale;
                    values[i + 1] = track.values[i + 1] * hipsPositionScale;
                    values[i + 2] = (isVRM0 ? -track.values[i + 2] : track.values[i + 2]) * hipsPositionScale;
                }
                tracks.push(new THREE.VectorKeyframeTrack(`${vrmNode.name}.${propertyName}`, track.times, values));
            }
        }
    });

    return new THREE.AnimationClip('vrmAnimation', clip.duration, tracks);
}
