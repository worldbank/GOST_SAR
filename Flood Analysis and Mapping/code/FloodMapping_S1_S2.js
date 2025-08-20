/*===========================================================================================
       SAR-FLOOD MAPPING USING THE SAR NDFI and Optical MNDWI APPROACH
  ===========================================================================================
  
  This script creates a combined flood map using Sentinel-1 and Sentinel-2 satellite images.
  
* For deriving a flood map using Sentinel-1, we rely on the NDFI index [Normalised Difference Flood Index approach defined in Cian et al.(2018) 
  https://doi.org/10.1016/j.rse.2018.03.006].
  NDFI is the index that is able to detect bare soil flood surfaces based on dry reference average and minimum of reference+flood images.
  Additionally, this index needs to be filtered using the NDFI_thr threshold to consider all values above that threshold as water.
  
* For deriving the flood map using Sentinel-2, we use the MNDWI index [Rokni et al (2014) https://doi:10.3390/rs6054173] 
  MNDWI is a modified water index using the statistics of SWIR and GREEN bands. We have tuned that threshold for the specific case of South Sudan.
  This index is further filtered considering all values above the defined MNDWI_thr threshold as water.

*******************************************************************************************
/*******************************************************************************************
                                  SELECT YOUR OWN STUDY AREA   

   The user can :
   1) select a full country by changing the countryname variable or;
   2) use the polygon-tool in the top left corner of the map pane to draw the shape of your 
   study area. Single clicks add vertices, double-clicking completes the polygon.
   **CAREFUL**: Under 'Geometry Imports' (top left in map panel) uncheck the 
               geometry box, so it does not block the view on the imagery later.
   3) load a shapefile stored in the user Assets collection */
   
   // 1)  Choose country name
   var countryname='Timor-Leste'
   var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
   var aoi = countries.filter(ee.Filter.eq('country_na', countryname));
   Map.addLayer(aoi,{},'AoI')
   Map.centerObject(aoi,8);

   /* 2) Use a user defined geometry.
    Uncomment the two lines below if you want to use a defined geometry as AoI */
   //var aoi = ee.FeatureCollection(geometry);
   //Map.centerObject(aoi,8);

  /* 3) Load a shapefile from Assets collection.
  Uncomment and modify the lines below if you want to use a shapefile stored in your assets
  var aoi= ee.FeatureCollection('users/josemanueldelgadoblasco/ST2_UNOSAT_Flood_Nigeria202008')
  //Map.centerObject(aoi,8);

/*******************************************************************************************/
//                                       SET TIME FRAME                                       
//    - Start and stop dates for the flood season - to be used for the S1 and S2 analysis      
      var S1S2_flood_start = '2021-04-01';
      var S1S2_flood_end = '2021-04-11';
//      - Start and stop dates for the dry season - for Sentinel-1
      /// full period for Sentinel-1 reference (dry) median image estimation
      var S1drystart='2015-01-01';
      var S1dryend='2020-03-31';
//      - start/stop month for reference season of Sentinel-1 (e.g December to March) from the time interval
//        specified above. Please adjust these months as per the local context to highlight the dry periods. 
//        These parameters are important in order to select a realistic reference period, as in many cases 
//        African countries had seasonal floods that need not to be considered while computing median of dry 
//        season.
      var S1startMonth=12;
      var S1endMonth=3;
///   
/********************************************************************************************/
//                                  SET FLOOD MAP THRESHOLDS
/// - The NDFI index needs to be applied a threshold to identify as water all values above that defined threshold (typical values in the range [0.6,0.75])
        var NDFI_thr=0.6;    // Valid range [0.6 , 0.75]
/// - The MNDWI index needs a threshold that would consider water values above the defined threshold. Typical value is 0.2 and it creates a flood binary mask for values above 0.2.
        var MNDWI_thr=0.2;  // Default 0.2

/********************************************************************************************/
//                                  SET S1 PARAMETERS
//Set up polarization "VV" or "VH" 
var polarization = "VV" /*or 'VH' --> VH mostly is the prefered polarization for flood mapping.
                           However, it always depends on your study area, you can select 'VV' 
                           as well.*/
//Set up pass direction, which can be ASCENDING or DESCENDING                          
var pass_direction = "ASCENDING"; /* or 'DESCENDING'when images are being compared use only one 
                           pass direction. Consider changing this parameter, if your image 
                           collection is empty. In some areas more Ascending images exist than 
                           than descending or the other way around.*/
                           
