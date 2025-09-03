// Enhanced Agriculture Service with Real World Boundaries
class EnhancedAgricultureService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  }

  /**
   * Get agriculture data with real world boundaries
   */
  async getRealAgricultureBoundaries() {
    try {
      const response = await fetch(`${this.baseUrl}/api/agriculture/real-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return this.processCoordinatesForMap(data);
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.warn('Using enhanced fallback with real boundaries:', error);
      return this.getEnhancedRealWorldBoundaries();
    }
  }

  /**
   * Process API coordinates for map display
   */
  processCoordinatesForMap(data) {
    if (!data.sectors) {
      return this.getEnhancedRealWorldBoundaries();
    }

    const processedSectors = {};
    
    Object.entries(data.sectors).forEach(([key, sector]) => {
      processedSectors[key] = {
        ...sector,
        regions: sector.regions.map(region => ({
          ...region,
          id: `${key}_${region.name.replace(/\s+/g, '_')}`,
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: region.coordinates
          }
        }))
      };
    });

    return { sectors: processedSectors };
  }

  /**
   * Enhanced real-world agriculture boundaries
   */
  getEnhancedRealWorldBoundaries() {
    return {
      sectors: {
        crops_production: {
          name: 'Crop Production',
          icon: '🌾',
          color: '#4CAF50',
          regions: [
            {
              id: 'us_midwest_corn',
              name: 'US Midwest Corn Belt',
              country: 'United States',
              coordinates: [[
                [40.5, -94.0], [40.5, -80.0], [44.5, -80.0], [44.5, -94.0], [40.5, -94.0]
              ]],
              properties: {
                area: 125000,
                production: 420000000,
                yield: 10.8,
                mainCrops: ['Corn', 'Soybeans'],
                soilType: 'Prairie soils'
              }
            },
            {
              id: 'argentina_pampas',
              name: 'Argentine Pampas',
              country: 'Argentina',
              coordinates: [[
                [-35.5, -63.0], [-35.5, -56.0], [-29.5, -56.0], [-29.5, -63.0], [-35.5, -63.0]
              ]],
              properties: {
                area: 95000,
                production: 140000000,
                yield: 8.2,
                mainCrops: ['Wheat', 'Soybeans', 'Corn'],
                climate: 'Temperate'
              }
            },
            {
              id: 'ukraine_grain',
              name: 'Ukrainian Grain Belt',
              country: 'Ukraine',
              coordinates: [[
                [47.0, 28.0], [47.0, 35.0], [52.0, 35.0], [52.0, 28.0], [47.0, 28.0]
              ]],
              properties: {
                area: 78000,
                production: 85000000,
                yield: 6.8,
                mainCrops: ['Wheat', 'Barley', 'Corn'],
                soilType: 'Chernozem'
              }
            },
            {
              id: 'indo_gangetic',
              name: 'Indo-Gangetic Plains',
              country: 'India',
              coordinates: [[
                [25.0, 74.0], [25.0, 88.0], [31.0, 88.0], [31.0, 74.0], [25.0, 74.0]
              ]],
              properties: {
                area: 105000,
                production: 280000000,
                yield: 4.2,
                mainCrops: ['Rice', 'Wheat'],
                irrigation: 'Canal and tube wells'
              }
            },
            {
              id: 'north_china_plain',
              name: 'North China Plain',
              country: 'China',
              coordinates: [[
                [32.0, 110.0], [32.0, 122.0], [40.0, 122.0], [40.0, 110.0], [32.0, 110.0]
              ]],
              properties: {
                area: 88000,
                production: 195000000,
                yield: 7.5,
                mainCrops: ['Wheat', 'Corn'],
                landUse: 'Intensive farming'
              }
            }
          ]
        },

        agricultural_trade: {
          name: 'Agricultural Trade Hubs',
          icon: '🚢',
          color: '#2196F3',
          regions: [
            {
              id: 'rotterdam_port',
              name: 'Rotterdam Agricultural Port',
              country: 'Netherlands',
              coordinates: [[
                [51.8, 3.8], [51.8, 4.8], [52.2, 4.8], [52.2, 3.8], [51.8, 3.8]
              ]],
              properties: {
                tradeVolume: 145000000,
                mainCommodities: ['Grains', 'Oilseeds', 'Feed'],
                storageCapacity: 2500000
              }
            },
            {
              id: 'santos_port',
              name: 'Port of Santos',
              country: 'Brazil',
              coordinates: [[
                [-24.2, -46.5], [-24.2, -46.0], [-23.8, -46.0], [-23.8, -46.5], [-24.2, -46.5]
              ]],
              properties: {
                tradeVolume: 135000000,
                mainCommodities: ['Soybeans', 'Sugar', 'Coffee'],
                exportShare: 0.65
              }
            },
            {
              id: 'chicago_cbot',
              name: 'Chicago Commodity Hub',
              country: 'United States',
              coordinates: [[
                [41.5, -88.0], [41.5, -87.0], [42.0, -87.0], [42.0, -88.0], [41.5, -88.0]
              ]],
              properties: {
                dailyTrading: 25000000,
                mainCommodities: ['Corn', 'Wheat', 'Soybeans'],
                futuresContracts: 'CBOT'
              }
            }
          ]
        },

        livestock: {
          name: 'Livestock Production',
          icon: '🐄',
          color: '#8D6E63',
          regions: [
            {
              id: 'texas_cattle',
              name: 'Texas Cattle Country',
              country: 'United States',
              coordinates: [[
                [25.5, -106.0], [25.5, -93.0], [36.5, -93.0], [36.5, -106.0], [25.5, -106.0]
              ]],
              properties: {
                cattleCount: 13000000,
                area: 268596,
                ranchType: 'Beef cattle',
                grasslandType: 'Mixed prairie'
              }
            },
            {
              id: 'mongolia_pastoral',
              name: 'Mongolian Pastoralism',
              country: 'Mongolia',
              coordinates: [[
                [41.5, 87.0], [41.5, 120.0], [52.0, 120.0], [52.0, 87.0], [41.5, 87.0]
              ]],
              properties: {
                livestockCount: 66000000,
                mainAnimals: ['Sheep', 'Goats', 'Cattle', 'Horses'],
                systemType: 'Nomadic pastoralism'
              }
            },
            {
              id: 'australia_beef',
              name: 'Australian Beef Belt',
              country: 'Australia',
              coordinates: [[
                [-29.0, 138.0], [-29.0, 153.0], [-16.0, 153.0], [-16.0, 138.0], [-29.0, 138.0]
              ]],
              properties: {
                cattleCount: 26000000,
                exportValue: 8500000000,
                mainBreeds: ['Brahman', 'Angus']
              }
            }
          ]
        },

        land_use: {
          name: 'Agricultural Land Use',
          icon: '🗺️',
          color: '#8BC34A',
          regions: [
            {
              id: 'california_central',
              name: 'California Central Valley',
              country: 'United States',
              coordinates: [[
                [35.0, -121.5], [35.0, -118.5], [40.0, -118.5], [40.0, -121.5], [35.0, -121.5]
              ]],
              properties: {
                irrigatedArea: 2500000,
                cropDiversity: 'High',
                waterSource: 'Sacramento-San Joaquin Delta',
                productivity: 'Very High'
              }
            },
            {
              id: 'nile_delta',
              name: 'Nile Delta',
              country: 'Egypt',
              coordinates: [[
                [30.0, 30.0], [30.0, 32.5], [31.8, 32.5], [31.8, 30.0], [30.0, 30.0]
              ]],
              properties: {
                landArea: 25000,
                populationDensity: 1500,
                mainCrops: ['Rice', 'Cotton', 'Wheat'],
                irrigationType: 'Basin irrigation'
              }
            }
          ]
        },

        forestry: {
          name: 'Forestry & Agroforestry',
          icon: '🌲',
          color: '#388E3C',
          regions: [
            {
              id: 'amazon_agroforestry',
              name: 'Amazon Agroforestry Zone',
              country: 'Brazil',
              coordinates: [[
                [-10.0, -68.0], [-10.0, -50.0], [2.0, -50.0], [2.0, -68.0], [-10.0, -68.0]
              ]],
              properties: {
                forestArea: 450000000,
                agroforestryArea: 15000000,
                mainSpecies: ['Acai', 'Brazil nut', 'Rubber'],
                carbonStock: 'Very High'
              }
            },
            {
              id: 'congo_basin',
              name: 'Congo Basin Agroforestry',
              country: 'Democratic Republic of Congo',
              coordinates: [[
                [-4.0, 12.0], [-4.0, 30.0], [5.0, 30.0], [5.0, 12.0], [-4.0, 12.0]
              ]],
              properties: {
                forestArea: 155000000,
                biodiversity: 'Extremely High',
                mainProducts: ['Timber', 'Palm oil', 'Cocoa']
              }
            }
          ]
        },

        fertilizers: {
          name: 'Fertilizer Production',
          icon: '🧪',
          color: '#9C27B0',
          regions: [
            {
              id: 'gulf_coast_fertilizer',
              name: 'US Gulf Coast Fertilizer Hub',
              country: 'United States',
              coordinates: [[
                [27.0, -97.0], [27.0, -89.0], [31.0, -89.0], [31.0, -97.0], [27.0, -97.0]
              ]],
              properties: {
                productionCapacity: 45000000,
                mainProducts: ['Ammonia', 'Urea', 'Phosphates'],
                exportShare: 0.35
              }
            }
          ]
        }
      }
    };
  }
}

export const enhancedAgricultureService = new EnhancedAgricultureService();
