```javascript
Map.addLayer(aoi,{},'aoi')

//ATTENTION: for a supervised classification, users are required to train the algorithm by defining different classes (water, land, etc.) and assigning pixel values to each class
// please follow this tutorial to learn more: https://www.youtube.com/watch?v=WjKhPyiSgb8 

/////////////////////////////////////////////////////////
///// Defining dry and flood periods
//dry/reference period for RGB inspection
var drystart='2020-10-01'
var dryend='2021-02-05'
//wet period
var wetstart='2021-02-09'
var wetend='2021-02-11'
/////////////////////////////////////////////////////////
//// Variables defined for classifying data
// Load training points. The numeric property 'landuse' stores known labels.
// training points can be loaded or user-defined using the geometry imports tools on map.

var points = water.merge(snow).merge(forest).merge(soil).merge(sand).merge(shadows);

// This property stores the land cover labels as consecutive
// integers starting from one.
var label = 'landuse';

///////////////////////////////////////////////////////////
////  NO NEED TO CHANGE ANYTHING BELOW THIS LINE
//////////////////////////////////////////////////////////
// Centering map automatically on the defined geometry
Map.centerObject(geometry)


// Cloud mask function (light)
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}
///defining visualisation bands for RGB plot
var visualization = {
  min: 0.0,
  max: 0.3,
  bands: ['B4', 'B3', 'B2'],
};

/// loading sentinel-2 images for dry period
var s2dry = ee.ImageCollection('COPERNICUS/S2_SR').filterBounds(geometry)
                  .filterDate(drystart, dryend)
                  // Pre-filter to get less cloudy granules.
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
                  .map(maskS2clouds);
print(s2dry)
Map.addLayer(s2dry.mean(), visualization, 'RGB dry');
/// loading sentinel-2 images for flood event
var s2flood = ee.ImageCollection('COPERNICUS/S2_SR').filterBounds(geometry)
                  .filterDate(wetstart, wetend)
                  // Pre-filter to get less cloudy granules.
                  .map(maskS2clouds);
print(s2flood)
Map.addLayer(s2flood.mean(), visualization, 'RGB flood');

/////////////////////////////////////////////////////////////////
// Using same method for water layer detection used for South Sudan
// compute water layer for wet periods using MNDWI (B3 and B12 bands of Sentinel-2)
var b3med_flood = s2flood.select('B3').median()
var b12p_flood  = s2flood.select('B12').reduce(ee.Reducer.percentile([15])).rename('B12')

var mndwi_wet = b3med_flood//.clip(aoi)
                .addBands(b12p_flood)//.clip(aoi))
                .normalizedDifference(['B3','B12']).select(['nd'],['mndwi']);
Map.addLayer(mndwi_wet,{min:-1, max:1},'mndwi wet',false)
/////////////////////////////////////////////////////////////
// Computing Normalised Difference Snow Indexes for dry and wet periods
var b11p_flood  = s2flood.select('B11').reduce(ee.Reducer.percentile([15])).rename('B11')
/// NDSI for wet period
var ndsi_wet = b3med_flood//.clip(aoi)
                .addBands(b11p_flood)//.clip(aoi))
                .normalizedDifference(['B3','B11']).select(['nd'],['ndsi']);
Map.addLayer(ndsi_wet,{min:-1, max:1},'ndsi wet',false)
////////////////
// Computing Bare Soil Index
//BSI (Sentinel 2) = (B11 + B4) – (B8 + B2) / (B11 + B4) + (B8 + B2)
var b2med=s2flood.select('B2').median()
var b4med=s2flood.select('B4').median()
var b8med=s2flood.select('B8').median()
var b11med=s2flood.select('B11').median()
var bsi_wet=(((b11med.add(b4med)).subtract(b8med.add(b2med))).divide(b11med.add(b4med).add(b8med).add(b2med))).rename(['bsi'])
Map.addLayer(bsi_wet,{min:-1, max:1},'bsi wet',false)
///////////////////
// Compute NDVI
var ndvi_wet=((b8med.subtract(b4med)).divide(b8med.add(b4med))).rename(['ndvi'])
Map.addLayer(ndvi_wet,{min:-1, max:1},'ndvi wet',false)
/////////////////////////////////////////////////////////////////////////
////Classifying wet scene using SVM on computed Indices for wet period
////////////////////////////////////////////////////////////////////////
// Create stack of all indices together
var collection=mndwi_wet.addBands(ndvi_wet).addBands(ndsi_wet).addBands(bsi_wet)
print(collection)
var bands=['mndwi','ndvi','ndsi','bsi']
// Get the values for all pixels in each polygon in the training.
var training = collection.sampleRegions({
  collection: points,
  properties: ['landuse'],
  scale: 10
});
// Define SVM classifier with RBF kernel
var classifier = ee.Classifier.libsvm({
  kernelType: 'RBF',
  gamma: 0.5,
  cost: 10
});
// Train the classifier.
var trainedSVMindices = classifier.train(training, 'landuse', bands);
// Classify the image.
var classifiedSVMindices = collection.classify(trainedSVMindices);
Map.addLayer(classifiedSVMindices,
             {min: 1, max: 6, palette: ['aqua','white','orange', 'green', 'brown','grey']},
             'SVM indices');
// Plot water class based on SVM classifier indices//             
var water_classIndices=(classifiedSVMindices.eq(1)).updateMask(classifiedSVMindices.eq(1))
Map.addLayer(water_classIndices,{min:0, max:1,palette:'blue'},'water class indices',true)
             
///////////////////
/// Filtering results based on Topography heights
var dem=ee.Image("USGS/SRTMGL1_003")
Map.addLayer(dem,{min:1800, max:2300},'DEM',false)

var water_class=(classifiedSVMindices.eq(1)).updateMask(dem.lt(2300)).updateMask(classifiedSVMindices.eq(1))
Map.addLayer(water_class,{min:0, max:1,palette:'blue'},'water class indices dem',true)

///////////////////////////////////
// Refine flood result using additional datasets
      var flood=water_class
      var difference_binary = flood
      // Include JRC layer on surface water seasonality to mask flood pixels from areas
      // of "permanent" water (where there is water > 10 months of the year)
      var swater = ee.Image('JRC/GSW1_0/GlobalSurfaceWater').select('seasonality');
      var swater_mask = swater.gte(10).updateMask(swater.gte(10));
      
      //Flooded layer where perennial water bodies (water > 10 mo/yr) is assigned a 0 value
      var flooded_mask = difference_binary.where(swater_mask,0);
      // final flooded area without pixels in perennial waterbodies
      var flooded = flooded_mask.updateMask(flooded_mask);
      
      // Compute connectivity of pixels to eliminate those connected to 8 or fewer neighbours
      // This operation reduces noise of the flood extent product 
      var connections = flooded.connectedPixelCount();    
      var flooded = flooded.updateMask(connections.gte(10));
Map.addLayer(flooded,{min:0, max:1,palette:'red'},'flood',true)

//------------------------------------- EXPORTS ------------------------------------//
// Export flooded area as TIFF file 
Export.image.toDrive({
  image: flooded, 
  description: 'Flood_extent_raster',
  fileNamePrefix: 'flooded',
  region: aoi, 
  maxPixels: 1e10
});
///// Defining panel
var results = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px',
    width: '350px'
  }
});
var subTextVis = {
  'margin':'0px 0px 2px 0px',
  'fontSize':'12px',
  'color':'grey'
  };
// Disclaimer
var text6 = ui.Label('Disclaimer: This product has been derived automatically without validation data. All geographic information has limitations due to the scale, resolution, date and interpretation of the original source materials. No liability concerning the content or the use thereof is assumed by the producer.',subTextVis)

// Produced by...
var text7 = ui.Label('Script created by: Geospatial Operations Support Team, The World Bank, February 2021',subTextVis)

// Add the labels to the panel  
results.add(ui.Panel([
        text6,
        text7]
      ));

// Add the panel to the map 
Map.add(results);
