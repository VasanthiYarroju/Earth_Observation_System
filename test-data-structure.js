// Test the agriculture map component with structured data
const testData = {
  sectors: {
    crops_production: {
      name: 'Crop Production',
      icon: '🌾',
      color: '#4CAF50',
      regions: [
        {
          name: 'Test Region 1',
          country: 'USA',
          coordinates: [[[40.7, -74.0], [40.8, -74.0], [40.8, -73.9], [40.7, -73.9], [40.7, -74.0]]],
          properties: {
            area: 50000,
            production: 100000,
            yield: 2.0
          }
        }
      ]
    },
    trade: {
      name: 'Agricultural Trade',
      icon: '🚢',
      color: '#2196F3',
      regions: [
        {
          name: 'Test Trade Region',
          country: 'Canada',
          coordinates: [[[45.7, -75.0], [45.8, -75.0], [45.8, -74.9], [45.7, -74.9], [45.7, -75.0]]],
          properties: {
            area: 30000,
            production: 75000,
            yield: 2.5
          }
        }
      ]
    }
  },
  summary: {
    totalSectors: 2,
    totalRegions: 2
  }
};

console.log('Test data structure:', JSON.stringify(testData, null, 2));
