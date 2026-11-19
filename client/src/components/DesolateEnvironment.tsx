import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const HangingCable: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  sag?: number;
  color?: string;
}> = ({ start, end, sag = 1.4, color = '#1e293b' }) => {
  const geometry = useMemo(() => {
    const p0 = new THREE.Vector3(...start);
    const p2 = new THREE.Vector3(...end);
    const mid = p0.clone().add(p2).multiplyScalar(0.5);
    mid.y -= sag;
    const curve = new THREE.CatmullRomCurve3([p0, mid, p2]);
    return new THREE.TubeGeometry(curve, 20, 0.045, 6, false);
  }, [start, end, sag]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.4} />
    </mesh>
  );
};

const RuinedArch: React.FC<{
  position: [number, number, number];
  scale?: number;
  broken?: boolean;
  glowColor?: string;
}> = ({ position, scale = 1, broken = false, glowColor = '#0ea5e9' }) => (
  <group position={position} scale={scale}>
    {/* Main Stone Arch Rib */}
    <mesh rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
      <torusGeometry args={[7.4, 0.45, 8, 28, broken ? Math.PI * 0.72 : Math.PI]} />
      <meshStandardMaterial color="#141d2e" roughness={0.9} metalness={0.18} />
    </mesh>
    {/* Inner Subtle Glowing Conduit Vein */}
    <mesh rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[6.95, 0.05, 6, 28, broken ? Math.PI * 0.68 : Math.PI]} />
      <meshStandardMaterial
        color={glowColor}
        emissive={glowColor}
        emissiveIntensity={0.9}
        transparent
        opacity={0.65}
      />
    </mesh>
  </group>
);

const DeadTreeSilhouette: React.FC<{ position: [number, number, number]; scale?: number; rotY?: number }> = ({
  position,
  scale = 1,
  rotY = 0,
}) => (
  <group position={position} scale={scale} rotation={[0, rotY, 0]}>
    {/* Gnarled Trunk */}
    <mesh position={[0, 1.4, 0]} rotation={[0.08, 0, -0.1]} castShadow>
      <cylinderGeometry args={[0.1, 0.28, 2.8, 7]} />
      <meshStandardMaterial color="#1a1f2c" roughness={0.95} />
    </mesh>
    {/* Twisted Branches */}
    <mesh position={[0.45, 2.6, 0.15]} rotation={[0.2, 0, -0.75]} castShadow>
      <cylinderGeometry args={[0.03, 0.1, 1.5, 6]} />
      <meshStandardMaterial color="#1a1f2c" roughness={0.95} />
    </mesh>
    <mesh position={[-0.45, 2.35, -0.2]} rotation={[-0.25, 0, 0.68]} castShadow>
      <cylinderGeometry args={[0.025, 0.09, 1.35, 6]} />
      <meshStandardMaterial color="#1a1f2c" roughness={0.95} />
    </mesh>
    <mesh position={[0.1, 3.05, -0.35]} rotation={[-0.55, 0, -0.2]} castShadow>
      <cylinderGeometry args={[0.02, 0.06, 1.1, 6]} />
      <meshStandardMaterial color="#1a1f2c" roughness={0.95} />
    </mesh>
  </group>
);

const EmberBrazier: React.FC<{ position: [number, number, number]; color?: string }> = ({
  position,
  color = '#f59e0b',
}) => {
  const lightRef = useRef<THREE.PointLight>(null);
  const flameRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const flicker = 0.85 + Math.sin(t * 9 + position[0]) * 0.15 + Math.cos(t * 15) * 0.08;
    if (lightRef.current) lightRef.current.intensity = 4.2 * flicker;
    if (flameRef.current) {
      flameRef.current.scale.set(1, 0.9 + flicker * 0.25, 1);
      flameRef.current.rotation.y = t * 1.4;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.22, 0.9, 6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.4} />
      </mesh>
      <mesh ref={flameRef} position={[0, 1.05, 0]}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.8} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 1.4, 0]} color={color} intensity={4} distance={8} />
    </group>
  );
};

