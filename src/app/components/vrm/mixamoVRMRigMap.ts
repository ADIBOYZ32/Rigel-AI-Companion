import { VRMHumanBoneName } from '@pixiv/three-vrm';

/**
 * A map from Mixamo rig name to VRM Humanoid bone name.
 * We use a normalization function to handle prefixes like "mixamorig:" or "mixamorig1:".
 */
export const mixamoVRMRigMap: Record<string, VRMHumanBoneName> = {
    hips: 'hips',
    spine: 'spine',
    spine1: 'chest',
    spine2: 'upperChest',
    neck: 'neck',
    head: 'head',
    leftShoulder: 'leftShoulder',
    leftArm: 'leftUpperArm',
    leftForeArm: 'leftLowerArm',
    leftHand: 'leftHand',
    rightShoulder: 'rightShoulder',
    rightArm: 'rightUpperArm',
    rightForeArm: 'rightLowerArm',
    rightHand: 'rightHand',
    leftUpLeg: 'leftUpperLeg',
    leftLeg: 'leftLowerLeg',
    leftFoot: 'leftFoot',
    rightUpLeg: 'rightUpperLeg',
    rightLeg: 'rightLowerLeg',
    rightFoot: 'rightFoot',
};
