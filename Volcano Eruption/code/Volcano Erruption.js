/*===========================================================================================
                       VOLCANO ERUPTION USING A CHANGE DETECTION APPROACH
  ==========================================================================================
  Within this script SAR Sentinel-1 is being used to generate a map of the lava extent following
  a volcano eruption. A change detection approach was chosen, where a before- and after event 
  image will be compared. 
  Sentinel-1 GRD imagery is being used.   Ground Range Detected imagery includes the following
  preprocessing steps: Thermal-Noise Removal, Radiometric calibration, Terrain-correction 
  hence only a Speckle filter needs to be applied in the preprocessing.  

  ===========================================================================================

  :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
                                      RUN A DEMO (optional)

   If you would like to run an example of mapping the lava extent you can use the predefined 
   geometry below as well as the other predefined parameter settings. The code will take you
   to Goma, DRC where the eruption of Mount Nyiragongo volcano on 22 May killed 30 people and 
   destroyed more than 3500 homes together with important infrastructure.

/* Now hit Run to start the demo! 
   Do not forget to delete/outcomment this geometry before creating a new one!
  :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

  *******************************************************************************************
                                  SELECT YOUR OWN STUDY AREA   

   The user can :
   1) select a full country by changing the countryname variable or;
   2) use the polygon-tool in the top left corner of the map pane to draw the shape of your 
   study area. Single clicks add vertices, double-clicking completes the polygon.
   **CAREFUL**: Under 'Geometry Imports' (top left in map panel) uncheck the 
               geometry box, so it does not block the view on the imagery later.
   3) load a shapefile stored in the user Assets collection */
   
   // 1)  Choose country name
   var countryname='Congo'
   var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
   var aoi = countries.filter(ee.Filter.eq('country_na', countryname));
   Map.addLayer(aoi,{},'AoI')
   Map.centerObject(aoi,8);

   /* 2) Use a user defined geometry.
    Uncomment the two lines below if you want to use a defined geometry as AoI */
   var aoi = ee.FeatureCollection(geometry);
   Map.centerObject(aoi,8);

  /* 3) Load a shapefile from Assets collection.
  Uncomment and modify the lines below if you want to use a shapefile stored in your assets
  var aoi= ee.FeatureCollection('users/GOST_WBG/AOI_Goma')
  //Map.centerObject(aoi,8);

  *******************************************************************************************
                                       SET TIME FRAME

   Set start and end dates of a period BEFORE the event. Make sure it is long enough for 
   Sentinel-1 to acquire an image (repitition rate = 6 days). Adjust these parameters, if
   your ImageCollections (see Console) do not contain any elements.*/


var before_start= '2021-01-01';
var before_end='2021-05-10';

// Now set the same parameters for AFTER the event.
var after_start='2021-05-25';
var after_end='2021-06-01';

/********************************************************************************************
                           SET SAR PARAMETERS (can be left default)*/

var polarization = "VH"; /*or 'VV' --> VH mostly is the prefered polarization for lava flow mapping
                           However, it always depends on your study area, you can select 'VV' 
                           as well.*/ 
var pass_direction = "ASCENDING"; /* or 'ASCENDING'when images are being compared use only one 
                           pass direction. Consider changing this parameter, if your image 
                           collection is empty. In some areas more Ascending images exist than 
                           than descending or the other way around.*/
var factor = 1.5;           /*multiplicative factor to std to get lava extent map (1,2,3)*/
var th= -16;            // threshold for sigma0 on water (suggested values are-13 for VV and -17.5 for VH)
var relative_orbit = 174
/********************************************************************************************
  ---->>> DO NOT EDIT THE SCRIPT PAST THIS POINT! (unless you know what you are doing) <<<---
  ------------------>>> now hit the'RUN' at the top of the script! <<<-----------------------
  -----> The final product will be ready for download on the right (under tasks) <-----

  ******************************************************************************************/

//---------------------------------- Translating User Inputs ------------------------------//

//------------------------------- DATA SELECTION & PREPROCESSING --------------------------//

// Load and filter Sentinel-1 GRD data by predefined parameters 
var collection= ee.ImageCollection('COPERNICUS/S1_GRD')
  .filter(ee.Filter.eq('instrumentMode','IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', polarization))
  .filter(ee.Filter.eq('orbitProperties_pass',pass_direction)) 
  .filter(ee.Filter.eq('resolution_meters',10))
  .filter(ee.Filter.eq('relativeOrbitNumber_start',relative_orbit ))
  .filterBounds(aoi)
  .select(polarization);
  
