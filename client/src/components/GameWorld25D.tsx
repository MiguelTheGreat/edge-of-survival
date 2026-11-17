import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { STATIONS } from '../data/chapters';
import { StationConfig, StationId } from '../types/game';

export interface ThreatCube {
  id: string;
  position: [number, number, number];
  label: string;
}

interface GameWorldProps {
  solvedStations: StationId[];
  activePuzzle: StationId | null;
  climaxActive: boolean;
  threats: ThreatCube[];
  onInterceptThreat: (id: string) => void;
  onSelectStation: (stationId: StationId) => void;
  onNearStationChange: (station: StationConfig | null) => void;
  joystickVectorRef: React.MutableRefObject<{ x: number; y: number }>;
  interactSignal: number;
  damRaised: boolean;
  hideLabels?: boolean;
}

function getPlatformHeight(x: number): number {
  if (x < -10) return 0;
  if (x < -4) return 0.3;
  if (x < 3) return 0.5;
  if (x < 16) return 0.8;
  if (x < 24) return 1.1;
  if (x < 46) return 1.35; // Long Skyway Bridge
  return 1.8; // Separate Final Stage: Valley Dam
}

function clampPosition(x: number, z: number): [number, number] {
  const cx = Math.max(-17.5, Math.min(56.5, x));
  const inLongBridge = cx >= 24 && cx <= 46;
  const maxZ = inLongBridge ? 2.1 : 7.2;
  const cz = Math.max(-maxZ, Math.min(maxZ, z));
  return [cx, cz];
}

interface PlayerRigProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  joystickVectorRef: React.MutableRefObject<{ x: number; y: number }>;
  hasArmRings: boolean;
  hasPowerAura: boolean;
  activePuzzle: StationId | null;
  solvedStations: StationId[];
  onNearStationChange: (station: StationConfig | null) => void;
  onSelectStation: (stationId: StationId) => void;
  interactSignal: number;
}

