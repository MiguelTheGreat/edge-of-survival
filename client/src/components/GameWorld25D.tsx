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
  return 1.5;
}

function clampPosition(x: number, z: number): [number, number] {
  const cx = Math.max(-17.5, Math.min(33.5, x));
  const cz = Math.max(-7.5, Math.min(7.5, z));
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
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const nearStationRef = useRef<StationConfig | null>(null);
  const lastInteractRef = useRef<number>(interactSignal);
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
        const speed = 7.2;
        const nx = pos.x + (dx / Math.max(1, len)) * speed * dt;
        const nz = pos.z + (dz / Math.max(1, len)) * speed * dt;

        // Prevent crossing laser chasm at x = 3..4.5 unless Ch 3 is solved
        const bridgeActive = solvedStations.includes('ch3-calibration');
        let allowedX = nx;
        if (!bridgeActive && pos.x <= 3.1 && nx > 3.1) {
          allowedX = 3.1;
        }

        const [cx, cz] = clampPosition(allowedX, nz);
        pos.x = cx;
        pos.z = cz;

        if (groupRef.current) {
          const targetRot = Math.atan2(dx, dz);
          groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            targetRot,
            10 * dt
          );
        }
      }
    }

    const targetY = getPlatformHeight(pos.x);
    pos.y = THREE.MathUtils.lerp(pos.y, targetY, 12 * dt);

    if (groupRef.current) {
      groupRef.current.position.copy(pos);
    }

    // 45-degree angled isometric-style follow camera
    const camTarget = new THREE.Vector3(pos.x + 0.5, pos.y + 10.5, pos.z + 11.5);
    camera.position.lerp(camTarget, 5.5 * dt);
    camera.lookAt(pos.x, pos.y + 0.8, pos.z);

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
    let closestDist = 3.1;
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

  return (
    <group ref={groupRef} position={[-15.5, 0, 4]}>
      {/* Wrist-beacon dynamic point light */}
      <pointLight
        position={[0.3, 1.5, 0.3]}
        color={hasPowerAura ? '#10b981' : '#06b6d4'}
        intensity={hasPowerAura ? 9 : 6}
        distance={11}
        castShadow
      />

      {/* Stylized 2.5D John Character */}
      {/* Boots / Legs */}
      <mesh position={[-0.18, 0.35, 0]} castShadow>
        <boxGeometry args={[0.22, 0.7, 0.24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
      <mesh position={[0.18, 0.35, 0]} castShadow>
        <boxGeometry args={[0.22, 0.7, 0.24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>

      {/* Torso (Engineer Jacket) */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.62, 0.78, 0.36]} />
        <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.2} />
      </mesh>
      {/* Glowing Chest Core */}
      <mesh position={[0, 1.08, 0.19]}>
        <boxGeometry args={[0.22, 0.22, 0.04]} />
        <meshStandardMaterial
          color={hasPowerAura ? '#10b981' : '#06b6d4'}
          emissive={hasPowerAura ? '#10b981' : '#06b6d4'}
          emissiveIntensity={2.2}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.68, 0]} castShadow>
        <boxGeometry args={[0.44, 0.44, 0.44]} />
        <meshStandardMaterial color="#f1c27d" roughness={0.6} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 1.72, 0.23]}>
        <boxGeometry args={[0.36, 0.12, 0.04]} />
        <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.8} />
      </mesh>

      {/* Right Arm + Holographic Wrist Beacon */}
      <mesh position={[0.42, 1.05, 0.06]} castShadow>
        <boxGeometry args={[0.18, 0.65, 0.2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0.42, 0.82, 0.12]}>
        <torusGeometry args={[0.13, 0.03, 8, 20]} />
        <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.5} />
      </mesh>

      {/* Chapter 3+ Orbiting Holographic Arm Rings */}
      {hasArmRings && (
        <group position={[0.45, 0.9, 0.15]}>
          <mesh ref={ring1Ref}>
            <torusGeometry args={[0.32, 0.02, 8, 32]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.5} />
          </mesh>
          <mesh ref={ring2Ref}>
            <torusGeometry args={[0.42, 0.015, 8, 32]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2} />
          </mesh>
        </group>
      )}

      {/* Left Arm */}
      <mesh position={[-0.42, 1.05, 0]} castShadow>
        <boxGeometry args={[0.18, 0.65, 0.2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Ground shadow ring */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.55, 24]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.45} />
      </mesh>
    </group>
  );
};

