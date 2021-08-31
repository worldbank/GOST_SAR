/*===========================================================================================
       SAR-OIL SPILL MAPPING USING THE PSEUDO-ANOMALY APPROACH
  ===========================================================================================
  
  Within this script SAR Sentinel-1 is being used to generate a oil spill extent map
  using a pseudo-anomaly detection approach using a reference scene. 
  
*******************************************************************************************
                                 SELECT YOUR OWN STUDY AREA   

   The user can :
   
   1) use the polygon-tool in the top left corner of the map pane to draw the shape of your 
   study area. Single clicks add vertices, double-clicking completes the polygon.
   **CAREFUL**: Under 'Geometry Imports' (top left in map panel) uncheck the 
               geometry box, so it does not block the view on the imagery later.
      Use this option if you want to run your own use case!
      ***  For running the pre-defined test cases, go directly to line 70 ***
      
   2) load a shapefile stored in the user Assets collection */
   

   /* 1) Use a user defined geometry. Use this option if you want to run your own use case
      ***  For running the pre-defined test cases, go directly to line 70 ***
    Uncomment the two lines below if you want to use a defined geometry as AoI */
  var aoi = ee.FeatureCollection(geometry);
  Map.centerObject(aoi,7);
  var smallaoi=geometry2; // Small area defined for statistics computation
  
  /* 2) Load a shapefile from Assets collection.
  Uncomment and modify the lines below if you want to use a shapefile stored in your assets
  var aoi= ee.FeatureCollection('users/GOST_WBG/AOI1')
  //Map.centerObject(aoi,8);

  /*******************************************************************************************
                                       SET TIME FRAME

   *** For user defined use-cases only! Go to line 67 for pre-defined use cases ***
   
   Set start and end dates of a period BEFORE the flood. Make sure it is long enough for 
   Sentinel-1 to acquire an image (repitition rate = 6 days). Adjust these parameters, if
   your ImageCollections (see Console) do not contain any elements.*/

// Set the start and end dates to be used as pre-event in YYYY-MM-DD format.
// suggested minimum 1 year
  var ref_start='2018-01-01'
  var ref_end='2019-10-01'
// Now set the same parameters for AFTER the crisis event in YYYY-MM-DD format.
  var crisis_start='2019-10-13'
  var crisis_end='2019-10-14'


/********************************************************************************************
                           SET SAR PARAMETERS (can be left default)*/
var polarization = "VV"; /*or 'VH' --> VH mostly is the prefered polarization for flood mapping.
                           However, it always depends on your study area, you can select 'VV' 
                           as well.*/ 
var pass_direction = "DESCENDING"; /* or 'ASCENDING'when images are being compared use only one 
                           pass direction. Consider changing this parameter, if your image 
                           collection is empty. In some areas more Ascending images exist than 
                           than descending or the other way around.*/

var relative_orbit=50; // Relative Orbit covering the incident

var factor=2 // Set multiplicative value of the stdDev to identify oil spill as anomaly
 
///////////////////////////////////////////////////////
// USE CASE DEMONSTRATOR SELECTION      
// Default k=4 means that the user input parameters will be used for the analysis
var k=4  // [0:RedSea ;1:Kuwait; 2:Corsica]
var usecase=['RedSea','Kuwait','Corsica']              
print(usecase[k])
////////////////////////////////////////////////////////

switch (usecase[k]) {
  case 'RedSea':
    ref_start='2018-01-01';
    ref_end='2019-10-01';
    crisis_start='2019-10-13';
    crisis_end='2019-10-14';
    factor=2;
    aoi=geometry;
    smallaoi=geometry2;
    relative_orbit=50
    break;
  case 'Kuwait':
    ref_start='2017-01-01';
    ref_end='2017-08-01';
    crisis_start='2017-08-10';
    crisis_end='2017-08-11';
    factor=1;
    aoi=geometry3;
    smallaoi=geometry4;
    relative_orbit=108
    break;
  case 'Corsica':
    ref_start='2017-01-01';
    ref_end='2018-10-01';
    crisis_start='2018-10-07';
    crisis_end='2018-10-10';
    factor=2;
    aoi=geometry5;
    smallaoi=geometry6;
    pass_direction = "ASCENDING"
    relative_orbit=15;
    break;
  default:
    print('Default')
    break;
}
Map.centerObject(aoi,7);