/********************************************************************************************
  ---->>> DO NOT EDIT THE SCRIPT PAST THIS POINT! (unless you know what you are doing) <<<---
  ------------------>>> now hit the'RUN' at the top of the script! <<<-----------------------
  -----> The final flood product will be ready for download on the right (under tasks) <-----

  ******************************************************************************************/

//zoom to the Area of Interest
Map.centerObject(aoi,6)

/**************************** Compute Flood Mask using Sentinel 2 ************************/

var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED").filterDate(S1S2_flood_start, S1S2_flood_end).filterBounds(aoi);

///// Apply function for removing clouds from the optical image
// Bits 10 and 11 are clouds and cirrus, respectively.
var cloudBitMask = ee.Number(2).pow(10).int();
var cirrusBitMask = ee.Number(2).pow(11).int();

function maskS2clouds(image) {
  var qa = image.select('QA60');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask);
}
var cloudMasked = s2.map(maskS2clouds);

var median = cloudMasked.median().clip(aoi);
var b3med = cloudMasked.select('B3').median()
var b11p  = cloudMasked.select('B11').reduce(ee.Reducer.percentile([10])).rename('B11')

//Compute MNDWI index
var mndwi = b3med.clip(aoi)
                .addBands(b11p.clip(aoi))
                .normalizedDifference(['B3','B11']).select(['nd'],['mndwi']);
  
//compute flood mask using MNDWI for the defined AOI
var flood=(mndwi.gt(MNDWI_thr)).clip(aoi)

// Refine flood result using additional datasets
      var difference_binary = flood
      // Include JRC layer on surface water seasonality to mask flood pixels from areas
      // of "permanent" water (where there is water > 10 months of the year)
      var swater = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('seasonality');
      var swater_mask = swater.gte(10).updateMask(swater.gte(10));
      
      //Flooded layer where perennial water bodies (water > 10 mo/yr) is assigned a 0 value
      var flooded_mask = difference_binary.where(swater_mask,0);
      // final flooded area without pixels in perennial waterbodies
      var S2flooded = flooded_mask.updateMask(flooded_mask);
      
      // Compute connectivity of pixels to eliminate those connected to 8 or fewer neighbours
      // This operation reduces noise of the flood extent product 
      var connections = S2flooded.connectedPixelCount();    
      var S2flooded = S2flooded.updateMask(connections.gte(8));
      
      // Mask out areas with more than 5 percent slope using a Digital Elevation Model 
      var DEM = ee.Image('WWF/HydroSHEDS/03VFDEM');
      var terrain = ee.Algorithms.Terrain(DEM);
      var slope = terrain.select('slope');
      var S2flooded = S2flooded.updateMask(slope.lt(5));
      
      //Add layer to map
      Map.addLayer(S2flooded.updateMask(S2flooded),{palette:'aqua'},'S2 Flood Extent', true)

      // Export layer
Export.image.toDrive({
  image: S2flooded,
  description: 'S2_flood_map',
  scale: 20,
  crs: 'EPSG:32636',
  folder: 'SouthSudanFlood',
  region: aoi, 
  maxPixels:1E13}); 

/**************************** Compute Flood Mask using Sentinel 1 ************************/

// Load the Sentinel-1 ImageCollection.
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD_FLOAT');

// Filter by metadata properties.
var VV = sentinel1
  // Filter to get images with VV and VH dual polarization.
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', polarization))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .select(polarization)
  .filterBounds(aoi);

// Filter by flood date
var floodcol = VV.filterDate(S1S2_flood_start,S1S2_flood_end);
var flood_Min = floodcol.filter(ee.Filter.notEquals('system:index','S1B_IW_GRDH_1SDV_20200801T033355_20200801T033420_022724_02B20F_333C')).min().clip(aoi)
//Map.addLayer(flood_Min,{min:0,max:0.4},'S1 sigma rainy')

// Filter by reference date
var reference = VV.filterDate(S1drystart,S1dryend)
var reference = reference.filter(ee.Filter.calendarRange(S1startMonth,S1endMonth,'month')).median().clip(aoi)
//Map.addLayer(reference,{min:0,max:0.4},'S1 sigma reference')
// Compute NDFI with VV
var NDFI_D = (reference.subtract(flood_Min)).divide(reference.add(flood_Min));

// Thresholding
var FloodExtent = NDFI_D.gt(NDFI_thr).clip(aoi);
//Map.addLayer(FloodExtent.updateMask(FloodExtent),{min:0, max:1, palette:'orange'},'S1 Flood',false)

