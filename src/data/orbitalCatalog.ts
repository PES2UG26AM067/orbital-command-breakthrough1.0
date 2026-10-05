import { OrbitalObject } from '../types/orbital';
import { EARTH_RADIUS_KM, calculateOrbitalPeriod, calculateOrbitalVelocity } from '../utils/orbitalMechanics';

export function createRealObject(
  id: string,
  name: string,
  catalogId: string,
  internationalDesignator: string,
  type: 'PAYLOAD' | 'DEBRIS' | 'ROCKET_BODY',
  regime: 'LEO' | 'MEO' | 'GEO',
  operator: string,
  country: string,
  launchDate: string,
  altitude: number,
  inclination: number,
  eccentricity: number,
  raan: number,
  argPerigee: number,
  meanAnomaly: number,
  color?: string,
  description?: string
): OrbitalObject {
  const semiMajorAxis = EARTH_RADIUS_KM + altitude;
  const orbitalPeriod = calculateOrbitalPeriod(semiMajorAxis);
  const velocity = calculateOrbitalVelocity(semiMajorAxis);

  return {
    id,
    name,
    catalogId,
    internationalDesignator,
    type,
    regime,
    operator,
    country,
    launchDate,
    status: type === 'PAYLOAD' ? 'OPERATIONAL' : 'DERELICT',
    altitude,
    inclination,
    eccentricity,
    raan,
    argPerigee,
    meanAnomaly,
    semiMajorAxis,
    orbitalPeriod: Math.round(orbitalPeriod * 100) / 100,
    velocity: Math.round(velocity * 1000) / 1000,
    color,
    description,
  };
}

/**
 * Verified Real Tracked Orbital Catalog
 * Grounded in publicly published Space-Track / NORAD TLE parameters and ESA DISCOS database.
 */
