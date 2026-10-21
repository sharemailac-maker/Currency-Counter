import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { CountryCurrency } from '../types';
import { COUNTRIES } from '../data/currencies';
import {
  COUNTRY_COORDINATES,
  latLngToCartesian,
  countryToTargetRotation,
} from '../data/countryCoordinates';
import { CountryListModal } from './CountryListModal';
import {
  Globe,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  ArrowRight,
  List,
} from 'lucide-react';

interface EarthGlobeLandingProps {
  selectedCountry: CountryCurrency;
  onSelectCountryAndLaunch: (country: CountryCurrency) => void;
  onResumeCalculator?: () => void;
  hasExistingCounts?: boolean;
}

interface ProjectedCountryPin {
  id: string;
  country: CountryCurrency;
  x: number;
  y: number;
  visible: boolean;
  scale: number;
}

// Generate 180 tiny stars strictly for the cosmic background (very small, blinking)
interface StarData {
  id: number;
  top: number;
  left: number;
  size: number;
  opacity: number;
  animClass: string;
  delay: string;
}

function generateTinyStars(count: number): StarData[] {
  const stars: StarData[] = [];
  const anims = ['animate-twinkle-fast', 'animate-twinkle-medium', 'animate-twinkle-slow'];

  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      // Very small stars: 1px to 2px
      size: Math.random() > 0.75 ? 2 : Math.random() > 0.35 ? 1.5 : 1,
      opacity: 0.25 + Math.random() * 0.7,
      animClass: anims[i % anims.length],
      delay: `${(Math.random() * 4).toFixed(1)}s`,
    });
  }
  return stars;
}

/**
 * Calculates the ideal camera distance so that the Earth sphere fits
 * comfortably on screen with a small side margin on mobile, tablet, and PC.
 */
function calculateFittedDistance(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 380;
  const aspect = width / height;
  const fovRad = (45 * Math.PI) / 180;
  const tanHalfFov = Math.tan(fovRad / 2); // ~0.41421356
  const sphereDiameter = 200; // radius = 100

  if (aspect < 1) {
    // Portrait (mobile phones and vertical tablets): width is limiting dimension
    // Fit with small side margins: sphere takes ~72% of visible width
    const targetVisibleWidth = sphereDiameter / 0.72;
    return targetVisibleWidth / (2 * tanHalfFov * aspect);
  } else {
    // Landscape (PCs, laptops, tablets in landscape): height is limiting dimension
    // Fit with small margins: sphere takes ~68% of visible height (leaves space for top title and bottom controls)
    const targetVisibleHeight = sphereDiameter / 0.68;
    return targetVisibleHeight / (2 * tanHalfFov);
  }
}