// Refine flood result using additional datasets
      var difference_binary = FloodExtent
      // Include JRC layer on surface water seasonality to mask flood pixels from areas
      // of "permanent" water (where there is water > 10 months of the year)
      var swater = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('seasonality');
      var swater_mask = swater.gte(10).updateMask(swater.gte(10));
      
      //Flooded layer where perennial water bodies (water > 10 mo/yr) is assigned a 0 value
      var flooded_mask = difference_binary.where(swater_mask,0);
      // final flooded area without pixels in perennial waterbodies
      var S1flooded = flooded_mask.updateMask(flooded_mask);
      
      // Compute connectivity of pixels to eliminate those connected to 8 or fewer neighbours
      // This operation reduces noise of the flood extent product 
      var connections = S1flooded.connectedPixelCount();
      var S1flooded = S1flooded.updateMask(connections.gte(8));
      
      // Mask out areas with more than 5 percent slope using a Digital Elevation Model 
      var DEM = ee.Image('WWF/HydroSHEDS/03VFDEM');
      var terrain = ee.Algorithms.Terrain(DEM);
      var slope = terrain.select('slope');
      var S1flooded = S1flooded.updateMask(slope.lt(5));

Map.addLayer(S1flooded.updateMask(S1flooded),{palette:'red'},'S1 Flood Extent',true)

/// Exporting flood map
Export.image.toDrive({
  image: S1flooded,
  description: 'S1_flood',
  folder: 'SouthSudan',
  scale: 20,
  crs: 'EPSG:32636',
  region: aoi, 
  maxPixels:1E13});

/**************************** MERGE S1 AND S2 Flood Masks *****************************/

var total_binary_flood=(S1flooded.unmask()).add(S2flooded.unmask())
var total_flood=total_binary_flood.updateMask(total_binary_flood)
Map.addLayer(total_flood,{min:0,max:1,palette:'navy'},'S1S2 Flood Extent',true)

/// Exporting merged flood map
Export.image.toDrive({
  image: total_flood,
  description: 'S1S2_flood',
  folder: 'SouthSudan',
  scale: 20,
  crs: 'EPSG:32636',
  region: aoi, 
  maxPixels:1E13});

//-------------------------  DAMAGE ASSSESSMENT FROM UN-SPIDER  -----------------------//
//----------------------------- Exposed population density ----------------------------//

/// Load WorldPop Population Density layer
// Resolution: 100. Number of people per cell is given.

// Define clip tool 
var clipToCol = function(image){
  return image.clip(aoi);
};

var worldPop = ee.ImageCollection("WorldPop/GP/100m/pop").map(clipToCol).filterDate('2020');
var population_count = worldPop.select('population').mosaic();

// Create a raster showing exposed population only using the resampled flood layer
var population_exposed = population_count
  .updateMask(total_flood)
  .updateMask(population_count);

//Sum pixel values of exposed population raster 
var stats = population_exposed.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 100,
  tileScale: 16,
  maxPixels:1e9 
});

// get number of exposed people as integer
var number_pp_exposed = stats.getNumber('population').round();


//----------------------------- Affected agricultural land ----------------------------//


//using Copernicus Global Land Service (CGLS) at 100m resolution
var LC = ee.Image("COPERNICUS/Landcover/100m/Proba-V-C3/Global/2019")
.select('discrete_classification').clip(aoi)

// Extract only cropland pixels using the class: Cultivated and managed vegetation / agriculture.
var cropmask = LC
  .eq(40)
var cropland = LC
  .updateMask(cropmask)
  
// get CGLS projection
var MODISprojection = LC.projection();

// Reproject flood layer to CGLS scale
var flooded_res = total_flood
    .reproject({
    crs: MODISprojection
  });

// Calculate affected cropland using the resampled flood layer
var cropland_affected = flooded_res
  .updateMask(cropland)

// get pixel area of affected cropland layer
var crop_pixelarea = cropland_affected
  .multiply(ee.Image.pixelArea()); //calcuate the area of each pixel 

// sum pixels of affected cropland layer
var crop_stats = crop_pixelarea.reduceRegion({
  reducer: ee.Reducer.sum(), //sum all pixels with area information                
  geometry: aoi,
  scale: 100,
  tileScale: 16,
  maxPixels: 1e9
  });

// convert area to hectares
var crop_area_ha = crop_stats
  .getNumber(polarization)
  .divide(10000)
  .round();
print("crop_Area",crop_area_ha)

//-------------------------------- Affected urban area ------------------------------//

// Using the same CGLS Land Cover Product 
// Filter urban areas
var urbanmask = LC.eq(50)
var urban = LC
  .updateMask(urbanmask)

//Calculate affected urban areas using the resampled flood layer
var urban_affected = urban
  .mask(flooded_res)
  .updateMask(urban);