const StormRainParticles: React.FC<{ active: boolean }> = ({ active }) => {
  const count = 260;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const drops = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: 24 + Math.random() * 12,
        y: Math.random() * 10 + 1,
        z: (Math.random() - 0.5) * 16,
        speed: 11 + Math.random() * 6,
      })),
    []
  );

  useFrame((_, delta) => {
    if (!meshRef.current || !active) return;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < count; i++) {
      const d = drops[i];
      d.y -= d.speed * dt;
      if (d.y < 1.2) {
        d.y = 10 + Math.random() * 3;
      }
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(0, 0, 0.15);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.03, 0.45, 0.03]} />
      <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} />
    </instancedMesh>
  );
};

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

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (crystalRef.current) {
      crystalRef.current.rotation.y = t * 1.1;
      crystalRef.current.position.y = 1.65 + Math.sin(t * 2.2) * 0.12;
    }
    if (holoRef.current) {
      holoRef.current.rotation.y = -t * 0.6;
    }
  });

  const color = solved ? '#10b981' : unlocked ? station.accentColor : '#475569';

  return (
    <group position={station.position}>
      {/* Dynamic chamber point light */}
      {(unlocked || solved) && (
        <pointLight
          position={[0, 2.8, 0]}
          color={color}
          intensity={solved ? 7 : 5}
          distance={9}
        />
      )}

      {/* Basalt Pedestal Base */}
      <mesh
        position={[0, 0.55, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (unlocked) onClick();
        }}
      >
        <cylinderGeometry args={[0.75, 0.95, 1.1, 6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Glowing Rim */}
      <mesh position={[0, 1.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.72, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={unlocked ? 2 : 0.2} />
      </mesh>

      {/* Floating Holographic Crystal */}
      <mesh
        ref={crystalRef}
        position={[0, 1.65, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (unlocked) onClick();
        }}
      >
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={unlocked ? 2.4 : 0.3}
          wireframe={!solved}
        />
      </mesh>

      {/* Towering Wireframe Hologram for Ch 2 Altar */}
      {station.id === 'ch2-altar' && unlocked && (
        <mesh ref={holoRef} position={[0, 2.8, 0]}>
          <icosahedronGeometry args={[1.15, 1]} />
          <meshStandardMaterial
            color={solved ? '#10b981' : '#22d3ee'}
            emissive={solved ? '#10b981' : '#06b6d4'}
            emissiveIntensity={1.6}
            wireframe
            transparent
            opacity={0.45}
          />
        </mesh>
      )}

      {/* 2.5D Billboarded Floating Label */}
      {!hideLabels && (
        <Html position={[0, 2.55, 0]} center distanceFactor={14} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide whitespace-nowrap border backdrop-blur-md transition-all ${
              solved
                ? 'bg-emerald-950/85 border-emerald-400/60 text-emerald-200'
                : unlocked
                ? isNear
                  ? 'bg-cyan-900/95 border-cyan-300 text-white scale-110 shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-900/85 border-cyan-500/40 text-cyan-200'
                : 'bg-slate-950/75 border-slate-700 text-slate-500'
            }`}
          >
            <div>Ch {station.chapterNumber}: {station.subtitle}</div>
            {isNear && unlocked && (
              <div className="text-[10px] text-amber-300 text-center mt-0.5">
                Press [E] / Click to Engage
              </div>
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
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 16, 42]} />

      <ambientLight intensity={0.28} color="#94a3b8" />
      <directionalLight
        position={[12, 22, 10]}
        intensity={0.75}
        color="#cbd5e1"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* ACT I: Subterranean Basalt Platforms */}
      {/* Platform 1: Ch 1 */}
      <mesh position={[-14, -0.5, 0]} receiveShadow>
        <boxGeometry args={[8, 1, 15]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {/* Platform 2: Ch 2 */}
      <mesh position={[-7, -0.2, 0]} receiveShadow>
        <boxGeometry args={[6, 1, 15]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>
      {/* Platform 3: Ch 3 */}
      <mesh position={[-0.5, 0, 0]} receiveShadow>
        <boxGeometry args={[7, 1, 15]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>

      {/* Carved Stone Murals in Ch 1 */}
      {[-3.5, 0, 3.5].map((zPos, i) => (
        <group key={i} position={[-17.4, 1.6, zPos]}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 2.4, 2.2]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
          <mesh position={[0.22, 0, 0]}>
            <planeGeometry args={[1.6, 1.6]} />
            <meshStandardMaterial
              color={solvedStations.includes('ch1-mural') ? '#10b981' : '#06b6d4'}
              emissive={solvedStations.includes('ch1-mural') ? '#10b981' : '#06b6d4'}
              emissiveIntensity={0.6}
              wireframe
            />
          </mesh>
        </group>
      ))}

      {/* Extruded Circuit Conduits across Act I */}
      <mesh position={[-7, 0.32, 0]}>
        <boxGeometry args={[20, 0.05, 0.35]} />
        <meshStandardMaterial
          color={bridgeActive ? '#10b981' : '#06b6d4'}
          emissive={bridgeActive ? '#10b981' : '#06b6d4'}
          emissiveIntensity={1.6}
        />
      </mesh>

      {/* 3D Laser Bridge between Act I (x=3) and Act II (x=5) */}
      <mesh position={[4, 0.65, 0]}>
        <boxGeometry args={[2.2, 0.12, 3.2]} />
        <meshStandardMaterial
          color={bridgeActive ? '#06b6d4' : '#ef4444'}
          emissive={bridgeActive ? '#06b6d4' : '#ef4444'}
          emissiveIntensity={bridgeActive ? 2.2 : 0.7}
          transparent
          opacity={bridgeActive ? 0.85 : 0.2}
        />
      </mesh>

      {/* ACT II: Architecture, Hardware & Compression Chamber */}
      <mesh position={[10.5, 0.3, 0]} receiveShadow>
        <boxGeometry args={[11, 1, 15]} />
        <meshStandardMaterial color="#0f172a" roughness={0.85} />
      </mesh>
      <mesh position={[20, 0.6, 0]} receiveShadow>
        <boxGeometry args={[8, 1, 15]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>

      {/* Severed Cloud Tower Visual (Red Broken Spire) */}
      <group position={[7, 0.8, -6.5]}>
        <mesh position={[0, 1.8, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.7, 3.6, 8]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, 3.9, 0]}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.8} wireframe />
        </mesh>
      </group>

      {/* Thermal Crisis Warning Light in Ch 6 */}
      {!ch6Solved && solvedStations.includes('ch5-hardware') && (
        <pointLight position={[20, 4, -1]} color="#ef4444" intensity={10} distance={10} />
      )}

      {/* ACT III: Outdoor Valley Dam Deck */}
      <mesh position={[29.5, 1.0, 0]} receiveShadow>
        <boxGeometry args={[11, 1, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.75} />
      </mesh>

      {/* Floodwater Plane */}
      <mesh position={[33, damRaised ? 0.2 : 1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 22]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#0369a1"
          emissiveIntensity={0.4}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Twin 3D Hydraulic Floodgates */}
      {[-3.2, 3.2].map((zPos, idx) => (
        <mesh key={idx} position={[34.2, damRaised ? 3.8 : 1.8, zPos]} castShadow>
          <boxGeometry args={[0.8, 2.8, 4.8]} />
          <meshStandardMaterial
            color={damRaised ? '#10b981' : '#f59e0b'}
            emissive={damRaised ? '#10b981' : '#f59e0b'}
            emissiveIntensity={0.6}
            metalness={0.5}
          />
        </mesh>
      ))}

      {/* Rain particles in Act III */}
      <StormRainParticles active={climaxActive || solvedStations.includes('ch6-compression')} />

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
              <boxGeometry args={[0.9, 0.9, 0.9]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.5} />
            </mesh>
            {!hideLabels && (
              <Html position={[0, 0.85, 0]} center distanceFactor={14} zIndexRange={[5, 0]}>
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
      <Canvas shadows camera={{ fov: 45, near: 0.1, far: 120, position: [-15, 10.5, 15.5] }}>
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
};