/********************************************************************************************
  ---->>> DO NOT EDIT THE SCRIPT PAST THIS POINT! (unless you know what you are doing) <<<---
  ------------------>>> now hit the'RUN' at the top of the script! <<<-----------------------
  -----> The final flood product will be ready for download on the right (under tasks) <-----

  ******************************************************************************************/

//---------------------------------- Translating User Inputs ------------------------------//

//------------------------------- DATA SELECTION & PREPROCESSING --------------------------//
// Load the Sentinel-1 GRD data (linear units) and filter by predefined parameters
var S1=ee.ImageCollection("COPERNICUS/S1_GRD")
    .filterBounds(aoi)
    .select(polarization)
    .filter(ee.Filter.eq('orbitProperties_pass',pass_direction)) 
    .filter(ee.Filter.eq('relativeOrbitNumber_start',relative_orbit ))


// Defining crisis dataset
var crisisVV = S1.filterDate(crisis_start,crisis_end).mean().clip(aoi).rename('VV')
crisisVV=crisisVV.focal_max(30, 'square', 'meters').rename('VV')
Map.addLayer(crisisVV,{min:-30,max:0},'crisisVV',1,1)

// Defining reference dataset
var refVVmedian=S1.filterDate(ref_start,ref_end).median().clip(aoi).rename('VV')
Map.addLayer(refVVmedian,{min:-30,max:0},'refVVmedian',1,0)

///////////////////////////////////////////////////
// Computing difference and selecting threshold
/////////////////////////////////////////////////////

var difference=refVVmedian.subtract(crisisVV)
var reducer1 = ee.Reducer.mean();
var reducers = reducer1.combine({reducer2: ee.Reducer.median(), sharedInputs: true})
                       .combine({reducer2: ee.Reducer.stdDev(), sharedInputs: true});

var results = difference.reduceRegion({reducer: reducers,
                                geometry: smallaoi,
                                scale:10,
                                bestEffort: true});
//print(results.get('VV_mean'));
print('StdDev of difference between reference and crisis images')
print(results.get('VV_stdDev'));

var oilspill=refVVmedian.subtract(crisisVV).gt(ee.Image(factor*results.get('VV_stdDev').getInfo()))
var oilspill=refVVmedian.subtract(crisisVV).gt(6)

Map.addLayer(oilspill,{min:0,max:1},'oilspill',1,0)

///////////////////////////////////
//// Cleaning up noisy points
///////////////////////////////////
var cleaned=oilspill.focal_max().focal_min();
var connections = cleaned.connectedPixelCount();    
var cleaned = cleaned.updateMask(connections.gte(8));
Map.addLayer(cleaned, {}, 'cleaned',1,0);

///////////////////////////////////////
// Masking land using DEM 
///////////////////////////////////////
var dem=ee.Image("CGIAR/SRTM90_V4")
var dem_mask=dem.unmask().add(ee.Image(1)).lte(1)
Map.addLayer(dem_mask, {}, 'demmask',1,0);
var mask = cleaned.where(dem_mask.and(cleaned),1);

var final_oil = cleaned.updateMask(mask);
Map.addLayer(final_oil, {palette:'red'}, 'final_oil',1,1);


//------------------------------------- EXPORTS ------------------------------------//
// Export flooded area as TIFF file 
Export.image.toDrive({
  image: final_oil, 
  description: 'Oilspill_extent_raster',
  fileNamePrefix: 'Oil_spill_S1',
  region: final_oil.geometry(), 
  maxPixels: 1e10
});
// Convert flood raster to polygons
var final_oil_vec = final_oil.reduceToVectors({
  scale: 10,
  geometryType:'polygon',
  geometry: final_oil.geometry(),
  eightConnected: true,
  bestEffort:true,
  tileScale:16,
});

// Export flood polygons as shape-file
Export.table.toDrive({
  collection:final_oil_vec,
  description:'Oilspill_extent_vector',
  fileFormat:'SHP',
  fileNamePrefix:'Oilspill_vec'
});