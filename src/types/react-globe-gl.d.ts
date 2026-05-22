import type { MutableRefObject } from "react";
import type * as THREE from "three";

declare module "react-globe.gl" {
  export interface GlobeInstance {
    scene(): THREE.Scene;
    camera(): THREE.Camera;
    renderer(): THREE.WebGLRenderer;
    pointOfView(
      pov?: { lat?: number; lng?: number; altitude?: number },
      transitionDuration?: number
    ): { lat: number; lng: number; altitude: number };
    controls(): {
      autoRotate: boolean;
      autoRotateSpeed: number;
    };
  }

  export interface GlobeProps {
    ref?: MutableRefObject<GlobeInstance | null>;
    width?: number;
    height?: number;
    backgroundColor?: string;
    globeImageUrl?: string;
    atmosphereColor?: string;
    atmosphereAltitude?: number;
    pointsData?: object[];
    pointLat?: string | ((d: object) => number);
    pointLng?: string | ((d: object) => number);
    pointAltitude?: string | number | ((d: object) => number);
    pointColor?: string | ((d: object) => string);
    pointRadius?: string | number | ((d: object) => number);
    pointLabel?: string | ((d: object) => string);
    onPointClick?: (point: object, event: MouseEvent) => void;
    onPointHover?: (point: object | null, prevPoint: object | null) => void;
    onGlobeReady?: () => void;
    animateIn?: boolean;
    enablePointerInteraction?: boolean;
  }

  export default class Globe extends React.Component<GlobeProps> {}
}