const DriftingMistAndAsh: React.FC = () => {
  const ashCount = 180;
  const ashRef = useRef<THREE.InstancedMesh>(null);
  const mist1Ref = useRef<THREE.Mesh>(null);
  const mist2Ref = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const ashParticles = useMemo(() => {
    const rand = seededRandom(404);
    return Array.from({ length: ashCount }, () => ({
      x: -22 + rand() * 86,
      y: 0.4 + rand() * 8,
      z: (rand() - 0.5) * 26,
      vx: 0.35 + rand() * 0.5,
      vy: -0.15 - rand() * 0.25,
      phase: rand() * Math.PI * 2,
      scale: 0.4 + rand() * 0.9,
    }));
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    if (ashRef.current) {
      for (let i = 0; i < ashCount; i++) {
        const p = ashParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x > 64) p.x = -22;
        if (p.y < -1) p.y = 8.5;
        dummy.position.set(p.x, p.y + Math.sin(t * 1.2 + p.phase) * 0.25, p.z);
        dummy.rotation.set(t + p.phase, t * 0.7, 0);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        ashRef.current.setMatrixAt(i, dummy.matrix);
      }
      ashRef.current.instanceMatrix.needsUpdate = true;
    }

    if (mist1Ref.current) {
      mist1Ref.current.position.x = 22 + Math.sin(t * 0.08) * 4;
    }
    if (mist2Ref.current) {
      mist2Ref.current.position.x = 24 + Math.cos(t * 0.06) * 5;
    }
  });

  return (
    <>
      {/* Wind-blown Desolate Ash */}
      <instancedMesh ref={ashRef} args={[undefined, undefined, ashCount]}>
        <dodecahedronGeometry args={[0.04, 0]} />
        <meshBasicMaterial color="#94a3b8" transparent opacity={0.45} />
      </instancedMesh>

      {/* Abyssal Gorge Mist Sheets */}
      <mesh ref={mist1Ref} position={[22, -4.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 60]} />
        <meshBasicMaterial color="#0c192c" transparent opacity={0.52} />
      </mesh>
      <mesh ref={mist2Ref} position={[24, -6.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 64]} />
        <meshBasicMaterial color="#082f49" transparent opacity={0.35} />
      </mesh>
    </>
  );
};

