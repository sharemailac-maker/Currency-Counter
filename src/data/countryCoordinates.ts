// Accurate geographical center coordinates (latitude and longitude) for supported countries

export interface CountryGeoCoord {
  id: string;
  lat: number;
  lng: number;
}

export const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Asia
  IN: { lat: 21.0, lng: 78.5 },      // Bharat (India)
  PK: { lat: 30.3, lng: 69.3 },      // Pakistan
  BD: { lat: 23.7, lng: 90.4 },      // Bangladesh
  NP: { lat: 28.4, lng: 84.1 },      // Nepal
  LK: { lat: 7.9, lng: 80.8 },       // Sri Lanka
  CN: { lat: 35.8, lng: 104.2 },     // China
  JP: { lat: 36.2, lng: 138.3 },     // Japan
  KR: { lat: 36.5, lng: 127.8 },     // South Korea
  SG: { lat: 1.35, lng: 103.8 },     // Singapore
  MY: { lat: 4.2, lng: 101.9 },      // Malaysia
  ID: { lat: -2.5, lng: 118.0 },     // Indonesia
  TH: { lat: 15.5, lng: 101.0 },     // Thailand
  VN: { lat: 14.1, lng: 108.3 },     // Vietnam
  PH: { lat: 12.9, lng: 121.8 },     // Philippines
  HK: { lat: 22.3, lng: 114.2 },     // Hong Kong

  // Middle East
  AE: { lat: 23.8, lng: 54.3 },      // United Arab Emirates
  SA: { lat: 24.0, lng: 45.0 },      // Saudi Arabia
  QA: { lat: 25.3, lng: 51.2 },      // Qatar
  OM: { lat: 21.5, lng: 57.0 },      // Oman
  KW: { lat: 29.3, lng: 47.5 },      // Kuwait
  BH: { lat: 26.1, lng: 50.5 },      // Bahrain
  IL: { lat: 31.5, lng: 34.8 },      // Israel

  // Europe & Eurasia
  GB: { lat: 54.5, lng: -2.5 },      // United Kingdom
  EU: { lat: 49.5, lng: 9.5 },       // Eurozone (Central Europe / Germany/France)
  CH: { lat: 46.8, lng: 8.2 },       // Switzerland
  NO: { lat: 61.5, lng: 8.5 },       // Norway
  SE: { lat: 62.0, lng: 15.0 },      // Sweden
  DK: { lat: 56.0, lng: 10.0 },      // Denmark
  PL: { lat: 52.0, lng: 19.5 },      // Poland
  RU: { lat: 60.0, lng: 85.0 },      // Russia
  TR: { lat: 39.0, lng: 35.0 },      // Turkey

  // Americas
  US: { lat: 38.5, lng: -98.0 },     // United States
  CA: { lat: 56.0, lng: -106.0 },    // Canada
  MX: { lat: 23.5, lng: -102.5 },    // Mexico
  BR: { lat: -14.0, lng: -52.0 },    // Brazil
  AR: { lat: -34.5, lng: -64.0 },    // Argentina
  CO: { lat: 4.5, lng: -73.5 },      // Colombia

  // Africa & Oceania
  AU: { lat: -25.0, lng: 134.0 },    // Australia
  NZ: { lat: -41.0, lng: 174.0 },    // New Zealand
  ZA: { lat: -29.0, lng: 24.5 },     // South Africa
  EG: { lat: 26.5, lng: 30.5 },      // Egypt
  NG: { lat: 9.5, lng: 8.0 },        // Nigeria
  KE: { lat: 0.5, lng: 38.0 },       // Kenya
  SN: { lat: 14.5, lng: -14.5 },     // Senegal (West Africa - XOF)
  CI: { lat: 7.5, lng: -5.5 },       // Côte d'Ivoire (West Africa - XOF)
  CM: { lat: 5.5, lng: 12.5 },       // Cameroon (Central Africa - XAF)
  GA: { lat: -0.8, lng: 11.6 },      // Gabon (Central Africa - XAF)
};

/**
 * Converts Geographic Latitude and Longitude to 3D Cartesian coordinates on a sphere of given radius.
 * Aligns accurately with standard Equirectangular Three.js SphereGeometry UV mapping.
 */
export function latLngToCartesian(lat: number, lng: number, radius: number): { x: number; y: number; z: number } {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return { x, y, z };
}

/**
 * Calculates the target Euler rotations (rotationX, rotationY) to rotate the 3D globe
 * such that the country at (lat, lng) points directly toward the camera (+Z).
 */
export function countryToTargetRotation(lat: number, lng: number): { rotX: number; rotY: number } {
  // Pitch to bring latitude to equator
  const rotX = (lat * Math.PI) / 180;
  // Yaw to bring longitude to face +Z
  // When rotation.y is 0, lng = -90 is at +Z.
  // To bring lng to +Z: rotY = -((lng + 90) * Math.PI / 180)
  const rotY = -((lng + 90) * Math.PI) / 180;
  return { rotX, rotY };
}