// get pixel area of affected urban layer
var urban_pixelarea = urban_affected
  .multiply(ee.Image.pixelArea()); //calcuate the area of each pixel 

// sum pixels of affected cropland layer
var urban_stats = urban_pixelarea.reduceRegion({
  reducer: ee.Reducer.sum(), //sum all pixels with area information                
  geometry: aoi,
  scale: 100,
  tileScale: 16,
  bestEffort: true,
  });

// convert area to hectares
var urban_area_ha = urban_stats
  .getNumber('discrete_classification')
  .divide(10000)
  .round();
print("urban_area:",urban_area_ha)

//------------------------------  DISPLAY PRODUCTS  ----------------------------------//

// Population Density
var populationCount_vis = {
  "max": 1000.0,
  "palette": [
    "ffffe7",
    "86a192",
    "509791",
    "307296",
    "2c4484",
    "000066"
  ],
  "min": 0.0
};
Map.addLayer(population_count, populationCount_vis, 'Population Density',0);

// Exposed Population
var populationExposedVis = {
  min: 0,
  max: 200.0,
  palette: ['yellow', 'orange', 'red'],
};
Map.addLayer(population_exposed, populationExposedVis, 'Exposed Population');

// Copernicus Land Cover

Map.addLayer(LC, {}, 'Land Cover');

// Cropland
var croplandVis = {
  min: 0,
  max: 14.0,
  palette: ['30b21c'],
};
Map.addLayer(cropland, croplandVis, 'Cropland',0)

// Affected cropland
Map.addLayer(cropland_affected, croplandVis, 'Affected Cropland'); 

// Urban
var urbanVis = {
  min: 0,
  max: 13.0,
  palette: ['grey'],
};
Map.addLayer(urban, urbanVis, 'Urban',0)

// Affected urban
Map.addLayer(urban_affected, urbanVis, 'Affected Urban'); 

// Create a raster layer containing the area information of each pixel 
var flood_pixelarea = total_flood.select(polarization)
  .multiply(ee.Image.pixelArea());

// Sum the areas of flooded pixels
// default is set to 'bestEffort: true' in order to reduce compuation time, for a more 
// accurate result set bestEffort to false and increase 'maxPixels'. 
var flood_stats = flood_pixelarea.reduceRegion({
  reducer: ee.Reducer.sum(),              
  geometry: aoi,
  scale: 10, // native resolution 
  //maxPixels: 1e9,
  bestEffort: true
  });

// Convert the flood extent to hectares (area calculations are originally given in meters)  
var flood_area_ha = flood_stats
  .getNumber(polarization)
  .divide(10000)
  .round();

//---------------------------------- MAP PRODUCTION --------------------------------//

//-------------------------- Display the results on the map -----------------------//

// set position of panel where the results will be displayed 
var results = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px',
    width: '350px'
  }
});

//Prepare the visualtization parameters of the labels 
var textVis = {
  'margin':'0px 8px 2px 0px',
  'fontWeight':'bold'
  };
var numberVIS = {
  'margin':'0px 0px 15px 0px', 
  'color':'bf0f19',
  'fontWeight':'bold'
  };
var subTextVis = {
  'margin':'0px 0px 2px 0px',
  'fontSize':'12px',
  'color':'grey'
  };

var titleTextVis = {
  'margin':'0px 0px 15px 0px',
  'fontSize': '18px', 
  'font-weight':'', 
  'color': '3333ff'
  };

// Create lables of the results 
// Titel and time period
var title = ui.Label('Results', titleTextVis);
var text1 = ui.Label('Flood status between:',textVis);
var number1 = ui.Label(S1S2_flood_start.concat(" and ",S1S2_flood_end),numberVIS);

// Alternatively, print dates of the selected tiles
//var number1 = ui.Label('Please wait...',numberVIS); 
//(after_collection).evaluate(function(val){number1.setValue(val)}),numberVIS;

// Extract date from meta data
      function dates(imgcol){
        var range = imgcol.reduceColumns(ee.Reducer.minMax(), ["system:time_start"]);
        var printed = ee.String('from ')
          .cat(ee.Date(range.get('min')).format('YYYY-MM-dd'))
          .cat(' to ')
          .cat(ee.Date(range.get('max')).format('YYYY-MM-dd'));
        return printed;
      }

// Estimated flood extent 
var text2 = ui.Label('Estimated flood extent:',textVis);
var text2_2 = ui.Label('Please wait...',subTextVis);
dates(floodcol).evaluate(function(val){text2_2.setValue('based on Senintel-1 imagery '+val)});
var number2 = ui.Label('Please wait...',numberVIS); 
flood_area_ha.evaluate(function(val){number2.setValue(val+' hectares')}),numberVIS;

