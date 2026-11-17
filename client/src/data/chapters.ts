import { CodexEntryData, StationConfig } from '../types/game';

export const STATIONS: StationConfig[] = [
  {
    id: 'ch1-mural',
    chapterNumber: 1,
    act: 1,
    title: 'Chapter 1: The Severed Station',
    subtitle: 'Decipher the Stone Murals',
    position: [-14, 0, 4],
    accentColor: '#06b6d4',
  },
  {
    id: 'ch2-altar',
    chapterNumber: 2,
    act: 1,
    title: 'Chapter 2: The Hologram Altar',
    subtitle: 'Sequence the Computing Eras',
    position: [-7, 0.3, 0],
    accentColor: '#22d3ee',
    requiredSolvedBefore: 'ch1-mural',
  },
  {
    id: 'ch3-calibration',
    chapterNumber: 3,
    act: 1,
    title: 'Chapter 3: Fundamental Rings',
    subtitle: 'Calibrate Edge Principles',
    position: [-1, 0.5, -4],
    accentColor: '#38bdf8',
    requiredSolvedBefore: 'ch2-altar',
  },
  {
    id: 'ch4-architecture',
    chapterNumber: 4,
    act: 2,
    title: 'Chapter 4: Three-Layer Spire',
    subtitle: 'Route the Local Telemetry',
    position: [7, 0.8, -3],
    accentColor: '#f59e0b',
    requiredSolvedBefore: 'ch3-calibration',
  },
  {
    id: 'ch5-hardware',
    chapterNumber: 5,
    act: 2,
    title: 'Chapter 5: Silicon Gallery',
    subtitle: 'Match Edge Hardware Modules',
    position: [13, 0.8, 2],
    accentColor: '#fbbf24',
    requiredSolvedBefore: 'ch4-architecture',
  },
  {
    id: 'ch6-compression',
    chapterNumber: 6,
    act: 2,
    title: 'Chapter 6 & 9: Thermal Workbench',
    subtitle: 'Deep Compression Crisis',
    position: [20, 1.1, -1],
    accentColor: '#ef4444',
    requiredSolvedBefore: 'ch5-hardware',
  },
  {
    id: 'ch7-climax',
    chapterNumber: 7,
    act: 3,
    title: 'Chapter 7 & Climax: Valley Dam',
    subtitle: 'Become The Man of Edge',
    position: [29, 1.5, 0],
    accentColor: '#10b981',
    requiredSolvedBefore: 'ch6-compression',
  },
];