export const DesolateEnvironment: React.FC<{ bridgeActive: boolean; ch6Solved: boolean }> = ({
  bridgeActive,
  ch6Solved,
}) => {
  // Procedurally generate jagged canyon rock spires & cliff faces
  const canyonRocks = useMemo(() => {
    const rand = seededRandom(1337);
    const rocks: {
      pos: [number, number, number];
      scale: [number, number, number];
      rot: [number, number, number];
      color: string;
      isSpire: boolean;
    }[] = [];

    const palette = ['#0b1120', '#0f172a', '#131c31', '#182235', '#0a0f1c'];

    // North & South Abyss Canyon Cliffs
    for (let i = 0; i < 48; i++) {
      const x = -26 + rand() * 94;
      const side = i % 2 === 0 ? -1 : 1;
      const z = side * (9.5 + rand() * 14);
      const h = 4.5 + rand() * 11;
      const w = 2.0 + rand() * 3.8;
      rocks.push({
        pos: [x, -4.5 + h * 0.42, z],
        scale: [w, h, w * (0.8 + rand() * 0.5)],
        rot: [(rand() - 0.5) * 0.25, rand() * Math.PI * 2, (rand() - 0.5) * 0.25],
        color: palette[Math.floor(rand() * palette.length)],
        isSpire: rand() > 0.45,
      });
    }

    // Platform Under-Cliff Outcrops (hides sharp rectangular box silhouettes)
    const ledgeCenters: [number, number, number][] = [
      [-14, -2.1, -7.2], [-14, -2.1, 7.2], [-7, -1.8, -7.4], [-7, -1.8, 7.4],
      [-0.5, -1.6, -7.3], [-0.5, -1.6, 7.3], [10.5, -1.3, -7.4], [10.5, -1.3, 7.4],
      [20, -1.0, -7.2], [20, -1.0, 7.2], [52, -0.8, -8.3], [52, -0.8, 8.3],
      [-18.5, -1.6, -3], [-18.5, -1.6, 3],
    ];
    for (const [lx, ly, lz] of ledgeCenters) {
      rocks.push({
        pos: [lx + (rand() - 0.5) * 1.5, ly, lz],
        scale: [3.2 + rand() * 2.2, 2.4 + rand() * 1.6, 2.2 + rand() * 1.5],
        rot: [rand() * 0.4, rand() * Math.PI, rand() * 0.4],
        color: '#0e1627',
        isSpire: false,
      });
    }

    // Distant Canyon Backdrop Monoliths behind the Valley Dam
    for (let i = 0; i < 12; i++) {
      const z = -20 + i * 3.8 + (rand() - 0.5) * 2;
      const h = 10 + rand() * 12;
      rocks.push({
        pos: [63 + rand() * 8, -3 + h * 0.45, z],
        scale: [3 + rand() * 3, h, 3 + rand() * 2.5],
        rot: [0, rand() * Math.PI, (rand() - 0.5) * 0.2],
        color: '#090e1a',
        isSpire: true,
      });
    }

    return rocks;
  }, []);

  // Scattered ruined rubble & fallen pillars on platform edges
  const rubbleClusters = useMemo(() => {
    const rand = seededRandom(777);
    const items: {
      pos: [number, number, number];
      scale: [number, number, number];
      rot: [number, number, number];
    }[] = [];
    const zones: [number, number, number][] = [
      [-16.2, 0.15, -5.8], [-12.5, 0.15, 6.2], [-8.5, 0.45, -6.1], [-4.8, 0.45, 5.9],
      [1.2, 0.65, -5.6], [6.5, 0.95, 5.8], [11.5, 0.95, -6.1], [17.5, 1.25, 6.0],
      [22.4, 1.25, -5.8], [47.5, 1.95, -6.4], [48.2, 1.95, 6.4],
    ];
    for (const [zx, zy, zz] of zones) {
      for (let k = 0; k < 3; k++) {
        items.push({
          pos: [zx + (rand() - 0.5) * 1.4, zy, zz + (rand() - 0.5) * 1.2],
          scale: [0.25 + rand() * 0.5, 0.18 + rand() * 0.35, 0.25 + rand() * 0.5],
          rot: [rand() * 2, rand() * 3, rand() * 2],
        });
      }
    }
    return items;
  }, []);

  const spires = useMemo(() => canyonRocks.filter((r) => r.isSpire), [canyonRocks]);
  const boulders = useMemo(() => canyonRocks.filter((r) => !r.isSpire), [canyonRocks]);

  const spireRef = useRef<THREE.InstancedMesh>(null);
  const boulderRef = useRef<THREE.InstancedMesh>(null);
  const rubbleRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    if (spireRef.current) {
      spires.forEach((r, i) => {
        dummy.position.set(...r.pos);
        dummy.rotation.set(...r.rot);
        dummy.scale.set(...r.scale);
        dummy.updateMatrix();
        spireRef.current!.setMatrixAt(i, dummy.matrix);
        spireRef.current!.setColorAt(i, color.set(r.color));
      });
      spireRef.current.instanceMatrix.needsUpdate = true;
      if (spireRef.current.instanceColor) spireRef.current.instanceColor.needsUpdate = true;
    }

    if (boulderRef.current) {
      boulders.forEach((r, i) => {
        dummy.position.set(...r.pos);
        dummy.rotation.set(...r.rot);
        dummy.scale.set(...r.scale);
        dummy.updateMatrix();
        boulderRef.current!.setMatrixAt(i, dummy.matrix);
        boulderRef.current!.setColorAt(i, color.set(r.color));
      });
      boulderRef.current.instanceMatrix.needsUpdate = true;
      if (boulderRef.current.instanceColor) boulderRef.current.instanceColor.needsUpdate = true;
    }

    if (rubbleRef.current) {
      rubbleClusters.forEach((r, i) => {
        dummy.position.set(...r.pos);
        dummy.rotation.set(...r.rot);
        dummy.scale.set(...r.scale);
        dummy.updateMatrix();
        rubbleRef.current!.setMatrixAt(i, dummy.matrix);
      });
      rubbleRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [spires, boulders, rubbleClusters]);

  return (
    <group>
      {/* Eerie Eclipse Moon over the Desolate Valley Dam */}
      <group position={[66, 21, -24]}>
        <mesh>
          <sphereGeometry args={[3.4, 24, 24]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh>
          <ringGeometry args={[3.45, 3.85, 48]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.75} />
        </mesh>
        <pointLight position={[-4, -2, 6]} color="#38bdf8" intensity={6} distance={70} />
      </group>

      {/* Deep Abyssal Canyon Floor */}
      <mesh position={[22, -9.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial color="#030712" roughness={1} />
      </mesh>

      {/* Instanced Basalt Spires (1 draw call) */}
      <instancedMesh ref={spireRef} args={[undefined, undefined, spires.length]} receiveShadow>
        <coneGeometry args={[0.75, 1.4, 6]} />
        <meshStandardMaterial roughness={0.92} metalness={0.12} flatShading />
      </instancedMesh>

      {/* Instanced Basalt Cliff Boulders (1 draw call) */}
      <instancedMesh ref={boulderRef} args={[undefined, undefined, boulders.length]} receiveShadow>
        <dodecahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial roughness={0.92} metalness={0.12} flatShading />
      </instancedMesh>

      {/* Instanced Basalt Rubble (1 draw call) */}
      <instancedMesh ref={rubbleRef} args={[undefined, undefined, rubbleClusters.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#243047" roughness={0.88} flatShading />
      </instancedMesh>

      {/* Ruined Gothic-SciFi Ribbed Archways spanning Act I & Act II */}
      <RuinedArch position={[-11, 0, 0]} glowColor="#0ea5e9" broken />
      <RuinedArch position={[-3.5, 0.3, 0]} glowColor="#2dd4bf" />
      <RuinedArch position={[10.5, 0.7, 0]} glowColor="#f59e0b" broken />
      <RuinedArch position={[19.5, 1.0, 0]} glowColor={ch6Solved ? '#10b981' : '#ef4444'} />

      {/* Sagging Abandoned Power Cables across Pillars & Skyway */}
      <HangingCable start={[-10.5, 4.2, -6.5]} end={[2.2, 4.6, -6.5]} sag={1.6} />
      <HangingCable start={[-10.5, 4.2, 6.5]} end={[2.2, 4.6, 6.5]} sag={1.9} />
      <HangingCable start={[2.2, 4.6, -6.5]} end={[15.5, 5.0, -6.5]} sag={1.8} color={bridgeActive ? '#0d9488' : '#1e293b'} />
      <HangingCable start={[26, 4.1, -2.35]} end={[35, 4.1, -2.35]} sag={1.1} color={ch6Solved ? '#0d9488' : '#1e293b'} />
      <HangingCable start={[35, 4.1, 2.35]} end={[44, 4.1, 2.35]} sag={1.1} color={ch6Solved ? '#0d9488' : '#1e293b'} />

      {/* Fallen Broken Monolith Pillar in Act I */}
      <mesh position={[-13.5, 0.45, -5.9]} rotation={[0.2, 0.4, 1.38]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.42, 3.6, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>

      {/* Flickering Warm Amber Braziers contrasting the cold teal wasteland */}
      <EmberBrazier position={[-16.2, 0, -4.8]} color="#f59e0b" />
      <EmberBrazier position={[-4.5, 0.3, 5.4]} color="#f59e0b" />
      <EmberBrazier position={[16.2, 0.8, -5.2]} color="#f97316" />
      <EmberBrazier position={[47.2, 1.8, -5.6]} color="#f59e0b" />
      <EmberBrazier position={[47.2, 1.8, 5.6]} color="#f59e0b" />

      {/* Gnarled Dead Trees clinging to the Desolate Cliffs & Valley Dam */}
      <DeadTreeSilhouette position={[-16.8, 0, 6.2]} scale={0.95} rotY={0.5} />
      <DeadTreeSilhouette position={[18.8, 1.1, -6.4]} scale={1.1} rotY={2.1} />
      <DeadTreeSilhouette position={[46.8, 1.8, 6.8]} scale={1.25} rotY={1.2} />
      <DeadTreeSilhouette position={[49.5, 1.8, -7.2]} scale={1.15} rotY={3.8} />

      {/* Drifting Desolate Ash & Abyssal Mist */}
      <DriftingMistAndAsh />
    </group>
  );
};