const PlayerJohn: React.FC<PlayerRigProps> = ({
  playerPosRef,
  joystickVectorRef,
  hasArmRings,
  hasPowerAura,
  activePuzzle,
  solvedStations,
  onNearStationChange,
  onSelectStation,
  interactSignal,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const nearStationRef = useRef<StationConfig | null>(null);
  const lastInteractRef = useRef<number>(interactSignal);
  const walkPhaseRef = useRef<number>(0);
  const { camera } = useThree();

  const isStationUnlocked = (station: StationConfig): boolean => {
    if (!station.requiredSolvedBefore) return true;
    return solvedStations.includes(station.requiredSolvedBefore);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if ((k === 'e' || k === ' ') && !activePuzzle) {
        if (nearStationRef.current && isStationUnlocked(nearStationRef.current)) {
          e.preventDefault();
          onSelectStation(nearStationRef.current.id);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activePuzzle, solvedStations, onSelectStation]);

  useEffect(() => {
    if (interactSignal !== lastInteractRef.current) {
      lastInteractRef.current = interactSignal;
      if (!activePuzzle && nearStationRef.current && isStationUnlocked(nearStationRef.current)) {
        onSelectStation(nearStationRef.current.id);
      }
    }
  }, [interactSignal, activePuzzle, solvedStations, onSelectStation]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const pos = playerPosRef.current;
    let isMoving = false;

    if (!activePuzzle) {
      let dx = joystickVectorRef.current.x;
      let dz = joystickVectorRef.current.y;

      const keys = keysRef.current;
      if (keys['w'] || keys['arrowup']) dz -= 1;
      if (keys['s'] || keys['arrowdown']) dz += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;

      const len = Math.hypot(dx, dz);
      if (len > 0.01) {
        isMoving = true;
        const speed = 7.4;
        const nx = pos.x + (dx / Math.max(1, len)) * speed * dt;
        const nz = pos.z + (dz / Math.max(1, len)) * speed * dt;

        const bridgeActive = solvedStations.includes('ch3-calibration');
        const skywayActive = solvedStations.includes('ch6-compression');
        let allowedX = nx;
        if (!bridgeActive && pos.x <= 3.1 && nx > 3.1) {
          allowedX = 3.1;
        }
        if (!skywayActive && pos.x <= 23.8 && nx > 23.8) {
          allowedX = 23.8;
        }

        const [cx, cz] = clampPosition(allowedX, nz);
        pos.x = cx;
        pos.z = cz;

        if (groupRef.current) {
          const targetRot = Math.atan2(dx, dz);
          groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            targetRot,
            12 * dt
          );
        }
      }
    }

    // Articulated walking stride
    if (isMoving) {
      walkPhaseRef.current += dt * 12;
    } else {
      walkPhaseRef.current = THREE.MathUtils.lerp(walkPhaseRef.current, 0, 8 * dt);
    }
    const swing = isMoving ? Math.sin(walkPhaseRef.current) * 0.48 : 0;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.7;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.7;

    const targetY = getPlatformHeight(pos.x);
    pos.y = THREE.MathUtils.lerp(pos.y, targetY, 12 * dt);

    if (groupRef.current) {
      groupRef.current.position.copy(pos);
    }

    // 45-degree angled isometric-style follow camera (pulls back at Valley Dam for dramatic scale)
    const inFinalDam = pos.x > 44;
    const camOffset = inFinalDam ? new THREE.Vector3(1.5, 13.5, 15.2) : new THREE.Vector3(0.6, 10.8, 11.8);
    const camTarget = new THREE.Vector3(pos.x + camOffset.x, pos.y + camOffset.y, pos.z + camOffset.z);
    camera.position.lerp(camTarget, 4.5 * dt);
    camera.lookAt(pos.x + (inFinalDam ? 1.2 : 0), pos.y + 0.9, pos.z);

    // Orbiting wrist rings (Ch 3+)
    const t = state.clock.elapsedTime;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 2.2;
      ring1Ref.current.rotation.x = Math.sin(t * 1.3) * 0.4;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 2.6;
    }

    // Nearest station check
    let closest: StationConfig | null = null;
    let closestDist = 3.2;
    for (const st of STATIONS) {
      const d = Math.hypot(pos.x - st.position[0], pos.z - st.position[2]);
      if (d < closestDist) {
        closestDist = d;
        closest = st;
      }
    }
    if (closest?.id !== nearStationRef.current?.id) {
      nearStationRef.current = closest;
      onNearStationChange(closest);
    }
  });

  const auraColor = hasPowerAura ? '#10b981' : '#2dd4bf';

  return (
    <group ref={groupRef} position={[-15.5, 0, 4]}>
      {/* Wrist-beacon dynamic point light */}
      <pointLight
        position={[0.3, 1.6, 0.35]}
        color={auraColor}
        intensity={hasPowerAura ? 10 : 7}
        distance={13}
        castShadow
      />

      {/* Articulated Legs */}
      <mesh ref={leftLegRef} position={[-0.17, 0.36, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.45, 6, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.17, 0.36, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.45, 6, 12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.55} metalness={0.2} />
      </mesh>

      {/* Torso (Armored Engineer Jacket) */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.29, 0.25, 0.76, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.35} />
      </mesh>
      {/* Shoulder Pauldrons */}
      <mesh position={[-0.36, 1.32, 0]} castShadow>
        <dodecahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0.36, 1.32, 0]} castShadow>
        <dodecahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.35} />
      </mesh>

      {/* Edge Backpack Power-Cell */}
      <mesh position={[0, 1.1, -0.26]} castShadow>
        <boxGeometry args={[0.38, 0.48, 0.16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.12, -0.35]}>
        <cylinderGeometry args={[0.06, 0.06, 0.34, 12]} />
        <meshStandardMaterial color={auraColor} emissive={auraColor} emissiveIntensity={2.2} />
      </mesh>

      {/* Glowing Chest Core */}
      <mesh position={[0, 1.1, 0.26]}>
        <octahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial color={auraColor} emissive={auraColor} emissiveIntensity={2.4} />
      </mesh>

      {/* Head & Visor */}
      <mesh position={[0, 1.66, 0]} castShadow>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#f1c27d" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.72, 0.02]} castShadow>
        <sphereGeometry args={[0.255, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.68, 0.21]}>
        <boxGeometry args={[0.32, 0.09, 0.06]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#06b6d4" emissiveIntensity={2.0} />
      </mesh>

      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-0.4, 1.02, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.46, 6, 10]} />
        <meshStandardMaterial color="#334155" metalness={0.3} />
      </mesh>

      {/* Right Arm + Holographic Wrist Gauntlet */}
      <group ref={rightArmRef} position={[0.4, 1.02, 0.05]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.08, 0.46, 6, 10]} />
          <meshStandardMaterial color="#334155" metalness={0.3} />
        </mesh>
        <mesh position={[0, -0.22, 0.06]}>
          <torusGeometry args={[0.13, 0.03, 10, 24]} />
          <meshStandardMaterial color="#2dd4bf" emissive="#06b6d4" emissiveIntensity={2.6} />
        </mesh>
      </group>

      {/* Chapter 3+ Orbiting Holographic Arm Rings */}
      {hasArmRings && (
        <group position={[0.45, 0.95, 0.15]}>
          <mesh ref={ring1Ref}>
            <torusGeometry args={[0.34, 0.022, 10, 36]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.5} />
          </mesh>
          <mesh ref={ring2Ref}>
            <torusGeometry args={[0.45, 0.016, 10, 36]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2} />
          </mesh>
        </group>
      )}

      {/* Ground beacon ring */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.56, 32]} />
        <meshBasicMaterial color={auraColor} transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