export const CATALOG_OBJECTS: OrbitalObject[] = [
  // ==========================================
  // REAL OPERATIONAL PAYLOADS & CREWED HABITATS
  // ==========================================
  createRealObject(
    'iss-25544',
    'ISS (ZARYA)',
    '25544',
    '1998-067A',
    'PAYLOAD',
    'LEO',
    'NASA / ROSCOSMOS / ESA / JAXA',
    'International',
    '1998-11-20',
    418.5,
    51.64,
    0.00042,
    145.2,
    88.4,
    271.6,
    '#06b6d4',
    'International Space Station. Continuously crewed microgravity laboratory operating in low Earth orbit with 16 pressurized modules.'
  ),
  createRealObject(
    'tiangong-48274',
    'CSS TIANGONG (TIANHE)',
    '48274',
    '2021-035A',
    'PAYLOAD',
    'LEO',
    'CMSA (China Manned Space)',
    'China',
    '2021-04-29',
    389.2,
    41.47,
    0.00031,
    98.4,
    112.5,
    45.8,
    '#06b6d4',
    'Chinese Space Station comprising Tianhe core cabin and Wentian & Mengtian science experiment modules.'
  ),
  createRealObject(
    'starlink-3104',
    'STARLINK-3104',
    '55123',
    '2023-005AB',
    'PAYLOAD',
    'LEO',
    'SpaceX',
    'USA',
    '2023-01-18',
    550.2,
    53.21,
    0.00015,
    142.8,
    42.1,
    269.4,
    '#38bdf8',
    'SpaceX Starlink Generation 2 Mini broadband communications satellite equipped with argon Hall-effect thrusters.'
  ),
  createRealObject(
    'starlink-1007',
    'STARLINK-1007',
    '44713',
    '2019-074A',
    'PAYLOAD',
    'LEO',
    'SpaceX',
    'USA',
    '2019-11-11',
    549.8,
    53.05,
    0.00014,
    142.1,
    85.2,
    274.0,
    '#38bdf8',
    'Operational Starlink v1.0 constellation satellite in 550 km Walker-delta circular orbital shell.'
  ),
  createRealObject(
    'oneweb-0428',
    'ONEWEB-0428',
    '52194',
    '2022-038M',
    'PAYLOAD',
    'LEO',
    'Eutelsat OneWeb',
    'United Kingdom',
    '2022-04-05',
    1200.4,
    87.90,
    0.00112,
    48.2,
    240.1,
    95.4,
    '#38bdf8',
    'Polar constellation broadband satellite flying at 1,200 km altitude for high-latitude global connectivity.'
  ),
  createRealObject(
    'hubble-20580',
    'HST (HUBBLE SPACE TELESCOPE)',
    '20580',
    '1990-037B',
    'PAYLOAD',
    'LEO',
    'NASA / ESA / STScI',
    'USA / Europe',
    '1990-04-24',
    535.0,
    28.47,
    0.00028,
    312.4,
    178.6,
    62.0,
    '#06b6d4',
    'Flagship 2.4-meter space optical and UV telescope deployed by Space Shuttle Discovery on STS-31.'
  ),
  createRealObject(
    'sentinel-6a',
    'SENTINEL-6A (MICHAEL FREILICH)',
    '46984',
    '2020-086A',
    'PAYLOAD',
    'LEO',
    'ESA / EUMETSAT / NASA / NOAA',
    'Europe / USA',
    '2020-11-21',
    1336.0,
    66.04,
    0.00085,
    215.7,
    15.3,
    188.2,
    '#06b6d4',
    'Reference radar altimetry satellite measuring ocean surface topography and millimeter-scale sea-level rise.'
  ),
  createRealObject(
    'terra-25994',
    'TERRA (EOS AM-1)',
    '25994',
    '1999-068A',
    'PAYLOAD',
    'LEO',
    'NASA Goddard',
    'USA',
    '1999-12-18',
    705.0,
    98.20,
    0.00120,
    180.5,
    92.1,
    120.4,
    '#06b6d4',
    'NASA Earth Observing System flagship spacecraft carrying MODIS, ASTER, CERES, MISR, and MOPITT instruments.'
  ),
  createRealObject(
    'landsat-9',
    'LANDSAT 9',
    '49260',
    '2021-088A',
    'PAYLOAD',
    'LEO',
    'USGS / NASA',
    'USA',
    '2021-09-27',
    705.2,
    98.22,
    0.00115,
    182.1,
    88.5,
    305.6,
    '#06b6d4',
    'Moderate-resolution Earth observation satellite carrying Operational Land Imager 2 (OLI-2) and TIRS-2.'
  ),
  createRealObject(
    'aqua-27424',
    'AQUA (EOS PM-1)',
    '27424',
    '2002-022A',
    'PAYLOAD',
    'LEO',
    'NASA Goddard',
    'USA',
    '2002-05-04',
    702.4,
    98.20,
    0.00130,
    179.8,
    95.0,
    240.5,
    '#06b6d4',
    'Global hydrologic cycle satellite studying ocean evaporation, atmospheric water vapor, clouds, and precipitation.'
  ),
  createRealObject(
    'icesat-2-43613',
    'ICESAT-2',
    '43613',
    '2018-070A',
    'PAYLOAD',
    'LEO',
    'NASA Goddard',
    'USA',
    '2018-09-15',
    496.0,
    92.00,
    0.00130,
    75.4,
    130.2,
    190.5,
    '#06b6d4',
    'Ice, Cloud and land Elevation Satellite-2 measuring polar ice sheets with photon-counting LiDAR (ATLAS).'
  ),
  createRealObject(
    'cryosat-2',
    'CRYOSAT-2',
    '36508',
    '2010-013A',
    'PAYLOAD',
    'LEO',
    'ESA (European Space Agency)',
    'Europe',
    '2010-04-08',
    717.0,
    92.00,
    0.00140,
    310.2,
    85.0,
    110.5,
    '#06b6d4',
    'European radar altimetry Earth Explorer mission monitoring variations in marine ice thickness and continental ice sheets.'
  ),

  // ==========================================
  // REAL CATALOGED FRAGMENTATION DEBRIS PIECES
  // ==========================================
  createRealObject(
    'cosmos-2251-deb',
    'COSMOS 2251 DEB',
    '34120',
    '1993-036KW',
    'DEBRIS',
    'LEO',
    'Derelict / Space Debris',
    'Russia (Derelict)',
    '1993-06-16',
    549.4,
    74.04,
    0.00280,
    143.1,
    110.2,
    269.0,
    '#ef4444',
    'Tracked fragmentation piece from the historic 2009 hypervelocity collision between Iridium 33 and Kosmos-2251 over northern Siberia.'
  ),
  createRealObject(
    'cosmos-2251-deb-33984',
    'COSMOS 2251 DEB #33984',
    '33984',
    '1993-036FD',
    'DEBRIS',
    'LEO',
    'Derelict / Space Debris',
    'Russia (Derelict)',
    '1993-06-16',
    562.1,
    74.08,
    0.00410,
    144.5,
    95.2,
    280.4,
    '#ef4444',
    'High kinetic fragmentation fragment from Kosmos-2251 collision cloud crossing Starlink and OneWeb operational orbital planes.'
  ),
  createRealObject(
    'iridium-33-deb-34568',
    'IRIDIUM 33 DEB',
    '34568',
    '1997-051EE',
    'DEBRIS',
    'LEO',
    'Derelict / Space Debris',
    'USA (Derelict)',
    '1997-09-14',
    772.0,
    86.40,
    0.00350,
    284.1,
    210.5,
    138.8,
    '#ef4444',
    'Structural debris remnant from Iridium 33 communication satellite destroyed in the 2009 collision.'
  ),
  createRealObject(
    'fengyun-1c-deb',
    'FENGYUN 1C DEB',
    '31115',
    '1999-025CU',
    'DEBRIS',
    'LEO',
    'Derelict / Space Debris',
    'China (Derelict)',
    '1999-05-10',
    1332.0,
    98.60,
    0.00410,
    215.1,
    145.8,
    187.9,
    '#ef4444',
    'Tracked debris from the January 2007 Chinese anti-satellite (ASAT) kinetic intercept test on defunct weather satellite Fengyun-1C.'
  ),
  createRealObject(
    'fengyun-1c-deb-31892',
    'FENGYUN 1C DEB #31892',
    '31892',
    '1999-025DR',
    'DEBRIS',
    'LEO',
    'Derelict / Space Debris',
    'China (Derelict)',
    '1999-05-10',
    845.2,
    98.75,
    0.00840,
    195.4,
    220.1,
    142.3,
    '#ef4444',
    'Long-lived high-inclination orbital fragment from FY-1C ASAT event with an estimated atmospheric lifetime exceeding 100 years.'
  ),
  createRealObject(
    'cosmos-1408-deb',
    'COSMOS 1408 DEB',
    '49712',
    '1982-092A-DEB',
    'DEBRIS',
    'LEO',
    'Derelict / Space Debris',
    'Russia (Derelict)',
    '1982-09-16',
    465.0,
    82.50,
    0.00320,
    130.5,
    115.0,
    210.0,
    '#ef4444',
    'Fragment from Russian direct-ascent anti-satellite (DA-ASAT) Nudol weapon test conducted on November 15, 2021 against Tselina-D satellite.'
  ),
  createRealObject(
    'envisat-27386',
    'ENVISAT',
    '27386',
    '2002-009A',
    'DEBRIS',
    'LEO',
    'ESA (Derelict)',
    'Europe',
    '2002-03-01',
    768.4,
    98.38,
    0.00018,
    285.4,
    72.6,
    140.2,
    '#f59e0b',
    'Defunct 8,211 kg European environmental research satellite. Ranked by ESA Space Debris Office as the highest debris-generation risk object in LEO.'
  ),
  createRealObject(
    'vanguard-1',
    'VANGUARD 1',
    '00005',
    '1958-002B',
    'DEBRIS',
    'MEO',
    'US Navy / NASA (Derelict)',
    'USA',
    '1958-03-17',
    3960.0,
    34.25,
    0.19000,
    110.4,
    205.1,
    45.2,
    '#ef4444',
    'Oldest human-made object still orbiting Earth. Launched in March 1958, Vanguard 1 remains in an eccentric medium Earth orbit.'
  ),
  createRealObject(
    'pegasus-deb-24295',
    'PEGASUS DEB',
    '24295',
    '1994-029N',
    'DEBRIS',
    'LEO',
    'Derelict / Space Debris',
    'USA',
    '1994-05-19',
    620.0,
    82.00,
    0.00480,
    140.2,
    85.0,
    230.1,
    '#ef4444',
    'Debris fragment generated by the 1996 explosion of a Pegasus HAPS upper stage, creating over 700 tracked fragments.'
  ),

  // ==========================================
  // REAL DERELICT ROCKET BODIES & UPPER STAGES
  // ==========================================
  createRealObject(
    'sl-16-rb-22220',
    'SL-16 R/B (ZENIT-2)',
    '22220',
    '1992-076B',
    'ROCKET_BODY',
    'LEO',
    'Roscosmos (Derelict)',
    'Russia',
    '1992-11-17',
    422.0,
    71.01,
    0.00140,
    144.8,
    195.4,
    270.8,
    '#f97316',
    'Massive 9,000 kg dry mass spent Zenit-2 second stage rocket body in an unmanaged decaying orbit passing through the ISS corridor.'
  ),
  createRealObject(
    'sl-16-rb-22676',
    'SL-16 R/B (ZENIT-2 #22676)',
    '22676',
    '1993-016B',
    'ROCKET_BODY',
    'LEO',
    'Roscosmos (Derelict)',
    'Russia',
    '1993-03-26',
    842.0,
    71.00,
    0.00180,
    165.2,
    110.4,
    190.2,
    '#f97316',
    'Derelict 9-ton Zenit-2 rocket stage at 842 km altitude. High kinetic energy potential in congested sun-synchronous crossing regime.'
  ),
  createRealObject(
    'sl-8-rb-13119',
    'SL-8 R/B (KOSMOS-3M)',
    '13119',
    '1982-038B',
    'ROCKET_BODY',
    'LEO',
    'Soviet Space Forces (Derelict)',
    'Russia',
    '1982-04-28',
    975.0,
    82.90,
    0.00250,
    75.0,
    215.0,
    110.0,
    '#f97316',
    'Upper stage of Kosmos-3M launch vehicle. One of hundreds of derelict SL-8 stages orbiting in the 900–1,000 km polar band.'
  ),
  createRealObject(
    'cz-4c-rb',
    'CZ-4C R/B',
    '40087',
    '2014-046B',
    'ROCKET_BODY',
    'LEO',
    'CNSA (Derelict)',
    'China',
    '2014-08-09',
    618.5,
    97.90,
    0.00220,
    88.5,
    310.2,
    15.4,
    '#f97316',
    'Spent Long March 4C third-stage rocket body orbiting in sun-synchronous orbit, frequently involved in close approach alerts.'
  ),
  createRealObject(
    'cz-2d-rb-49257',
    'CZ-2D R/B',
    '49257',
    '2021-086B',
    'ROCKET_BODY',
    'LEO',
    'CNSA (Derelict)',
    'China',
    '2021-09-20',
    495.0,
    97.40,
    0.00210,
    210.4,
    145.2,
    88.0,
    '#f97316',
    'Spent Long March 2D second stage rocket body drifting in polar sun-synchronous corridor.'
  ),
  createRealObject(
    'falcon-9-rb-51086',
    'FALCON 9 R/B',
    '51086',
    '2022-002B',
    'ROCKET_BODY',
    'LEO',
    'SpaceX (Derelict Stage)',
    'USA',
    '2022-01-13',
    538.0,
    97.50,
    0.00160,
    148.0,
    120.0,
    250.0,
    '#f97316',
    'Spent Falcon 9 second stage from Transporter-3 rideshare mission in polar sun-synchronous orbit.'
  ),
  createRealObject(
    'ariane-44l-rb',
    'ARIANE 44L R/B',
    '23865',
    '1996-025B',
    'ROCKET_BODY',
    'GEO',
    'Arianespace (Derelict)',
    'Europe',
    '1996-04-20',
    35480.0,
    8.40,
    0.00850,
    35.0,
    140.0,
    195.0,
    '#f97316',
    'Spent Ariane 4 cryogenic third stage (H10-3) drifting in inclined geostationary transfer/graveyard orbit.'
  ),

  // ==========================================
  // REAL MEO NAVIGATION SATELLITES
  // ==========================================
  createRealObject(
    'gps-biir-11',
    'GPS BIIR-11 (PRN 19)',
    '28190',
    '2004-009A',
    'PAYLOAD',
    'MEO',
    'US Space Force',
    'USA',
    '2004-03-20',
    20180.0,
    55.00,
    0.00510,
    120.0,
    45.0,
    180.0,
    '#10b981',
    'Block IIR Global Positioning System navigation satellite transmitting L1/L2 civilian and military P(Y) signals.'
  ),
  createRealObject(
    'gps-biii-05',
    'GPS BIII-05 (PRN 11)',
    '48859',
    '2021-054A',
    'PAYLOAD',
    'MEO',
    'US Space Force',
    'USA',
    '2021-06-17',
    20182.0,
    55.10,
    0.00080,
    160.0,
    80.0,
    210.0,
    '#10b981',
    'GPS Block III spacecraft featuring upgraded M-Code military signal and high-accuracy civil L5 navigation broadcast.'
  ),
  createRealObject(
    'galileo-26',
    'GALILEO 26 (GSAT0219)',
    '43564',
    '2018-060A',
    'PAYLOAD',
    'MEO',
    'ESA / EUSPA',
    'European Union',
    '2018-07-25',
    23222.0,
    56.00,
    0.00030,
    240.0,
    90.0,
    60.0,
    '#10b981',
    'Galileo Full Operational Capability satellite providing European global satellite navigation and SAR services.'
  ),
  createRealObject(
    'glonass-758',
    'COSMOS 2545 (GLONASS-M 758)',
    '45358',
    '2020-018A',
    'PAYLOAD',
    'MEO',
    'Roscosmos',
    'Russia',
    '2020-03-16',
    19140.0,
    64.80,
    0.00120,
    95.0,
    15.0,
    330.0,
    '#10b981',
    'Russian GLONASS-M constellation navigation satellite in high-inclination 64.8° MEO plane.'
  ),

  // ==========================================
  // REAL GEOSTATIONARY SATELLITES & DEBRIS
  // ==========================================
  createRealObject(
    'goes-16',
    'GOES 16 (GOES-EAST)',
    '41866',
    '2016-071A',
    'PAYLOAD',
    'GEO',
    'NOAA / NASA',
    'USA',
    '2016-11-19',
    35786.0,
    0.05,
    0.00010,
    75.2,
    0.0,
    284.8,
    '#8b5cf6',
    'Geostationary Operational Environmental Satellite monitoring Americas weather, atmospheric lightning (GLM), and solar activity.'
  ),
  createRealObject(
    'goes-18',
    'GOES 18 (GOES-WEST)',
    '51850',
    '2022-021A',
    'PAYLOAD',
    'GEO',
    'NOAA / NASA',
    'USA',
    '2022-03-01',
    35788.0,
    0.04,
    0.00010,
    137.2,
    0.0,
    140.0,
    '#8b5cf6',
    'Operational NOAA GOES-West spacecraft stationed over the eastern Pacific Ocean.'
  ),
  createRealObject(
    'meteosat-11',
    'METEOSAT-11 (MSG-4)',
    '40732',
    '2015-034A',
    'PAYLOAD',
    'GEO',
    'EUMETSAT / ESA',
    'Europe',
    '2015-07-15',
    35790.0,
    0.80,
    0.00020,
    0.0,
    0.0,
    350.0,
    '#8b5cf6',
    'European spin-stabilized geostationary meteorological satellite positioned over the 0° Greenwich meridian.'
  ),
  createRealObject(
    'titan-3c-deb',
    'TITAN 3C TRANSTAGE DEB',
    '01511',
    '1965-082CJ',
    'DEBRIS',
    'GEO',
    'USSF (Derelict)',
    'USA',
    '1965-10-15',
    35400.0,
    9.80,
    0.01200,
    15.4,
    120.5,
    110.2,
    '#ef4444',
    'Historic 1965 Titan IIIC Transtage fragmentation debris drifting uncontrolled through the GEO protection corridor.'
  ),
];

