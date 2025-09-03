import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const Airplane = ({ color = "grey" }) => {
  const group = useRef();
  const { scene } = useGLTF('/models/airplane.glb');
  

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.set(color); // Apply new color
        child.material.needsUpdate = true; // Important for dynamic changes
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.sub(center);

    const scaleFactor = 0.003; 
    if (group.current) {
      group.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
      group.current.rotation.y = Math.PI; 
      group.current.rotation.x = 0.2; 
      group.current.rotation.z = -0.2;
      group.current.position.y = 1.5;
    }
  }, [scene]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
};

useGLTF.preload('/models/airplane.glb');
export default Airplane;