// Estimated number of exposed people
var text3 = ui.Label('Estimated number of exposed people: ',textVis);
var text3_2 = ui.Label('based on WorldPop 2020 (100m)',subTextVis);
var number3 = ui.Label('Please wait...',numberVIS);
number_pp_exposed.evaluate(function(val){number3.setValue(val)}),numberVIS;

// Estimated area of affected cropland 
var MODIS_date = ee.String(LC.get('system:index')).slice(0,4);
var text4 = ui.Label('Estimated affected cropland:',textVis);
var text4_2 = ui.Label('Please wait', subTextVis)
MODIS_date.evaluate(function(val){text4_2.setValue('based on Copernicus Land Service '+val +' (100m)')}), subTextVis;
var number4 = ui.Label('Please wait...',numberVIS);
crop_area_ha.evaluate(function(val){number4.setValue(val+' hectares')}),numberVIS;

// Estimated area of affected urban
var text5 = ui.Label('Estimated affected urban areas:',textVis);
var text5_2 = ui.Label('Please wait', subTextVis)
MODIS_date.evaluate(function(val){text5_2.setValue('based on Copernicus Land Service '+val +' (100m)')}), subTextVis;
var number5 = ui.Label('Please wait...',numberVIS);
urban_area_ha.evaluate(function(val){number5.setValue(val+' hectares')}),numberVIS;

// Disclaimer
var text6 = ui.Label('Disclaimer: This product has been derived automatically without validation data. All geographic information has limitations due to the scale, resolution, date and interpretation of the original source materials. No liability concerning the content or the use thereof is assumed by the producer.',subTextVis)

// Produced by...
var text7 = ui.Label('Damage assessment code from: UN-SPIDER December 2019', subTextVis)
var text8 = ui.Label('Modified by: Geospatial Operations Support Team, World Bank, November 2020', subTextVis)

// Add the labels to the panel 
results.add(ui.Panel([
        title,
        text1,
        number1,
        text2,
        text2_2,
        number2,
        text3,
        text3_2,
        number3,
        text4,
        text4_2,
        number4,
        text5,
        text5_2,
        number5,
        text6,
        text7,
        text8]
      ));

// Add the panel to the map 
Map.add(results);

//----------------------------- Display legend on the map --------------------------//

// Create legend (*credits to thisearthsite on Open Geo Blog: https://mygeoblog.com/2016/12/09/add-a-legend-to-to-your-gee-map/)
// set position of panel
var legend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px',
  }
});
 
// Create legend title
var legendTitle = ui.Label('Legend',titleTextVis);
 
// Add the title to the panel
legend.add(legendTitle);
 
// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
 
      // Create the label that is actually the colored box.
      var colorBox = ui.Label({
        style: {
          backgroundColor: color,
          // Use padding to give the box height and width.
          padding: '8px',
          margin: '0 0 4px 0'
        }
      });
 
      // Create the label filled with the description text.
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px'}
      });
 
      // return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};
 
//  Palette with the colors
var palette =['#0000FF', '#30b21c', 'grey'];
 
// name of the legend
var names = ['potentially flooded areas','affected cropland','affected urban'];
 
// Add color and and names
for (var i = 0; i < 3; i++) {
  legend.add(makeRow(palette[i], names[i]));
  }  

// Create second legend title to display exposed population density
var legendTitle2 = ui.Label({
value: 'Exposed population density',
style: {
fontWeight: 'bold',
fontSize: '15px',
margin: '10px 0 0 0',
padding: '0'
}
});

// Add second title to the panel
legend.add(legendTitle2);

// create the legend image
var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply((populationExposedVis.max-populationExposedVis.min)/100.0).add(populationExposedVis.min);
var legendImage = gradient.visualize(populationExposedVis);
 
// create text on top of legend
var panel = ui.Panel({
widgets: [
ui.Label('> '.concat(populationExposedVis['max']))
],
});
 
legend.add(panel);
 
// create thumbnail from the image
var thumbnail = ui.Thumbnail({
image: legendImage,
params: {bbox:'0,0,10,100', dimensions:'10x50'},
style: {padding: '1px', position: 'bottom-center'}
});
 
// add the thumbnail to the legend
legend.add(thumbnail);
 
// create text on top of legend
var panel = ui.Panel({
widgets: [
ui.Label(populationExposedVis['min'])
],
});
 
legend.add(panel);
 
// add legend to map (alternatively you can also print the legend to the console)
Map.add(legend);