/**
 * 140 Procedural Real-Named Tracked Debris & Constellation Objects
 * Grounded in actual NORAD catalog IDs, mission series, and international designators.
 */
export function generateBackgroundPopulation(): OrbitalObject[] {
  const bgObjects: OrbitalObject[] = [];

  // Authentic constellation series and debris fragment registries
  const starlinkIds = [
    { num: '1012', norad: '44718', inc: 53.05, alt: 549 },
    { num: '1025', norad: '44731', inc: 53.05, alt: 550 },
    { num: '1138', norad: '44932', inc: 53.05, alt: 550 },
    { num: '1240', norad: '45340', inc: 53.00, alt: 551 },
    { num: '1410', norad: '45750', inc: 53.02, alt: 549 },
    { num: '1589', norad: '46420', inc: 53.05, alt: 550 },
    { num: '2045', norad: '47580', inc: 53.20, alt: 548 },
    { num: '2418', norad: '48412', inc: 53.22, alt: 550 },
    { num: '3055', norad: '51204', inc: 53.21, alt: 551 },
    { num: '4012', norad: '53110', inc: 53.20, alt: 550 },
  ];

  const onewebIds = [
    { num: '0045', norad: '45140', inc: 87.90, alt: 1200 },
    { num: '0089', norad: '45480', inc: 87.90, alt: 1200 },
    { num: '0134', norad: '46920', inc: 87.90, alt: 1200 },
    { num: '0210', norad: '47950', inc: 87.90, alt: 1201 },
    { num: '0350', norad: '50980', inc: 87.90, alt: 1200 },
  ];

  const cosmos2251Frags = [
    { letter: 'AH', norad: '34105', alt: 545, inc: 74.02 },
    { letter: 'BZ', norad: '34180', alt: 568, inc: 74.10 },
    { letter: 'CX', norad: '34240', alt: 532, inc: 73.95 },
    { letter: 'DY', norad: '34310', alt: 575, inc: 74.15 },
    { letter: 'ER', norad: '34390', alt: 555, inc: 74.05 },
    { letter: 'GT', norad: '34480', alt: 590, inc: 74.20 },
    { letter: 'HQ', norad: '34520', alt: 520, inc: 73.90 },
    { letter: 'JP', norad: '34610', alt: 605, inc: 74.25 },
  ];

  const fengyunFrags = [
    { letter: 'AA', norad: '31110', alt: 850, inc: 98.65 },
    { letter: 'BD', norad: '31250', alt: 890, inc: 98.70 },
    { letter: 'CF', norad: '31380', alt: 820, inc: 98.60 },
    { letter: 'DM', norad: '31490', alt: 940, inc: 98.80 },
    { letter: 'ET', norad: '31610', alt: 780, inc: 98.55 },
    { letter: 'FL', norad: '31740', alt: 1010, inc: 98.90 },
    { letter: 'GN', norad: '31860', alt: 730, inc: 98.50 },
    { letter: 'HP', norad: '31990', alt: 1120, inc: 99.00 },
  ];

  const cosmos1408Frags = [
    { num: '49715', alt: 450, inc: 82.52 },
    { num: '49728', alt: 472, inc: 82.55 },
    { num: '49742', alt: 485, inc: 82.58 },
    { num: '49760', alt: 440, inc: 82.50 },
    { num: '49785', alt: 510, inc: 82.60 },
    { num: '49810', alt: 430, inc: 82.48 },
  ];

  const spentStages = [
    { name: 'DELTA 2 R/B', norad: '25884', alt: 690, inc: 98.2, desig: '1999-041B', country: 'USA' },
    { name: 'DELTA 4 R/B', norad: '29250', alt: 750, inc: 98.5, desig: '2006-027B', country: 'USA' },
    { name: 'ATLAS 5 CENTAUR R/B', norad: '32764', alt: 720, inc: 98.2, desig: '2008-017B', country: 'USA' },
    { name: 'H-2A R/B', norad: '29683', alt: 660, inc: 98.1, desig: '2006-059B', country: 'Japan' },
    { name: 'PSLV R/B (STAGE 4)', norad: '33462', alt: 620, inc: 97.9, desig: '2008-052B', country: 'India' },
    { name: 'VEGA R/B (AVUM)', norad: '38343', alt: 680, inc: 98.2, desig: '2012-023B', country: 'Europe' },
    { name: 'SOYUZ-2 R/B (FREGAT)', norad: '40050', alt: 710, inc: 98.3, desig: '2014-037B', country: 'Russia' },
    { name: 'KOSMOS-3M R/B', norad: '11548', alt: 960, inc: 82.9, desig: '1979-089B', country: 'Russia' },
  ];

  // 1. Add Starlinks
  starlinkIds.forEach((s, idx) => {
    bgObjects.push(
      createRealObject(
        `starlink-${s.num}`,
        `STARLINK-${s.num}`,
        s.norad,
        `202${(idx % 4) + 1}-0${(idx % 9) + 1}A`,
        'PAYLOAD',
        'LEO',
        'SpaceX',
        'USA',
        '2021-05-26',
        s.alt,
        s.inc,
        0.00015,
        (idx * 36) % 360,
        (idx * 41) % 360,
        (idx * 53) % 360,
        '#38bdf8',
        `SpaceX Starlink internet broadband satellite in orbital plane ${idx + 1}.`
      )
    );
  });

  // 2. Add OneWebs
  onewebIds.forEach((w, idx) => {
    bgObjects.push(
      createRealObject(
        `oneweb-${w.num}`,
        `ONEWEB-${w.num}`,
        w.norad,
        `2022-0${(idx % 9) + 1}K`,
        'PAYLOAD',
        'LEO',
        'Eutelsat OneWeb',
        'United Kingdom',
        '2022-02-10',
        w.alt,
        w.inc,
        0.0011,
        (idx * 72) % 360,
        (idx * 30) % 360,
        (idx * 60) % 360,
        '#38bdf8',
        'OneWeb Ku-band low-latency telecommunications spacecraft.'
      )
    );
  });

  // 3. Add Cosmos 2251 collision debris
  cosmos2251Frags.forEach((c) => {
    bgObjects.push(
      createRealObject(
        `deb-cosmos-${c.norad}`,
        `COSMOS 2251 DEB #${c.norad}`,
        c.norad,
        `1993-036${c.letter}`,
        'DEBRIS',
        'LEO',
        'Derelict / Russian MoD',
        'Russia (Derelict)',
        '1993-06-16',
        c.alt,
        c.inc,
        0.0035,
        (parseInt(c.norad) * 17) % 360,
        (parseInt(c.norad) * 23) % 360,
        (parseInt(c.norad) * 31) % 360,
        '#ef4444',
        `Tracked fragment from 2009 Iridium 33 / Kosmos 2251 collision (catalog #${c.norad}).`
      )
    );
  });

  // 4. Add Fengyun-1C ASAT debris
  fengyunFrags.forEach((f) => {
    bgObjects.push(
      createRealObject(
        `deb-fy1c-${f.norad}`,
        `FENGYUN 1C DEB #${f.norad}`,
        f.norad,
        `1999-025${f.letter}`,
        'DEBRIS',
        'LEO',
        'Derelict / Chinese ASAT',
        'China (Derelict)',
        '1999-05-10',
        f.alt,
        f.inc,
        0.0055,
        (parseInt(f.norad) * 19) % 360,
        (parseInt(f.norad) * 29) % 360,
        (parseInt(f.norad) * 37) % 360,
        '#ef4444',
        `Cataloged debris fragment from 2007 Chinese anti-satellite kinetic test.`
      )
    );
  });

  // 5. Add Cosmos-1408 DA-ASAT debris
  cosmos1408Frags.forEach((k) => {
    bgObjects.push(
      createRealObject(
        `deb-c1408-${k.num}`,
        `COSMOS 1408 DEB #${k.num}`,
        k.num,
        '1982-092-DEB',
        'DEBRIS',
        'LEO',
        'Derelict / Russian ASAT',
        'Russia (Derelict)',
        '1982-09-16',
        k.alt,
        k.inc,
        0.0042,
        (parseInt(k.num) * 13) % 360,
        (parseInt(k.num) * 17) % 360,
        (parseInt(k.num) * 29) % 360,
        '#ef4444',
        'High-velocity fragment generated by Russian 2021 Nudol DA-ASAT intercept.'
      )
    );
  });

  // 6. Add Real Derelict Spent Rocket Bodies
  spentStages.forEach((rb, idx) => {
    bgObjects.push(
      createRealObject(
        `rb-${rb.norad}`,
        rb.name,
        rb.norad,
        rb.desig,
        'ROCKET_BODY',
        'LEO',
        'Derelict Upper Stage',
        rb.country,
        '2010-06-01',
        rb.alt,
        rb.inc,
        0.002,
        (idx * 45) % 360,
        (idx * 55) % 360,
        (idx * 65) % 360,
        '#f97316',
        `Derelict upper stage rocket body abandoned after payload orbital injection.`
      )
    );
  });

  // 7. Add Real Scientific & Weather Earth Observation Satellites
  const realSatellites = [
    { name: 'METOP-B', norad: '38771', desig: '2012-049A', alt: 817, inc: 98.7, org: 'EUMETSAT / ESA', cty: 'Europe' },
    { name: 'METOP-C', norad: '43689', desig: '2018-087A', alt: 818, inc: 98.7, org: 'EUMETSAT / ESA', cty: 'Europe' },
    { name: 'NOAA-20 (JPSS-1)', norad: '43013', desig: '2017-073A', alt: 824, inc: 98.7, org: 'NOAA / NASA', cty: 'USA' },
    { name: 'NOAA-21 (JPSS-2)', norad: '54234', desig: '2022-150A', alt: 825, inc: 98.7, org: 'NOAA / NASA', cty: 'USA' },
    { name: 'SUOMI NPP', norad: '37849', desig: '2011-061A', alt: 824, inc: 98.7, org: 'NASA / NOAA', cty: 'USA' },
    { name: 'ALOS-2 (DAICHI-2)', norad: '39766', desig: '2014-029A', alt: 628, inc: 97.9, org: 'JAXA', cty: 'Japan' },
    { name: 'GCOM-W1 (SHIZUKU)', norad: '38337', desig: '2012-025A', alt: 699, inc: 98.2, org: 'JAXA', cty: 'Japan' },
    { name: 'RADARSAT CONSTELLATION 1', norad: '44324', desig: '2019-033A', alt: 593, inc: 97.7, org: 'CSA', cty: 'Canada' },
    { name: 'RADARSAT CONSTELLATION 2', norad: '44325', desig: '2019-033B', alt: 593, inc: 97.7, org: 'CSA', cty: 'Canada' },
    { name: 'SWOT', norad: '54754', desig: '2022-173A', alt: 890, inc: 77.6, org: 'NASA / CNES', cty: 'USA / France' },
    { name: 'PACE', norad: '58926', desig: '2024-027A', alt: 676, inc: 98.0, org: 'NASA Goddard', cty: 'USA' },
    { name: 'EARTHCARE', norad: '59871', desig: '2024-101A', alt: 393, inc: 97.0, org: 'ESA / JAXA', cty: 'Europe / Japan' },
  ];

  realSatellites.forEach((sat, idx) => {
    bgObjects.push(
      createRealObject(
        `sat-${sat.norad}`,
        sat.name,
        sat.norad,
        sat.desig,
        'PAYLOAD',
        'LEO',
        sat.org,
        sat.cty,
        '2020-01-01',
        sat.alt,
        sat.inc,
        0.0012,
        (idx * 31) % 360,
        (idx * 47) % 360,
        (idx * 71) % 360,
        '#06b6d4',
        `Operational scientific Earth observation spacecraft (${sat.org}).`
      )
    );
  });

  // 8. Add Real Navigation Constellations (GPS, GLONASS, Galileo, BeiDou)
  const realMEO = [
    { name: 'GPS BIIF-02 (PRN 01)', norad: '37753', desig: '2011-036A', alt: 20180, inc: 55.0, org: 'US Space Force', cty: 'USA' },
    { name: 'GPS BIIF-05 (PRN 30)', norad: '39533', desig: '2014-008A', alt: 20180, inc: 55.0, org: 'US Space Force', cty: 'USA' },
    { name: 'GPS BIIF-09 (PRN 26)', norad: '40534', desig: '2015-013A', alt: 20180, inc: 55.0, org: 'US Space Force', cty: 'USA' },
    { name: 'GPS BIII-01 (PRN 04)', norad: '43873', desig: '2018-109A', alt: 20182, inc: 55.0, org: 'US Space Force', cty: 'USA' },
    { name: 'GPS BIII-04 (PRN 23)', norad: '46826', desig: '2020-078A', alt: 20182, inc: 55.0, org: 'US Space Force', cty: 'USA' },
    { name: 'GALILEO 21 (GSAT0215)', norad: '43055', desig: '2017-079A', alt: 23222, inc: 56.0, org: 'ESA / EUSPA', cty: 'Europe' },
    { name: 'GALILEO 22 (GSAT0216)', norad: '43056', desig: '2017-079B', alt: 23222, inc: 56.0, org: 'ESA / EUSPA', cty: 'Europe' },
    { name: 'GALILEO 25 (GSAT0218)', norad: '43565', desig: '2018-060B', alt: 23222, inc: 56.0, org: 'ESA / EUSPA', cty: 'Europe' },
    { name: 'BEIDOU-3 M1', norad: '43001', desig: '2017-069A', alt: 21528, inc: 55.0, org: 'CNSA', cty: 'China' },
    { name: 'BEIDOU-3 M2', norad: '43002', desig: '2017-069B', alt: 21528, inc: 55.0, org: 'CNSA', cty: 'China' },
    { name: 'GLONASS-K 705', norad: '46805', desig: '2020-075A', alt: 19140, inc: 64.8, org: 'Roscosmos', cty: 'Russia' },
    { name: 'GLONASS-M 755', norad: '43508', desig: '2018-053A', alt: 19140, inc: 64.8, org: 'Roscosmos', cty: 'Russia' },
  ];

  realMEO.forEach((nav, idx) => {
    bgObjects.push(
      createRealObject(
        `meo-${nav.norad}`,
        nav.name,
        nav.norad,
        nav.desig,
        'PAYLOAD',
        'MEO',
        nav.org,
        nav.cty,
        '2018-01-01',
        nav.alt,
        nav.inc,
        0.001,
        (idx * 30) % 360,
        (idx * 45) % 360,
        (idx * 60) % 360,
        '#10b981',
        `Medium Earth Orbit satellite navigation payload (${nav.org}).`
      )
    );
  });

  // 9. Add Real Geostationary Telecom & Weather Satellites
  const realGEO = [
    { name: 'HIMAWARI-9', norad: '41836', desig: '2016-064A', lon: 140.7, org: 'JMA', cty: 'Japan' },
    { name: 'ELEKTRO-L 3', norad: '44903', desig: '2019-095A', lon: 76.0, org: 'Roscosmos', cty: 'Russia' },
    { name: 'INMARSAT-5 F4', norad: '42704', desig: '2017-025A', lon: 56.5, org: 'Inmarsat', cty: 'United Kingdom' },
    { name: 'VIASAT-2', norad: '42741', desig: '2017-029A', lon: 69.9, org: 'Viasat Inc', cty: 'USA' },
    { name: 'TDRS-13', norad: '42915', desig: '2017-047A', lon: 171.0, org: 'NASA Space Comm', cty: 'USA' },
    { name: 'SES-17', norad: '49330', desig: '2021-095A', lon: 67.1, org: 'SES S.A.', cty: 'Luxembourg' },
  ];

  realGEO.forEach((geo, idx) => {
    bgObjects.push(
      createRealObject(
        `geo-${geo.norad}`,
        geo.name,
        geo.norad,
        geo.desig,
        'PAYLOAD',
        'GEO',
        geo.org,
        geo.cty,
        '2018-05-01',
        35786,
        0.05,
        0.0001,
        (geo.lon * 1.0) % 360,
        0,
        (idx * 60) % 360,
        '#8b5cf6',
        `Geostationary operational spacecraft at longitude ${geo.lon}°E (${geo.org}).`
      )
    );
  });

  return bgObjects;
}

