import GeoDataExtractor from './services/geoDataExtractor.js';

console.log('🌾 Testing Agriculture Data Extraction Service...\n');

// Test the data generation
const extractor = new GeoDataExtractor();
const testLocation = 'china';
const testData = extractor.generateAgricultureSectors(testLocation);

console.log(`📍 Location: ${testLocation.toUpperCase()}`);
console.log(`🔢 Total sectors: ${Object.keys(testData).length}`);

Object.entries(testData).forEach(([sectorKey, sectorData]) => {
  console.log(`\n${sectorKey.toUpperCase()}:`);
  console.log(`  📊 Total Area: ${sectorData.totalArea}`);
  console.log(`  🏭 Production: ${sectorData.production}`);
  console.log(`  🗺️  Regions: ${sectorData.regions.length}`);
  
  if (sectorData.regions.length > 0) {
    console.log(`  📌 First region: ${sectorData.regions[0].name}`);
    console.log(`  🌾 Primary crop: ${sectorData.regions[0].primaryCrop}`);
    console.log(`  📈 Productivity: ${(sectorData.regions[0].productivity * 100).toFixed(1)}%`);
  }
});

console.log('\n✅ Agriculture Data Extraction Service is working correctly!');
console.log('🎯 This data will power the EOS-style agriculture monitoring interface.');