export const CODEX_ENTRIES: CodexEntryData[] = [
  {
    chapterNumber: 1,
    title: 'Introduction — The Severed Station',
    narrativeQuote: '“Discover the secrets.”',
    narrativeBeat:
      'When the connection to the capital goes dead, the station freezes and the alarms fall silent. John uncovers a dust-covered mural beneath the facility, learning why relying on distant powers failed them.',
    keyPoints: [
      {
        heading: 'The Core Problems of Cloud-Only Systems',
        details: [
          'Latency: Propagation delay prevents real-time actuation; unacceptable RTT for safety.',
          'Bandwidth: Billions of raw telemetry streams flood uplinks with high transmission cost.',
          'Single Point of Failure: Connection severance causes total system blackout because endpoints lack autonomous local logic.',
        ],
      },
      {
        heading: 'Core Definitions',
        details: [
          'Edge Computing: Computation moved to the physical data source, eliminating network transit & guaranteeing low latency.',
          'Edge AI: Machine learning models executed on-device using compressed neural networks (quantized / pruned) for real-time inference without cloud uplink.',
        ],
      },
    ],
    citation: 'Shi et al. (2016); Zhou et al. (2019)',
  },
  {
    chapterNumber: 2,
    title: 'Evolution of Computing Eras',
    narrativeQuote: '“The power... It attracts me.”',
    narrativeBeat:
      'A brilliant hologram erupts from the stone altar, unwinding a luminous archive from towering mainframes to the rebirth of intelligent machines at the Edge.',
    keyPoints: [
      {
        heading: 'Timeline of Computing Eras',
        details: [
          '1960s Mainframe Era: Massive centralized hubs; passive dumb terminals.',
          '1980s Personal Computing: Affordable microprocessors shifted compute outward to desks.',
          '1990s Content Delivery (CDNs): Akamai cached static web data closer to users.',
          '2000s The Cloud Boom: Elastic, powerful, yet fragile centralized server farms.',
          '2009 Cloudlets & Mobile Edge: Micro-servers one hop away to slash mobile latency.',
          '2014 Fog Computing & IoT: Gateways and routers processing IoT floods in the Fog.',
          '2016 Edge Computing Defined: IEEE standard prioritizing offline determinism.',
          '2020s+ Edge AI & TinyML: Quantized deep learning and NPUs running locally on low-power chips.',
        ],
      },
    ],
    citation: 'Satyanarayanan (2017); Zhou et al. (2019)',
  },
  {
    chapterNumber: 3,
    title: 'Fundamental Concepts',
    narrativeQuote: '“A solution. This is a solution.”',
    narrativeBeat:
      'The hologram coils around John’s arm, projecting the foundational rules required to restore deterministic control.',
    keyPoints: [
      {
        heading: 'Core Rules & Principles',
        details: [
          'Deterministic Latency & Temporal Bounds: Guarantees sub-10ms real-time response without cloud jitter.',
          'Data Locality (In-Situ): Filters raw telemetry at the source, reducing upstream bandwidth by up to 90%.',
          'Partition Tolerance: Ensures operation during total network cuts by decoupling safety controls.',
          'Decoupled Computation: Cloud trains heavy models; Edge executes low-power real-time inference.',
          'Model Compression: Quantization (FP32 to INT8) & Pruning (stripping redundant weights).',
          'Data Sovereignty: Raw data stays within the local perimeter, shrinking the external attack surface.',
        ],
      },
    ],
    citation: 'Satyanarayanan (2017); Zhou et al. (2019)',
  },
  {
    chapterNumber: 4,
    title: 'Architecture & 4-Step Plan',
    narrativeQuote: '“Let’s test this power.”',
    narrativeBeat:
      'John projects a layered blueprint illustrating how raw data flows, how models are deployed, and how physical tiers divide the workload.',
    keyPoints: [
      {
        heading: 'Three-Layer Architecture',
        details: [
          'Top Tier — Cloud Server: Heavy training, global orchestration, long-term analytics.',
          'Middle Tier — Edge Server: Local aggregation, regional inference, low-latency routing.',
          'Bottom Tier — End Device: Sensors, actuators, and microcontrollers acquiring data in-situ.',
        ],
      },
      {
        heading: 'The Edge’s 4-Step Plan',
        details: [
          'Step 1: Data Acquisition → Step 2: Edge Infrastructure Optimization → Step 3: Model Inference & Training Optimization → Step 4: Application.',
        ],
      },
    ],
    citation: 'Shi et al. (2016); Li et al. (2018)',
  },
  {
    chapterNumber: 5,
    title: 'Edge Hardware Ecosystem',
    narrativeQuote: '“Power in a small package.”',
    narrativeBeat:
      'Edge Computing manifests in all forms of silicon—from ultra-low-power microcontrollers to reconfigurable FPGAs and rugged Edge Servers.',
    keyPoints: [
      {
        heading: 'Hardware Categories',
        details: [
          'Microcontrollers (Arduino Uno, ESP32, RPi Pico, PIC): Specific embedded tasks, direct sensor interfacing, ultra-low power.',
          'SoC / SoM / SBC (Raspberry Pi 4/5): Integrated CPU/GPU/memory/I/O on a die, module, or standalone board.',
          'FPGAs (AMD Spartan-7): Reprogrammable hardware parallelism with deterministic ultra-low latency.',
          'Embedded GPUs & Accelerators: GPUs (parallel compute), TPUs (data-center scale ML), NPUs (on-device AI workloads).',
          'Edge Gateways & Servers: Specialized networking and local compute nodes bridging sensors to the core.',
        ],
      },
    ],
    citation: 'Zhang, Y. (2026); Yıldırım et al. (2025)',
  },
  {
    chapterNumber: 6,
    title: 'Software, TinyML & Compression',
    narrativeQuote: '“How do I make myself stronger?”',
    narrativeBeat:
      'Bloated FP32 cloud models would burn out compact processors. John masters Deep Compression to achieve blinding speed with minimal energy.',
    keyPoints: [
      {
        heading: 'TinyML & Deep Compression Pipeline',
        details: [
          'TinyML Platforms: TensorFlow Lite, Edge Impulse, MATLAB / Simulink.',
          'INT8 Quantization: Converts 32-bit floats (FP32) to 8-bit integers (INT8), slashing memory & heat.',
          'Pruning: Removes redundant neural connections that do not contribute to inference.',
          'Model Distillation: Transfers intelligence from a heavy Teacher network to a compact Student model.',
          'DSP Algorithms: Fourier and Wavelet Transforms for fast pre-inference signal filtering.',
        ],
      },
    ],
    citation: 'Han, Mao, & Dally (2015)',
  },
  {
    chapterNumber: 7,
    title: 'How It Works — Two-Way Computing Stream',
    narrativeQuote: '“This is what it intends to be.”',
    narrativeBeat:
      'Before throwing the master breaker, John traces the sensory reflex: acoustic pulses and water pressure captured, filtered, inferred, and actuated in milliseconds.',
    keyPoints: [
      {
        heading: 'Two-Way Computing Stream',
        details: [
          'Edge devices are both data consumers and data producers.',
          'Closed-loop local reflex: Sensor Acquisition → DSP Filtering → Local TinyML Inference → Hydraulic Actuator Dispatch (<10ms) with zero cloud authorization.',
        ],
      },
    ],
    citation: 'Liu et al. (2016)',
  },
  {
    chapterNumber: 8,
    title: 'CpE Applications & Career Pathways',
    narrativeQuote: '“Infinite possibilities, infinite fates.”',
    narrativeBeat:
      'With the floodwaters receding, John sees the Edge across civilization: autonomous vehicles, smart grids, robotic surgeons, and life-saving biomedical implants.',
    keyPoints: [
      {
        heading: 'Computer Engineering (CpE) Domains',
        details: [
          'Bridges hardware & software: designing specialized silicon, firmware, and compressed AI for edge devices.',
          '6 Key Domains: Autonomous Vehicles, Industrial Automation & IoT, Smart Healthcare Systems, Smart Cities & Traffic Management, Smart Retail & Automated Checkouts, Smart Energy Grids.',
        ],
      },
    ],
    citation: 'Abad, Chua, & Napiza — Edge of Survival',
  },
  {
    chapterNumber: 9,
    title: 'Advantages & Limitations',
    narrativeQuote: '“Every power has its limits.”',
    narrativeBeat:
      'Speed and independence come with physical trade-offs. Even the Edge needs careful engineering.',
    keyPoints: [
      {
        heading: 'Advantages (Act faster. Send less. Stay ready.)',
        details: [
          'Lower Latency, Reduced Bandwidth, Offline Operation during outages, and Better Data Control.',
        ],
      },
      {
        heading: 'Limitations (Even the Edge needs support.)',
        details: [
          'Limited Resources (memory/compute), Power & Heat dissipation, Accuracy Trade-offs from compression, Maintenance Challenges across scattered nodes, and Design-dependent Performance.',
        ],
      },
    ],
    citation: 'AWS (n.d.-b); IBM (2026)',
  },
  {
    chapterNumber: 10,
    title: 'Security, Ethics & RA 10173',
    narrativeQuote: '“Protect the power. Protect the people.”',
    narrativeBeat:
      'Exposed edge devices can be tampered with or spoofed. John must defend both the silicon and the citizens who rely on it.',
    keyPoints: [
      {
        heading: 'Security Defenses',
        details: [
          'Physical Protection (anti-tamper enclosures), Encryption (at rest & in transit), Access Control, Secure Verified Updates, and Device Monitoring.',
        ],
      },
      {
        heading: 'Ethics & Philippine Data Privacy Act (RA 10173, 2012)',
        details: [
          'Privacy & Transparency, Data Minimization (collect only what is needed), Fairness across diverse users, Human Oversight for high-risk decisions, and Proportionality under RA 10173.',
        ],
      },
    ],
    citation: 'AWS (n.d.-a); NIST; Republic Act No. 10173 (2012)',
  },
  {
    chapterNumber: 11,
    title: 'Existing Technology in the Philippines',
    narrativeQuote: '“The Edge is already among us.”',
    narrativeBeat:
      'Beyond the valley, John discovers Edge infrastructure already powering Filipino networks and handheld devices.',
    keyPoints: [
      {
        heading: 'Philippine Edge Infrastructure',
        details: [
          'Cloudflare Philippine Network: Edge nodes in Manila, Cebu, Cagayan de Oro (CDO), and Tarlac City for local content delivery and low-latency routing.',
          'AWS Outposts PH: Brings supported AWS infrastructure and local workload processing directly into Philippine customer facilities.',
        ],
      },
      {
        heading: 'Consumer Edge AI',
        details: [
          'Samsung Galaxy S25 Series: Personal Data Engine analyzes personal data on-device, enabling natural-language Gallery search and Hybrid AI (local + cloud when needed).',
        ],
      },
    ],
    citation: 'Cloudflare (n.d.); AWS (2021); Samsung (2025)',
  },
  {
    chapterNumber: 12,
    title: 'Future Trends — The Next Chapter',
    narrativeQuote: '“The next chapter begins.”',
    narrativeBeat:
      'Smaller models, stronger NPUs, 5G MEC, and Physical AI will bring autonomous intelligence to every community.',
    keyPoints: [
      {
        heading: 'Smarter Devices & Connected Systems',
        details: [
          'TinyML Expansion & Stronger AI Accelerators (NPUs, Embedded GPUs).',
          'Generative AI at the Edge: Local assistants, vision, and language models.',
          '5G & Multi-Access Edge Computing (MEC) + Cloud–Edge Coordination.',
          'Physical AI & Robotics: Machines combining local perception, reasoning, and action across factories, healthcare, agriculture, and transportation.',
        ],
      },
    ],
    citation: 'ETSI; Edge Impulse; NVIDIA (2025); IBM (2026)',
  },
];