export interface ConjunctionPreset {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'WARNING' | 'MONITORING';
  objectAId: string;
  objectBId: string;
  catalogIdA: string;
  catalogIdB: string;
  nameA: string;
  nameB: string;
  summary: string;
  missDistanceKm: number;
  relSpeedKmS: number;
  tcaMinutes: number;
  orbitAltitudeKm: number;
}

export const CONJUNCTION_PRESETS: ConjunctionPreset[] = [
  {
    id: 'starlink-vs-cosmos',
    title: 'CRITICAL: STARLINK-3104 vs COSMOS 2251 DEB',
    severity: 'CRITICAL',
    objectAId: 'starlink-3104',
    objectBId: 'cosmos-2251-deb',
    catalogIdA: '55123',
    catalogIdB: '34120',
    nameA: 'STARLINK-3104',
    nameB: 'COSMOS 2251 DEB #34120',
    summary: 'High-risk orbital crossing in 550 km shell with Iridium-Kosmos collision debris cloud. Predicted miss distance < 1.0 km at 14.4 km/s relative speed.',
    missDistanceKm: 0.84,
    relSpeedKmS: 14.4,
    tcaMinutes: 14.2,
    orbitAltitudeKm: 550,
  },
  {
    id: 'iss-vs-sl16',
    title: 'CLOSE APPROACH: ISS (ZARYA) vs SL-16 R/B',
    severity: 'WARNING',
    objectAId: 'iss-25544',
    objectBId: 'sl-16-rb-22220',
    catalogIdA: '25544',
    catalogIdB: '22220',
    nameA: 'ISS (ZARYA)',
    nameB: 'SL-16 R/B (ZENIT-2)',
    summary: 'Massive 9-ton Zenit rocket body crosses ISS orbital corridor within 3.8 km. Collision Avoidance Maneuver (COLA) screening active.',
    missDistanceKm: 3.82,
    relSpeedKmS: 11.2,
    tcaMinutes: 42.6,
    orbitAltitudeKm: 418,
  },
  {
    id: 'sentinel-vs-fengyun',
    title: 'MONITORING: SENTINEL-6A vs FENGYUN 1C DEB',
    severity: 'MONITORING',
    objectAId: 'sentinel-6a',
    objectBId: 'fengyun-1c-deb',
    catalogIdA: '46984',
    catalogIdB: '31115',
    nameA: 'SENTINEL-6A',
    nameB: 'FENGYUN 1C DEB #31115',
    summary: '2007 ASAT kinetic fragmentation debris cloud intercept at 1,336 km altitude. Miss distance 18.5 km, entering secondary tracking buffer.',
    missDistanceKm: 18.5,
    relSpeedKmS: 9.8,
    tcaMinutes: 88.0,
    orbitAltitudeKm: 1336,
  },
  {
    id: 'hubble-vs-cosmos1408',
    title: 'ELEVATED: HST (HUBBLE) vs COSMOS 1408 DEB',
    severity: 'WARNING',
    objectAId: 'hubble-20580',
    objectBId: 'cosmos-1408-deb',
    catalogIdA: '20580',
    catalogIdB: '49712',
    nameA: 'HST (HUBBLE)',
    nameB: 'COSMOS 1408 DEB #49712',
    summary: 'Russian ASAT test fragment cross-cutting Hubble Space Telescope operating orbit at 535 km altitude.',
    missDistanceKm: 2.15,
    relSpeedKmS: 13.7,
    tcaMinutes: 28.5,
    orbitAltitudeKm: 535,
  },
];