export const EarthGlobeLanding: React.FC<EarthGlobeLandingProps> = ({
  selectedCountry,
  onSelectCountryAndLaunch,
  onResumeCalculator,
  hasExistingCounts,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active chosen country
  const [activeCountry, setActiveCountry] = useState<CountryCurrency>(selectedCountry);
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);

  // List modal state
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  // Auto rotation state
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Projected pin positions on screen
  const [pinPositions, setPinPositions] = useState<ProjectedCountryPin[]>([]);

  // Tiny blinking stars background
  const tinyStars = useMemo(() => generateTinyStars(180), []);

  // Quick lookup map for countries
  const countryMap = useMemo(() => {
    const map = new Map<string, CountryCurrency>();
    COUNTRIES.forEach((c) => map.set(c.id, c));
    return map;
  }, []);

  // Three.js References
  const threeState = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    globeGroup: THREE.Group | null;
    earthMesh: THREE.Mesh | null;
    rotationX: number;
    rotationY: number;
    targetRotationX: number | null;
    targetRotationY: number | null;
    cameraDistance: number;
    targetCameraDistance: number;
    defaultDistance: number;
    velX: number;
    velY: number;
    isDragging: boolean;
    lastMouseX: number;
    lastMouseY: number;
    lastTouchDistance: number | null;
    countryVectors: Map<string, THREE.Vector3>;
    animFrameId: number;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    globeGroup: null,
    earthMesh: null,
    rotationX: 0.15,
    rotationY: -1.2,
    targetRotationX: null,
    targetRotationY: null,
    cameraDistance: 380,
    targetCameraDistance: 380,
    defaultDistance: 380,
    velX: 0,
    velY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    lastTouchDistance: null,
    countryVectors: new Map(),
    animFrameId: 0,
  });

  // Precalculate 3D vectors on sphere surface (radius = 100)
  useEffect(() => {
    const sphereRadius = 100;
    const vectors = new Map<string, THREE.Vector3>();

    COUNTRIES.forEach((country) => {
      const geo = COUNTRY_COORDINATES[country.id];
      if (geo) {
        // Position slightly above sphere surface (radius * 1.018) for pin anchors
        const p = latLngToCartesian(geo.lat, geo.lng, sphereRadius * 1.018);
        vectors.set(country.id, new THREE.Vector3(p.x, p.y, p.z));
      }
    });

    threeState.current.countryVectors = vectors;
  }, []);

  // Function to smoothly rotate globe to point to any country
  const rotateToCountry = useCallback(
    (countryId: string, zoomCloser = true) => {
      const geo = COUNTRY_COORDINATES[countryId];
      if (!geo) return;

      const { rotX, rotY } = countryToTargetRotation(geo.lat, geo.lng);
      const state = threeState.current;

      state.targetRotationX = Math.max(-1.2, Math.min(1.2, rotX));
      // Normalize target rotY relative to current rotY for shortest rotation path
      let diff = (rotY - state.rotationY) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      state.targetRotationY = state.rotationY + diff;

      if (zoomCloser) {
        state.targetCameraDistance = 215;
      }
      setIsAutoRotating(false);
    },
    []
  );

  // Initialize selected country on mount
  useEffect(() => {
    if (selectedCountry) {
      setActiveCountry(selectedCountry);
      // Small timeout to allow canvas setup before centering
      const t = setTimeout(() => {
        rotateToCountry(selectedCountry.id, false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [selectedCountry, rotateToCountry]);

  // Main Three.js Setup & Animation Loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const initialDistance = calculateFittedDistance(width, height);
    threeState.current.cameraDistance = initialDistance;
    threeState.current.targetCameraDistance = initialDistance;
    threeState.current.defaultDistance = initialDistance;

    // 1. Scene
    const scene = new THREE.Scene();
    threeState.current.scene = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 0, initialDistance);
    threeState.current.camera = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    threeState.current.renderer = renderer;

    // 4. Lighting: Soft ambient + crisp top-left sunlight for realistic spherical depth
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7e8, 2.2);
    sunLight.position.set(-200, 150, 240);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    rimLight.position.set(240, -100, -200);
    scene.add(rimLight);

    // 5. Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    threeState.current.globeGroup = globeGroup;

    // 6. Earth Sphere & Texture
    const radius = 100;
    const sphereGeom = new THREE.SphereGeometry(radius, 64, 64);

    const textureLoader = new THREE.TextureLoader();
    // Load local NASA Earth texture
    const earthTexture = textureLoader.load(
      '/assets/earth_texture.jpg',
      () => {
        renderer.render(scene, camera);
      },
      undefined,
      (err) => {
        console.warn('Fallback loading earth texture:', err);
      }
    );
    earthTexture.colorSpace = THREE.SRGBColorSpace;

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.1,
    });

    const earthMesh = new THREE.Mesh(sphereGeom, earthMaterial);
    globeGroup.add(earthMesh);
    threeState.current.earthMesh = earthMesh;

    // 7. Atmospheric Glow Layer (Soft blue limb glow around the Earth ball)
    const atmosphereGeom = new THREE.SphereGeometry(radius * 1.018, 48, 48);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeom, atmosphereMat);
    globeGroup.add(atmosphereMesh);

    // 8. Animation & Projection Loop
    const tempVec = new THREE.Vector3();
    const projVec = new THREE.Vector3();
    let isMounted = true;

    const animate = () => {
      if (!isMounted) return;

      const state = threeState.current;

      // Handle Smooth Camera Zoom Lerp
      if (Math.abs(state.cameraDistance - state.targetCameraDistance) > 0.1) {
        state.cameraDistance += (state.targetCameraDistance - state.cameraDistance) * 0.14;
        camera.position.z = state.cameraDistance;
      }

      // Handle Target Rotation Lerp (when centering on a country)
      if (state.targetRotationX !== null && state.targetRotationY !== null) {
        state.rotationX += (state.targetRotationX - state.rotationX) * 0.1;
        state.rotationY += (state.targetRotationY - state.rotationY) * 0.1;

        if (
          Math.abs(state.targetRotationX - state.rotationX) < 0.0015 &&
          Math.abs(state.targetRotationY - state.rotationY) < 0.0015
        ) {
          state.rotationX = state.targetRotationX;
          state.rotationY = state.targetRotationY;
          state.targetRotationX = null;
          state.targetRotationY = null;
        }
      } else if (!state.isDragging) {
        // Apply Drag Inertia with smooth natural friction
        if (Math.abs(state.velX) > 0.00005 || Math.abs(state.velY) > 0.00005) {
          state.rotationX += state.velX;
          state.rotationY += state.velY;
          state.velX *= 0.935;
          state.velY *= 0.935;
          // Clamp latitude rotation smoothly
          state.rotationX = Math.max(-1.25, Math.min(1.25, state.rotationX));
        } else if (isAutoRotating) {
          // Gentle slow spin when idle
          state.rotationY += 0.0016;
        }
      }

      // Update Globe Group Orientation
      globeGroup.rotation.x = state.rotationX;
      globeGroup.rotation.y = state.rotationY;

      // Render Scene
      renderer.render(scene, camera);

      // Project 42 Country Pins to Screen Coordinates
      const currentWidth = container.clientWidth || width;
      const currentHeight = container.clientHeight || height;
      const newPinPositions: ProjectedCountryPin[] = [];

      state.countryVectors.forEach((baseVec, countryId) => {
        const countryData = countryMap.get(countryId);
        if (!countryData) return;

        // Apply globe rotation to base vector
        tempVec.copy(baseVec).applyEuler(globeGroup.rotation);

        // Visibility / Occlusion check:
        // When tempVec.z > -8, the point is on the hemisphere facing the camera
        const isFacing = tempVec.z > -5;

        if (isFacing) {
          projVec.copy(tempVec).project(camera);

          const screenX = (projVec.x * 0.5 + 0.5) * currentWidth;
          const screenY = (-projVec.y * 0.5 + 0.5) * currentHeight;

          // Scale pin gently based on camera distance relative to default distance
          const refDist = state.defaultDistance || 380;
          const scale = Math.max(0.68, Math.min(1.2, (refDist * 0.95) / state.cameraDistance));

          newPinPositions.push({
            id: countryId,
            country: countryData,
            x: screenX,
            y: screenY,
            visible: true,
            scale,
          });
        }
      });

      setPinPositions(newPinPositions);

      state.animFrameId = requestAnimationFrame(animate);
    };

    threeState.current.animFrameId = requestAnimationFrame(animate);

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);

          const newFitted = calculateFittedDistance(newW, newH);
          threeState.current.defaultDistance = newFitted;
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      isMounted = false;
      cancelAnimationFrame(threeState.current.animFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      sphereGeom.dispose();
      atmosphereGeom.dispose();
      earthMaterial.dispose();
      atmosphereMat.dispose();
      earthTexture.dispose();
    };
  }, [isAutoRotating, countryMap]);

  // Prevent mobile pull-to-refresh on vertical drag
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventPullToRefresh = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.interactive-control') || target.closest('.country-pin')) return;
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchmove', preventPullToRefresh, { passive: false });
    return () => {
      container.removeEventListener('touchmove', preventPullToRefresh);
    };
  }, []);

  // Touch and Mouse Interaction Handlers for Zoom and Rotate
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag when interacting directly with the globe background/canvas
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-control') || target.closest('.country-pin')) return;

    if (e.cancelable) {
      e.preventDefault();
    }
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }

    const state = threeState.current;
    state.isDragging = true;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
    state.velX = 0;
    state.velY = 0;
    state.targetRotationX = null;
    state.targetRotationY = null;
    setIsAutoRotating(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = threeState.current;
    if (!state.isDragging) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    const deltaX = e.clientX - state.lastMouseX;
    const deltaY = e.clientY - state.lastMouseY;

    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;

    const sensitivity = 0.0048;
    state.rotationY += deltaX * sensitivity;
    state.rotationX += deltaY * sensitivity;

    // Clamp vertical tilt smoothly to avoid upside-down flip or jitter
    state.rotationX = Math.max(-1.25, Math.min(1.25, state.rotationX));

    // Filter velocity with exponential moving average for ultra-smooth drag inertia
    const currentVelX = deltaY * sensitivity * 0.45;
    const currentVelY = deltaX * sensitivity * 0.45;
    state.velX = state.velX * 0.35 + currentVelX * 0.65;
    state.velY = state.velY * 0.35 + currentVelY * 0.65;
  };

  const handlePointerUp = (e?: React.PointerEvent) => {
    if (e) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // safe fallback
      }
    }
    threeState.current.isDragging = false;
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const state = threeState.current;
    const minDistance = 175;
    const maxDistance = Math.max(680, (state.defaultDistance || 380) * 1.6);
    const zoomStep = e.deltaY > 0 ? 40 : -40;
    state.targetCameraDistance = Math.max(minDistance, Math.min(maxDistance, state.targetCameraDistance + zoomStep));
    setIsAutoRotating(false);
  };

  // Touch Pinch Zoom
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      if (e.cancelable) e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const state = threeState.current;
      if (state.lastTouchDistance !== null && state.lastTouchDistance > 0) {
        const minDistance = 175;
        const maxDistance = Math.max(680, (state.defaultDistance || 380) * 1.6);
        const delta = state.lastTouchDistance - distance;
        state.targetCameraDistance = Math.max(minDistance, Math.min(maxDistance, state.targetCameraDistance + delta * 0.75));
      }
      state.lastTouchDistance = distance;
      setIsAutoRotating(false);
    }
  };

  const handleTouchEnd = () => {
    threeState.current.lastTouchDistance = null;
  };

  // Explicit Button Zoom Controls
  const handleZoomIn = () => {
    const state = threeState.current;
    const minDistance = 175;
    state.targetCameraDistance = Math.max(minDistance, state.targetCameraDistance - 55);
    setIsAutoRotating(false);
  };

  const handleZoomOut = () => {
    const state = threeState.current;
    const maxDistance = Math.max(680, (state.defaultDistance || 380) * 1.6);
    state.targetCameraDistance = Math.min(maxDistance, state.targetCameraDistance + 55);
    setIsAutoRotating(false);
  };

  const handleResetView = () => {
    const state = threeState.current;
    state.targetCameraDistance = state.defaultDistance || 380;
    rotateToCountry(activeCountry.id, false);
  };

  // Selecting Country Handlers
  const lastPinTapRef = useRef<{ id: string; time: number } | null>(null);

  const handlePinDoubleClick = useCallback(
    (country: CountryCurrency) => {
      setActiveCountry(country);
      onSelectCountryAndLaunch(country);
    },
    [onSelectCountryAndLaunch]
  );

  const handlePinClick = useCallback(
    (country: CountryCurrency) => {
      const now = Date.now();
      const lastTap = lastPinTapRef.current;

      // Detect double click/tap (within 400ms on same country pin)
      if (lastTap && lastTap.id === country.id && now - lastTap.time < 400) {
        lastPinTapRef.current = null;
        handlePinDoubleClick(country);
        return;
      }

      lastPinTapRef.current = { id: country.id, time: now };
      setActiveCountry(country);
      rotateToCountry(country.id, true);
    },
    [handlePinDoubleClick, rotateToCountry]
  );

  const handleSelectFromList = (country: CountryCurrency, launchImmediately = false) => {
    setActiveCountry(country);
    rotateToCountry(country.id, true);
    if (launchImmediately) {
      onSelectCountryAndLaunch(country);
    }
  };

  return (
    <div
      id="earth-globe-landing-viewport"
      className="relative w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-[#05050a] overflow-hidden select-none flex flex-col justify-between touch-none overscroll-none"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Background: Pure dark space with ONLY tiny blinking stars */}
      <div id="cosmos-tiny-stars-layer" className="absolute inset-0 pointer-events-none z-0">
        {tinyStars.map((star) => (
          <div
            key={star.id}
            className={`absolute rounded-full bg-white ${star.animClass}`}
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: star.delay,
              boxShadow: star.size > 1.5 ? '0 0 2px rgba(255,255,255,0.9)' : 'none',
            }}
          />
        ))}
      </div>

      {/* 2. Top Header Bar: Global Currency Ball with digital Earth symbol */}
      <header className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-30 flex items-center gap-3 pointer-events-auto">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cyan-950/85 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950/50 backdrop-blur-md shrink-0">
          <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300 animate-spin-slow" />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md flex items-center">
          <span>Global Currency Ball</span>
        </h1>
      </header>

      {/* 3. Vertical Zoom & Orientation Control Panel at Top Right */}
      <div
        id="globe-controls-vertical-panel"
        className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 flex flex-col gap-1.5 bg-stone-950/85 border border-stone-800/90 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md pointer-events-auto"
      >
        <button
          id="btn-globe-zoom-in"
          onClick={handleZoomIn}
          className="interactive-control w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-white flex items-center justify-center border border-stone-700/80 transition active:scale-95 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          id="btn-globe-zoom-out"
          onClick={handleZoomOut}
          className="interactive-control w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-white flex items-center justify-center border border-stone-700/80 transition active:scale-95 cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          id="btn-globe-reset"
          onClick={handleResetView}
          className="interactive-control w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-white flex items-center justify-center border border-stone-700/80 transition active:scale-95 cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          id="btn-globe-toggle-autorotate"
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`interactive-control w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition active:scale-95 cursor-pointer ${
            isAutoRotating
              ? 'bg-emerald-950/90 text-emerald-400 border-emerald-600'
              : 'bg-stone-900/90 text-stone-400 hover:text-stone-200 border-stone-700'
          }`}
          title={isAutoRotating ? 'Pause auto-rotation' : 'Play auto-rotation'}
        >
          {isAutoRotating ? (
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>
      </div>

      {/* 3. Three.js Canvas Container & Country Pins */}
      <div
        ref={containerRef}
        id="earth-globe-canvas-wrapper"
        className="absolute inset-0 z-10 w-full h-full cursor-grab active:cursor-grabbing touch-none overscroll-none"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none overscroll-none"
          style={{ touchAction: 'none', overscrollBehavior: 'none' }}
        />

        {/* 4. Overlay: Pinpoint & Currency Symbols for all supported countries */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {pinPositions.map((pin) => {
            const isSelected = pin.id === activeCountry.id;
            const isHovered = pin.id === hoveredCountryId;

            return (
              <div
                key={pin.id}
                id={`globe-pin-${pin.id}`}
                className="country-pin absolute pointer-events-auto transition-transform duration-75 cursor-pointer group"
                style={{
                  left: `${pin.x}px`,
                  top: `${pin.y}px`,
                  transform: `translate(-50%, -50%) scale(${pin.scale})`,
                  zIndex: isSelected ? 40 : isHovered ? 35 : 20,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePinClick(pin.country);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handlePinDoubleClick(pin.country);
                }}
                onMouseEnter={() => setHoveredCountryId(pin.id)}
                onMouseLeave={() => setHoveredCountryId(null)}
              >
                {/* Visual Pinpoint and Currency Symbol Badge (Very small, fits country map) */}
                <div className="relative flex flex-col items-center">
                  <div
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handlePinDoubleClick(pin.country);
                    }}
                    className={`relative flex items-center justify-center rounded-full transition-all duration-200 ${
                      isSelected
                        ? 'w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 text-stone-950 font-black shadow-[0_0_14px_rgba(52,211,153,0.9)] ring-2 ring-white scale-110'
                        : isHovered
                        ? 'w-6 h-6 sm:w-7 sm:h-7 bg-stone-900/95 text-amber-300 font-bold border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] scale-105'
                        : 'w-5 h-5 sm:w-5.5 sm:h-5.5 bg-stone-950/85 text-amber-300/95 font-bold border border-amber-400/80 hover:border-white shadow-md'
                    }`}
                    title={`${pin.country.flag} ${pin.country.countryName} (${pin.country.currencyCode}) • Double-click to count cash`}
                  >
                    {/* Very small currency symbol */}
                    <span className="text-[10px] sm:text-[11px] leading-none tracking-tight font-mono select-none">
                      {pin.country.currencySymbol}
                    </span>

                    {/* Active pulsating beacon ring */}
                    {isSelected && (
                      <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none" />
                    )}
                  </div>

                  {/* Tiny pinpoint anchor dot */}
                  <div
                    className={`w-1 h-1 rounded-full mt-0.5 ${
                      isSelected ? 'bg-emerald-300 ring-1 ring-white' : 'bg-amber-400/80'
                    }`}
                  />

                  {/* Tooltip on Hover or Selection */}
                  {(isHovered || (isSelected && pin.scale > 0.85)) && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinDoubleClick(pin.country);
                      }}
                      className={`absolute bottom-full mb-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap shadow-xl border pointer-events-auto cursor-pointer transition-opacity ${
                        isSelected
                          ? 'bg-emerald-950/95 text-white border-emerald-500/80 hover:bg-emerald-900'
                          : 'bg-stone-950/90 text-stone-200 border-stone-700 hover:border-amber-400'
                      }`}
                      title="Double-click currency symbol or click here to count cash"
                    >
                      <span className="mr-1">{pin.country.flag}</span>
                      <span>{pin.country.countryName}</span>
                      <span className="ml-1 text-emerald-400 font-mono">({pin.country.currencyCode})</span>
                      <span className="ml-1.5 text-[9px] text-emerald-300/90 font-normal hidden sm:inline">
                        • Double-click to count
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Bottom Controls: "Select from list" just above home page icon */}
      <footer className="absolute bottom-2.5 sm:bottom-3 left-0 right-0 z-30 pointer-events-none px-3 sm:px-4">
        <div className="max-w-xl mx-auto flex items-center justify-between pointer-events-auto">
          {/* Positioned directly above the Home page icon */}
          <button
            id="btn-select-from-list"
            onClick={() => setIsListModalOpen(true)}
            className="interactive-control px-3.5 py-2 sm:py-2.5 rounded-xl bg-stone-900/95 hover:bg-stone-800 text-stone-100 hover:text-white text-xs sm:text-sm font-bold flex items-center gap-2 border border-stone-700/80 shadow-2xl hover:border-emerald-500/80 transition-all cursor-pointer active:scale-95 backdrop-blur-md"
            title="Open popup with list of all supported countries"
          >
            <List className="w-4 h-4 text-emerald-400" />
            <span>Select from list</span>
          </button>

          {hasExistingCounts && onResumeCalculator && (
            <button
              id="btn-resume-cash-counter"
              onClick={onResumeCalculator}
              className="interactive-control flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg transition active:scale-95 cursor-pointer backdrop-blur-md border border-emerald-500/50"
              title="Resume active cash count"
            >
              <span>Resume Count</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </footer>

      {/* 7. Pop-up List Modal of all Countries */}
      <CountryListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        selectedCountryId={activeCountry.id}
        onSelectCountry={handleSelectFromList}
      />
    </div>
  );
};