// Select images by predefined dates
var before_collection = collection.filterDate(before_start, before_end);
var after_collection = collection.filterDate(after_start,after_end);

// Print selected tiles to the console

      // Extract date from meta data
      function dates(imgcol){
        var range = imgcol.reduceColumns(ee.Reducer.minMax(), ["system:time_start"]);
        var printed = ee.String('from ')
          .cat(ee.Date(range.get('min')).format('YYYY-MM-dd'))
          .cat(' to ')
          .cat(ee.Date(range.get('max')).format('YYYY-MM-dd'));
        return printed;
      }
      // print dates of before images to console
      var before_count = before_collection.size();
      print(ee.String('Tiles selected: Before Eruption ').cat('(').cat(before_count).cat(')'),
        dates(before_collection), before_collection);
      
      // print dates of after images to console
      var after_count = before_collection.size();
      print(ee.String('Tiles selected: After Eruption ').cat('(').cat(after_count).cat(')'),
        dates(after_collection), after_collection);


var before_filtered = before_collection.select(polarization).median().clip(aoi);
var before_std = before_collection.select(polarization).reduce(ee.Reducer.stdDev()).clip(aoi);

var after_filtered = after_collection.select(polarization).min().clip(aoi);
var after_std =  after_collection.reduce(ee.Reducer.stdDev());

//------------------------------- LAVA EXTENT CALCULATION -------------------------------//

// Calculate the difference between the before and after images
var difference = after_filtered.divide(before_filtered);
var difference_binary = after_filtered.lt(th).and(after_filtered.lt(before_filtered.subtract(before_std.multiply(factor)))).clip(aoi)//.and(before_filteredVV.gt(thVV))


var lava_mask = difference_binary .where(difference_binary,1);
var lava = lava_mask.updateMask(lava_mask);

 // Compute connectivity of pixels to eliminate those connected to 8 or fewer neighbours
// This operation reduces noise of the flood extent product 
var connections = lava.connectedPixelCount();    
var lava = lava.updateMask(connections.gte(8));

// Calculate lava extent area
// Create a raster layer containing the area information of each pixel 
var lava_pixelarea = lava.select(polarization)
  .multiply(ee.Image.pixelArea());

// Sum the areas of lava covered pixels
// default is set to 'bestEffort: true' in order to reduce compuation time, for a more 
// accurate result set bestEffort to false and increase 'maxPixels'. 
var lava_stats = lava_pixelarea.reduceRegion({
  reducer: ee.Reducer.sum(),              
  geometry: aoi,
  tileScale:4,
  scale: 10, // native resolution 
  //maxPixels: 1e9,
  bestEffort: true
  });

// Convert the lava extent to hectares (area calculations are originally given in meters)  
var lava_area_ha = lava_stats
  .getNumber(polarization)
  .divide(10000)
  .round();   


//------------------------------  DAMAGE ASSSESSMENT  ----------------------------------//

//----------------------------- Exposed population density ----------------------------//

// Load WorldPop Population Density layer
// Resolution: 100. Number of people per cell is given.

// Define clip tool 
var clipToCol = function(image){
  return image.clip(aoi);
};

var worldPop = ee.ImageCollection("WorldPop/GP/100m/pop").map(clipToCol).filterDate('2020');
var population_count = worldPop.select('population').mosaic();

// Create a raster showing exposed population only using the resampled lava layer
var population_exposed = population_count
  .updateMask(lava)
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

// Reproject lava layer to CGLS scale
var lava_res = lava
    .reproject({
    crs: MODISprojection
  });

// Calculate affected cropland using the resampled lava layer
var cropland_affected = lava_res
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
print("crop_Area",crop_area_ha);


//-------------------------------- Affected urban area ------------------------------//
// Using the same CGLS Land Cover Product 
// Filter urban areas
var urbanmask = LC.eq(50)
var urban = LC
  .updateMask(urbanmask)

//Calculate affected urban areas using the resampled lava layer
var urban_affected = urban
  .mask(lava_res)
  .updateMask(urban);

// get pixel area of affected urban layer
var urban_pixelarea = urban_affected
  .multiply(ee.Image.pixelArea()); //calcuate the area of each pixel 

// sum pixels of affected urban layer
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

// Before and after lava SAR mosaic
Map.centerObject(aoi,8);
Map.addLayer(before_filtered, {min:-25,max:0}, 'Before Volcano Eruption',0);
Map.addLayer(after_filtered, {min:-25,max:0}, 'After Volcano Eruption',1);

// Difference layer
Map.addLayer(difference,{min:0,max:2},"Difference Layer",0);