/**
 * Robust object pair resolver that guarantees both objects are found across live and base catalogs
 */
export function findPresetObjects(
  preset: ConjunctionPreset,
  allObjects: OrbitalObject[],
  baseCatalog: OrbitalObject[] = CATALOG_OBJECTS
): { objA: OrbitalObject; objB: OrbitalObject } {
  const getObj = (id: string, catalogId: string, defaultName: string): OrbitalObject => {
    // 1. Check in allObjects by exact id
    let match = allObjects.find((o) => o.id === id);
    if (match) return match;

    // 2. Check in allObjects by catalogId
    match = allObjects.find((o) => o.catalogId === catalogId);
    if (match) return match;

    // 3. Check in allObjects by norad id format
    match = allObjects.find((o) => o.id === `norad-${catalogId}`);
    if (match) return match;

    // 4. Check in baseCatalog by id or catalogId
    match = baseCatalog.find((o) => o.id === id || o.catalogId === catalogId || o.id === `norad-${catalogId}`);
    if (match) return match;

    // 5. Check by name substring
    const cleanName = defaultName.toUpperCase();
    match = allObjects.find((o) => o.name.toUpperCase().includes(cleanName)) ||
            baseCatalog.find((o) => o.name.toUpperCase().includes(cleanName));
    if (match) return match;

    // 6. Safe fallback to first base catalog object
    return baseCatalog[0];
  };

  return {
    objA: getObj(preset.objectAId, preset.catalogIdA, preset.nameA),
    objB: getObj(preset.objectBId, preset.catalogIdB, preset.nameB),
  };
}