const CavernMotes: React.FC = () => {
  const count = 140;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const motes = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: -18 + Math.random() * 52,
        y: 0.6 + Math.random() * 5.5,
        z: (Math.random() - 0.5) * 14,
        speed: 0.25 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const m = motes[i];
      dummy.position.set(
        m.x + Math.sin(t * m.speed + m.phase) * 0.35,
        m.y + Math.cos(t * m.speed + m.phase) * 0.25,
        m.z
      );
      const s = 0.7 + Math.sin(t * 2 + m.phase) * 0.3;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[0.045, 0]} />
      <meshBasicMaterial color="#2dd4bf" transparent opacity={0.55} />
    </instancedMesh>
  );
};

const StormRainParticles: React.FC<{ active: boolean }> = ({ active }) => {
  const count = 500;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const drops = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: 42 + Math.random() * 18,
        y: Math.random() * 12 + 1.5,
        z: (Math.random() - 0.5) * 18,
        speed: 14 + Math.random() * 7,
      })),
    []
  );

  useFrame((_, delta) => {
    if (!meshRef.current || !active) return;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < count; i++) {
      const d = drops[i];
      d.y -= d.speed * dt;
      if (d.y < 1.5) {
        d.y = 11 + Math.random() * 3;
      }
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(0, 0, 0.18);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.028, 0.58, 0.028]} />
      <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
    </instancedMesh>
  );
};

const StormLightning: React.FC<{ active: boolean }> = ({ active }) => {
  const lightRef = useRef<THREE.PointLight>(null);
  const flashRef = useRef<number>(0);

  useFrame((_, delta) => {
    if (!lightRef.current || !active) return;
    if (flashRef.current > 0) {
      flashRef.current = Math.max(0, flashRef.current - delta * 28);
      lightRef.current.intensity = flashRef.current;
    } else if (Math.random() < 0.012) {
      flashRef.current = 18 + Math.random() * 14;
    }
  });

  if (!active) return null;
  return <pointLight ref={lightRef} position={[52, 11, -2]} color="#bae6fd" intensity={0} distance={38} />;
};

const StonePillar: React.FC<{ position: [number, number, number]; glowColor?: string }> = ({
  position,
  glowColor = '#0ea5e9',
}) => (
  <group position={position}>
    <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.38, 0.5, 4.4, 8]} />
      <meshStandardMaterial color="#162032" roughness={0.85} metalness={0.2} />
    </mesh>
    <mesh position={[0, 4.45, 0]} castShadow>
      <cylinderGeometry args={[0.62, 0.42, 0.35, 8]} />
      <meshStandardMaterial color="#1e293b" roughness={0.75} />
    </mesh>
    <mesh position={[0, 2.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.42, 0.03, 8, 24]} />
      <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.5} />
    </mesh>
  </group>
);