// Population Density
var populationCountVis = {
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
Map.addLayer(population_count, populationCountVis, 'Population Density',0);

// Exposed Population
var populationExposedVis = {
  min: 0,
  max: 200.0,
  palette: ['yellow', 'orange', 'red'],
};
Map.addLayer(population_exposed, populationExposedVis, 'Exposed Population');

// Land Cover
Map.addLayer(LC, {}, 'Land Cover',0)

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

// Lava extent
Map.addLayer(lava,{palette:"6c3643"},'Lava extent');

//------------------------------------- EXPORTS ------------------------------------//
// Export area as TIFF file 
Export.image.toDrive({
  image: lava, 
  description: 'Lava_extent_raster',
  fileNamePrefix: 'lava',
  region: aoi, 
  maxPixels: 1e10
});

// Export area as shapefile (for further analysis in e.g. QGIS)
// Convert raster to polygons
var lava_vec = lava.reduceToVectors({
  scale: 10,
  geometryType:'polygon',
  geometry: aoi,
  eightConnected: false,
  bestEffort:true,
  tileScale:2,
});

// Export polygons as shape-file
Export.table.toDrive({
  collection:lava_vec,
  description:'Lava_extent_vector',
  fileFormat:'SHP',
  fileNamePrefix:'lava_vec'
});

// Export auxcillary data as shp?
// Exposed population density
Export.image.toDrive({
  image:population_exposed,
  description:'Exposed_Populuation',
  scale: 20,
  fileNamePrefix:'population_exposed',
  region: aoi,
  maxPixels:1e10
});

Export.image.toDrive({
  image:after_filtered,
  description:'Lava_sigma0VV',
  scale: 20,
  fileNamePrefix:'Lava_sigma0VV',
  region: aoi,
  maxPixels:1e12
});

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
var text1 = ui.Label('Lava extent status between:',textVis);
var number1 = ui.Label(after_start.concat(" and ",after_end),numberVIS);

// Alternatively, print dates of the selected tiles
//var number1 = ui.Label('Please wait...',numberVIS); 
//(after_collection).evaluate(function(val){number1.setValue(val)}),numberVIS;

// Estimated lava extent 
var text2 = ui.Label('Estimated lava extent:',textVis);
var text2_2 = ui.Label('Please wait...',subTextVis);
dates(after_collection).evaluate(function(val){text2_2.setValue('based on Senintel-1 imagery '+val)});
var number2 = ui.Label('Please wait...',numberVIS); 
lava_area_ha.evaluate(function(val){number2.setValue(val+' hectares')}),numberVIS;

// Estimated number of exposed people
var text3 = ui.Label('Estimated number of exposed people: ',textVis);
var text3_2 = ui.Label('based on WorldPop 2020 (100m)',subTextVis);
var number3 = ui.Label('Please wait...',numberVIS);
number_pp_exposed.evaluate(function(val){number3.setValue(val)}),numberVIS;

// Estimated area of affected cropland 
var MODIS_date = ee.String(LC.get('system:index')).slice(0,4);
var text4 = ui.Label('Estimated affected cropland:',textVis);
var text4_2 = ui.Label('Please wait', subTextVis)
MODIS_date.evaluate(function(val){text4_2.setValue('based on Copernicus Global Land Service ' +val +' (100m)')}), subTextVis;
var number4 = ui.Label('Please wait...',numberVIS);
crop_area_ha.evaluate(function(val){number4.setValue(val+' hectares')}),numberVIS;

// Estimated area of affected urban
var text5 = ui.Label('Estimated affected urban areas:',textVis);
var text5_2 = ui.Label('Please wait', subTextVis)
MODIS_date.evaluate(function(val){text5_2.setValue('based on Copernicus Global Land Service ' +val +' (100m)')}), subTextVis;
var number5 = ui.Label('Please wait...',numberVIS);
urban_area_ha.evaluate(function(val){number5.setValue(val+' hectares')}),numberVIS;

// Disclaimer
var text6 = ui.Label('Disclaimer: This product has been derived automatically without validation data. All geographic information has limitations due to the scale, resolution, date and interpretation of the original source materials. No liability concerning the content or the use thereof is assumed by the producer.',subTextVis)

// Produced by...
var text7 = ui.Label('Script produced by: UN-SPIDER December 2019', subTextVis)
var text8 = ui.Label('Modified by: Geospatial Operations Support Team, World Bank, June 2021', subTextVis)

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
var palette =['#6c3643', '#30b21c', 'grey'];
 
// name of the legend
var names = ['potential lava extent','affected cropland','affected urban'];
 
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


