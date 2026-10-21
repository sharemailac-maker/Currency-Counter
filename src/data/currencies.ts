import { CountryCurrency } from '../types';
import { COUNTRIES_ASIA } from './countriesAsia';
import { COUNTRIES_MIDDLE_EAST } from './countriesMiddleEast';
import { COUNTRIES_EUROPE } from './countriesEurope';
import { COUNTRIES_AMERICAS } from './countriesAmericas';
import { COUNTRIES_AFRICA_OCEANIA } from './countriesAfricaOceania';

// Combined master list of all world countries across all continents, strictly sorted alphabetically
export const COUNTRIES: CountryCurrency[] = [
  ...COUNTRIES_ASIA,
  ...COUNTRIES_MIDDLE_EAST,
  ...COUNTRIES_EUROPE,
  ...COUNTRIES_AMERICAS,
  ...COUNTRIES_AFRICA_OCEANIA,
].sort((a, b) => a.countryName.localeCompare(b.countryName));

// Helper to get countries by region
export const REGIONS = ['All', 'Asia', 'Middle East', 'Europe', 'Americas', 'Africa', 'Oceania'] as const;
export type RegionName = (typeof REGIONS)[number];

export function getCountriesByRegion(region: RegionName): CountryCurrency[] {
  if (region === 'All') return COUNTRIES;
  return COUNTRIES.filter((c) => c.region === region).sort((a, b) =>
    a.countryName.localeCompare(b.countryName)
  );
}