const StationPedestal: React.FC<{
  station: StationConfig;
  solved: boolean;
  unlocked: boolean;
  isNear: boolean;
  hideLabels?: boolean;
  onClick: () => void;
}> = ({ station, solved, unlocked, isNear, hideLabels, onClick }) => {
  const crystalRef = useRef<THREE.Mesh>(null);
  const holoRef = useRef<THREE.Mesh>(null);
  const knotRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (crystalRef.current) {
      crystalRef.current.rotation.y = t * 1.1;
      crystalRef.current.position.y = 1.7 + Math.sin(t * 2.2) * 0.12;
    }
    if (holoRef.current) {
      holoRef.current.rotation.y = -t * 0.5;
    }
    if (knotRef.current) {
      knotRef.current.rotation.x = t * 0.7;
      knotRef.current.rotation.y = t * 0.9;
    }
  });

  const color = solved ? '#10b981' : unlocked ? station.accentColor : '#475569';

  return (
    <group position={station.position}>
      {(unlocked || solved) && (
        <pointLight
          position={[0, 3.0, 0]}
          color={color}
          intensity={solved ? 8 : 6}
          distance={10}
        />
      )}

      {/* Multi-tiered Octagonal Basalt Pedestal */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.15, 1.3, 0.4, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.85} metalness={0.25} />
      </mesh>
      <mesh
        position={[0, 0.72, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (unlocked) onClick();
        }}
      >
        <cylinderGeometry args={[0.72, 0.92, 0.75, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.65} metalness={0.35} />
      </mesh>

      {/* Glowing Conduit Ring */}
      <mesh position={[0, 1.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.52, 0.7, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={unlocked ? 2.2 : 0.2} />
      </mesh>

      {/* Floating High-Poly Crystal */}
      <mesh
        ref={crystalRef}
        position={[0, 1.7, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (unlocked) onClick();
        }}
      >
        <dodecahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={unlocked ? 2.4 : 0.3}
          wireframe={!solved}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>

      {/* Towering Multi-Layer Wireframe Hologram for Ch 2 Altar */}
      {station.id === 'ch2-altar' && unlocked && (
        <group position={[0, 2.9, 0]}>
          <mesh ref={holoRef}>
            <icosahedronGeometry args={[1.25, 1]} />
            <meshStandardMaterial
              color={solved ? '#10b981' : '#2dd4bf'}
              emissive={solved ? '#10b981' : '#06b6d4'}
              emissiveIntensity={1.6}
              wireframe
              transparent
              opacity={0.45}
            />
          </mesh>
          <mesh ref={knotRef}>
            <torusKnotGeometry args={[0.48, 0.08, 64, 12]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={1.8}
              wireframe
            />
          </mesh>
        </group>
      )}

      {/* 2.5D Billboarded Floating Label — No spoilers before completion */}
      {!hideLabels && (solved || (isNear && unlocked)) && (
        <Html position={[0, 2.55, 0]} center distanceFactor={14} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wide whitespace-nowrap border backdrop-blur-md transition-all ${
              solved
                ? 'bg-emerald-950/85 border-emerald-400/60 text-emerald-200'
                : 'bg-cyan-900/95 border-cyan-300 text-white shadow-lg shadow-cyan-500/30'
            }`}
          >
            {solved ? (
              <div>✓ Ch {station.chapterNumber} Cleared</div>
            ) : (
              <div className="text-amber-300">Engage Pedestal [E] / Click</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

const SceneContent: React.FC<GameWorldProps> = ({
  solvedStations,
  activePuzzle,
  climaxActive,
  threats,
  onInterceptThreat,
  onSelectStation,
  onNearStationChange,
  joystickVectorRef,
  interactSignal,
  damRaised,
  hideLabels,
}) => {
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-15.5, 0, 4));
  const [nearId, setNearId] = React.useState<StationId | null>(null);

  const bridgeActive = solvedStations.includes('ch3-calibration');
  const ch6Solved = solvedStations.includes('ch6-compression');
  const ch2Solved = solvedStations.includes('ch2-altar');

  const handleNearChange = (st: StationConfig | null) => {
    setNearId(st?.id ?? null);
    onNearStationChange(st);
  };

  return (
    <>
      <color attach="background" args={['#060a14']} />
      <fog attach="fog" args={['#060a14', 18, 46]} />

      <ambientLight intensity={0.32} color="#94a3b8" />
      <directionalLight
        position={[14, 24, 12]}
        intensity={0.85}
        color="#e2e8f0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Atmospheric Cavern Dust Motes */}
      <CavernMotes />

      {/* ACT I: Subterranean Basalt Platforms with Glowing Chamfer Trim */}
      <group>
        <mesh position={[-14, -0.5, 0]} receiveShadow>
          <boxGeometry args={[8, 1, 15]} />
          <meshStandardMaterial color="#0b1120" roughness={0.9} metalness={0.15} />
        </mesh>
        <mesh position={[-14, 0.02, 7.45]}>
          <boxGeometry args={[8, 0.06, 0.12]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1.4} />
        </mesh>

        <mesh position={[-7, -0.2, 0]} receiveShadow>
          <boxGeometry args={[6, 1, 15]} />
          <meshStandardMaterial color="#111a2e" roughness={0.85} metalness={0.2} />
        </mesh>
        <mesh position={[-0.5, 0, 0]} receiveShadow>
          <boxGeometry args={[7, 1, 15]} />
          <meshStandardMaterial color="#162036" roughness={0.85} metalness={0.2} />
        </mesh>
      </group>

      {/* Carved Stone Murals in Ch 1 with Glowing Rune Frames */}
      {[-3.5, 0, 3.5].map((zPos, i) => (
        <group key={i} position={[-17.4, 1.6, zPos]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 2.7, 2.3]} />
            <meshStandardMaterial color="#1e293b" roughness={0.75} metalness={0.25} />
          </mesh>
          <mesh position={[0.27, 0, 0]}>
            <boxGeometry args={[0.04, 1.9, 1.7]} />
            <meshStandardMaterial
              color={solvedStations.includes('ch1-mural') ? '#10b981' : '#2dd4bf'}
              emissive={solvedStations.includes('ch1-mural') ? '#10b981' : '#06b6d4'}
              emissiveIntensity={0.85}
              wireframe
            />
          </mesh>
        </group>
      ))}

      {/* Subterranean Pillars with Glowing Rune Rings */}
      <StonePillar position={[-10.5, 0, -6.5]} glowColor="#0ea5e9" />
      <StonePillar position={[-10.5, 0, 6.5]} glowColor="#0ea5e9" />
      <StonePillar position={[2.2, 0.4, -6.5]} glowColor={bridgeActive ? '#10b981' : '#f59e0b'} />
      <StonePillar position={[2.2, 0.4, 6.5]} glowColor={bridgeActive ? '#10b981' : '#f59e0b'} />
      <StonePillar position={[15.5, 0.8, -6.5]} glowColor="#f59e0b" />
      <StonePillar position={[15.5, 0.8, 6.5]} glowColor="#f59e0b" />

      {/* Extruded Circuit Conduits across Act I */}
      <mesh position={[-7, 0.33, 0]}>
        <boxGeometry args={[20, 0.06, 0.42]} />
        <meshStandardMaterial
          color={bridgeActive ? '#10b981' : '#2dd4bf'}
          emissive={bridgeActive ? '#10b981' : '#06b6d4'}
          emissiveIntensity={1.8}
        />
      </mesh>

      {/* Segmented 3D Laser Bridge between Act I (x=3) and Act II (x=5) */}
      {[-0.9, 0, 0.9].map((zOff, idx) => (
        <mesh key={idx} position={[4, 0.68, zOff]}>
          <boxGeometry args={[2.3, 0.1, 0.65]} />
          <meshStandardMaterial
            color={bridgeActive ? '#2dd4bf' : '#ef4444'}
            emissive={bridgeActive ? '#06b6d4' : '#ef4444'}
            emissiveIntensity={bridgeActive ? 2.4 : 0.7}
            transparent
            opacity={bridgeActive ? 0.9 : 0.22}
          />
        </mesh>
      ))}

      {/* ACT II: Architecture, Hardware & Compression Chamber */}
      <mesh position={[10.5, 0.3, 0]} receiveShadow>
        <boxGeometry args={[11, 1, 15]} />
        <meshStandardMaterial color="#0f172a" roughness={0.85} metalness={0.2} />
      </mesh>
      <mesh position={[20, 0.6, 0]} receiveShadow>
        <boxGeometry args={[8, 1, 15]} />
        <meshStandardMaterial color="#172136" roughness={0.85} metalness={0.2} />
      </mesh>

      {/* Three-Layer Architecture Spire Landmark (Ch 4) */}
      <group position={[7, 0.8, -6.2]}>
        {/* End Device Tier */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.9, 1.0, 0.6, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.4} />
        </mesh>
        {/* Edge Server Tier */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.65, 0.75, 0.8, 8]} />
          <meshStandardMaterial color="#0f172a" emissive="#f59e0b" emissiveIntensity={0.35} />
        </mesh>
        {/* Severed Cloud Spire (Top) */}
        <mesh position={[0, 3.0, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.45, 1.1, 8]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, 4.0, 0]}>
          <octahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.0} wireframe />
        </mesh>
      </group>

      {/* 3D Hardware Gallery Mini-Chips around Ch 5 */}
      {[-2.2, 0, 2.2].map((xOff, i) => (
        <mesh key={i} position={[13 + xOff, 1.05, 5.2]} castShadow>
          <boxGeometry args={[0.7, 0.45, 0.7]} />
          <meshStandardMaterial
            color="#1e293b"
            emissive="#fbbf24"
            emissiveIntensity={solvedStations.includes('ch5-hardware') ? 0.9 : 0.25}
            metalness={0.6}
          />
        </mesh>
      ))}

      {/* Thermal Crisis Warning Light in Ch 6 */}
      {!ch6Solved && solvedStations.includes('ch5-hardware') && (
        <pointLight position={[20, 4.2, -1]} color="#ef4444" intensity={12} distance={11} />
      )}

      {/* LONG SKYWAY BRIDGE (x = 24 to x = 46) leading to the Separate Final Stage */}
      <group>
        {/* Main Bridge Deck */}
        <mesh position={[35, 0.85, 0]} receiveShadow>
          <boxGeometry args={[22, 0.95, 4.6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.35} />
        </mesh>
        {/* Glowing Bridge Floor Conduit */}
        <mesh position={[35, 1.36, 0]}>
          <boxGeometry args={[22, 0.06, 0.5]} />
          <meshStandardMaterial
            color={ch6Solved ? '#10b981' : '#ef4444'}
            emissive={ch6Solved ? '#10b981' : '#ef4444'}
            emissiveIntensity={ch6Solved ? 2.0 : 0.7}
          />
        </mesh>
        {/* Energy Guardrails */}
        {[-2.2, 2.2].map((zRail, rIdx) => (
          <mesh key={rIdx} position={[35, 1.85, zRail]}>
            <boxGeometry args={[22, 0.08, 0.08]} />
            <meshStandardMaterial
              color={ch6Solved ? '#2dd4bf' : '#475569'}
              emissive={ch6Solved ? '#06b6d4' : '#334155'}
              emissiveIntensity={ch6Solved ? 1.8 : 0.2}
            />
          </mesh>
        ))}
        {/* 5 Pairs of Towering Bridge Pylons */}
        {[26, 30.5, 35, 39.5, 44].map((xPylon, pIdx) => (
          <group key={pIdx} position={[xPylon, 1.35, 0]}>
            {[-2.35, 2.35].map((zPylon, sIdx) => (
              <group key={sIdx} position={[0, 0, zPylon]}>
                <mesh position={[0, 1.4, 0]} castShadow>
                  <cylinderGeometry args={[0.2, 0.28, 2.8, 8]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.5} />
                </mesh>
                <mesh position={[0, 2.9, 0]}>
                  <octahedronGeometry args={[0.22, 0]} />
                  <meshStandardMaterial
                    color={ch6Solved ? '#2dd4bf' : '#f59e0b'}
                    emissive={ch6Solved ? '#06b6d4' : '#f59e0b'}
                    emissiveIntensity={2.0}
                  />
                </mesh>
              </group>
            ))}
          </group>
        ))}
        {/* Bridge Entry Gate (Red until Ch 6 is solved) */}
        {!ch6Solved && (
          <mesh position={[24.1, 2.1, 0]}>
            <boxGeometry args={[0.2, 1.8, 4.4]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} transparent opacity={0.35} />
          </mesh>
        )}
      </group>

      {/* ACT III: SEPARATE FINAL STAGE — VALLEY DAM OVERLOOK (x = 46 to x = 59) */}
      <mesh position={[52.5, 1.3, 0]} receiveShadow>
        <boxGeometry args={[13, 1, 17]} />
        <meshStandardMaterial color="#151e30" roughness={0.75} metalness={0.3} />
      </mesh>
      {/* Massive Dam Concrete Buttresses + Pulsing Emergency Beacons */}
      {[-6.2, -2.1, 2.1, 6.2].map((zPos, i) => (
        <group key={i} position={[58.5, 2.7, zPos]}>
          <mesh castShadow>
            <boxGeometry args={[1.4, 3.2, 1.3]} />
            <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.3} />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <sphereGeometry args={[0.25, 12, 12]} />
            <meshStandardMaterial
              color={damRaised ? '#10b981' : '#ef4444'}
              emissive={damRaised ? '#10b981' : '#ef4444'}
              emissiveIntensity={2.6}
            />
          </mesh>
        </group>
      ))}
      {!damRaised && ch6Solved && (
        <pointLight position={[55, 5.5, 0]} color="#ef4444" intensity={10} distance={18} />
      )}

      {/* Surging Multi-Layer Floodwater */}
      <mesh position={[56.5, damRaised ? 0.35 : 1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 26]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#0369a1"
          emissiveIntensity={0.55}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Twin Massive Hydraulic Floodgates */}
      {[-3.4, 3.4].map((zPos, idx) => (
        <mesh key={idx} position={[57.6, damRaised ? 4.4 : 2.1, zPos]} castShadow>
          <boxGeometry args={[0.9, 3.2, 5.2]} />
          <meshStandardMaterial
            color={damRaised ? '#10b981' : '#f59e0b'}
            emissive={damRaised ? '#10b981' : '#f59e0b'}
            emissiveIntensity={0.75}
            metalness={0.6}
          />
        </mesh>
      ))}

      {/* Heavy Storm Rain & Lightning Flashes at the Valley Dam */}
      <StormRainParticles active={climaxActive || ch6Solved} />
      <StormLightning active={climaxActive || (ch6Solved && !damRaised)} />

      {/* Clickable Red Cyber Spoofing Cubes during Climax */}
      {climaxActive &&
        threats.map((threat) => (
          <group key={threat.id} position={threat.position}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onInterceptThreat(threat.id);
              }}
            >
              <octahedronGeometry args={[0.62, 0]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.5} />
            </mesh>
            {!hideLabels && (
              <Html position={[0, 0.95, 0]} center distanceFactor={14} zIndexRange={[5, 0]}>
                <button
                  onClick={() => onInterceptThreat(threat.id)}
                  className="px-2.5 py-0.5 rounded-md bg-red-600/90 hover:bg-emerald-600 text-white text-[10px] font-bold border border-red-300 shadow cursor-pointer whitespace-nowrap"
                >
                  SHIELD: {threat.label}
                </button>
              </Html>
            )}
          </group>
        ))}

      {/* All 7 Interactive Chapter Pedestals */}
      {STATIONS.map((station) => {
        const solved = solvedStations.includes(station.id);
        const unlocked =
          !station.requiredSolvedBefore || solvedStations.includes(station.requiredSolvedBefore);
        return (
          <StationPedestal
            key={station.id}
            station={station}
            solved={solved}
            unlocked={unlocked}
            isNear={nearId === station.id}
            hideLabels={hideLabels}
            onClick={() => onSelectStation(station.id)}
          />
        );
      })}

      {/* Player John */}
      <PlayerJohn
        playerPosRef={playerPosRef}
        joystickVectorRef={joystickVectorRef}
        hasArmRings={ch2Solved}
        hasPowerAura={damRaised}
        activePuzzle={activePuzzle}
        solvedStations={solvedStations}
        onNearStationChange={handleNearChange}
        onSelectStation={onSelectStation}
        interactSignal={interactSignal}
      />
    </>
  );
};

export const GameWorld25D: React.FC<GameWorldProps> = (props) => {
  return (
    <div className="w-full h-full relative">
      <Canvas shadows camera={{ fov: 45, near: 0.1, far: 120, position: [-15, 10.8, 15.8] }}>
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
};