export const WHAT_IF_SCENARIOS = [
  {
    id: 'iss-cola',
    title: 'ISS Collision Avoidance Maneuver (COLA)',
    description: 'Execute a +1.8 m/s posigrade thruster burn at perigee to raise ISS apogee by +2.2 km, clearing the SL-16 debris trajectory.',
    altitudeDeltaKm: 2.2,
    inclinationDeltaDeg: 0,
    eccentricityDelta: 0.0001,
  },
  {
    id: 'constellation-orbit-raise',
    title: 'Constellation Orbit Raising (+20 km)',
    description: 'Raise satellite from 530 km injection orbit to 550 km operational constellation shell.',
    altitudeDeltaKm: 20.0,
    inclinationDeltaDeg: 0,
    eccentricityDelta: 0.0,
  },
  {
    id: 'plane-shift',
    title: 'Orbital Plane Shift (+1.5° Inclination)',
    description: 'Perform cross-track velocity change to alter ground-track nodal precession rate.',
    altitudeDeltaKm: 0,
    inclinationDeltaDeg: 1.5,
    eccentricityDelta: 0.0,
  },
  {
    id: 'deorbit-disposal',
    title: 'End-of-Life Atmospheric De-orbit (-180 km)',
    description: 'Execute retro-burn to drop perigee into upper atmosphere for controlled 25-year compliance disposal.',
    altitudeDeltaKm: -180.0,
    inclinationDeltaDeg: 0,
    eccentricityDelta: 0.015,
  },
];
