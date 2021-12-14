
/*===========================================================================================
       SAR-CUMULATIVE FLOOD MAPPING USING THE NORMALISED DIFFERENCE FLOOD INDEX APPROACH
  ===========================================================================================
  
  Within this script SAR Sentinel-1 is being used to generate a cumulative flood extent map
  using the Normalised Difference Flood Index and Normalised Difference Flood over Vegetation
  Index approach defined in Cian et al.(2018) https://doi.org/10.1016/j.rse.2018.03.006 . 
  
  The NDFI provides information on flood over bare soil (mirror effect)
*******************************************************************************************
                                  SELECT YOUR OWN STUDY AREA   

   The user can :
   
   (unfortunately this script does not work for full-country analysis, we recommend selecting a small AOI for optimal results)
   
   1) use the polygon-tool in the top left corner of the map pane to draw the shape of your 
   study area. Single clicks add vertices, double-clicking completes the polygon.
   **CAREFUL**: Under 'Geometry Imports' (top left in map panel) uncheck the 
               geometry box, so it does not block the view on the imagery later.
   2) load a shapefile stored in the user Assets collection */
   
   /* 1) Use a user defined geometry.
    Uncomment the two lines below if you want to use a defined geometry as AoI */
   var aoi = ee.FeatureCollection(geometry);
   Map.centerObject(aoi,10);

  /* 2) Load a shapefile from Assets collection.
  Uncomment and modify the lines below if you want to use a shapefile stored in your assets
  var aoi= ee.FeatureCollection('users/GOST_WBG/ST2_UNOSAT_Flood_Nigeria202008')
  //Map.centerObject(aoi,8);
  /*******************************************************************************************
                                       SET TIME FRAME

   Set start and end dates of a period BEFORE the flood. Make sure it is long enough for 
   Sentinel-1 to acquire an image (repitition rate = 6 days). Adjust these parameters, if
   your ImageCollections (see Console) do not contain any elements.*/

// Set the start and end dates to be used as pre-event in YYYY-MM-DD format.
// suggested minimum 1 year
var before_start=ee.Date('2019-01-01');
var before_end=ee.Date('2020-03-31');

// Now set the same parameters for AFTER the flood in YYYY-MM-DD format.
var after_start = ee.Date('2020-06-01');
var after_end = ee.Date('2020-12-31');


/********************************************************************************************
                           SET SAR PARAMETERS (can be left default)*/
var polarization = "VV"; /*or 'VH' --> VH mostly is the prefered polarization for flood mapping.
                           However, it always depends on your study area, you can select 'VV' 
                           as well.*/ 
var pass_direction = "DESCENDING"; /* or 'ASCENDING'when images are being compared use only one 
                           pass direction. Consider changing this parameter, if your image 
                           collection is empty. In some areas more Ascending images exist than 
                           than descending or the other way around.*/
                           
var ndfi_thres= 0.6;    /* NDFI default threshold 0.7 (conservative)
                        It is not suggested to go lower than 0.6 */  
var ndfvi_thres= 0.65;  /* NDFVI default threshold 0.75 (conservative)
                        It is not suggested to go lower than 0.65 */
/********************************************************************************************
 *                        Show flood map per single image in collection */
var show = 'YES'         // 'YES' : to show all flood images individually
                        // 'NO': to show only cummulative flood map
/********************************************************************************************
  ---->>> DO NOT EDIT THE SCRIPT PAST THIS POINT! (unless you know what you are doing) <<<---
  ------------------>>> now hit the'RUN' at the top of the script! <<<-----------------------
  -----> The final flood product will be ready for download on the right (under tasks) <-----

  ******************************************************************************************/

//---------------------------------- Translating User Inputs ------------------------------//

//------------------------------- DATA SELECTION & PREPROCESSING --------------------------//
var collection = ee.ImageCollection('COPERNICUS/S1_GRD')
.filterBounds(aoi)
.filterDate(before_start, before_end)
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', polarization))
.filter(ee.Filter.eq('orbitProperties_pass',pass_direction)) 
.filter(ee.Filter.eq('instrumentMode', 'IW'))
.filterMetadata('resolution_meters', 'equals', 10)
.select(polarization)
  
Map.addLayer(aoi,{},'AoI')
Map.centerObject(aoi,6);

//Function to convert from dB
function toNatural(img) {
return ee.Image(10.0).pow(img.divide(10.0));
}

//Function to convert to dB
function toDB(img) {
return ee.Image(img).log10().multiply(10.0);
}

// creating Reference layer
var before_collection = collection.filterDate(before_start, before_end).map(toNatural);
var before_filteredVV = before_collection.median().clip(aoi).rename('VV');
print('before collection')
print(before_collection.size())

//////////////////////////////
// After collection
var collection = ee.ImageCollection('COPERNICUS/S1_GRD')
.filterBounds(aoi)
.filterDate(after_start, after_end)
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', polarization))
.filter(ee.Filter.eq('orbitProperties_pass',pass_direction)) 
.filter(ee.Filter.eq('instrumentMode', 'IW'))
.filterMetadata('resolution_meters', 'equals', 10)
.select(polarization)

print('After collection')
print(collection)

//////////////////////////////////
// Create unique date mosaics
//////////////////////////////////
// Difference in days between start and finish
var diff = after_end.difference(after_start, 'day')
// Make a list of all dates
var range = ee.List.sequence(0, diff.subtract(1)).map(function(day){return after_start.advance(day,'day')})
// Funtion for iteraton over the range of dates
var day_mosaics = function(date, newlist) {
  // Cast
  date = ee.Date(date)
  newlist = ee.List(newlist)
  // Filter collection between date and the next day
  var filtered = collection.filterDate(date, date.advance(1,'day')).map(toNatural)
  // Make the mosaic
  var image = ee.Image(filtered.min()).rename('VV').set('system:index',filtered.first().get('system:index')).set('system:time_start',filtered.first().get('system:time_start'))
  // Add the mosaic to a list only if the collection has images
  return ee.List(ee.Algorithms.If(filtered.size(), newlist.add(image), newlist))
}

// Iterate over the range to make a new list, and then cast the list to an imagecollection
var newcol = ee.ImageCollection(ee.List(range.iterate(day_mosaics, ee.List([]))))
print('New after collection')
print(newcol)

// Compute flood map for each image in the collection of the rainy period
var floods = newcol.map(function(image){
    //compute flood per each image
    var stack = ee.ImageCollection([before_filteredVV, image]);
    var mymin=stack.min()
    var mymax=stack.max()
    var ndfi=(before_filteredVV.subtract(mymin)).divide(before_filteredVV.add(mymin)).rename('ndfi')
    var flood=ndfi.gt(ndfi_thres).rename('flood').set('system:time_start',image.get('system:time_start'));
    return flood;
});
  
// Printing flood collection 
print('Floods')
print(floods)



////////////////////////////////////////////////////////////////////////
// Choosing if creating single flood map according to user selection
/////////////////////////////////////////////////////////////////////////
print(show)
switch(show) {
  case 'YES':
    create_layers()
    break;
  case 'NO':
    'User selected to create only cummulated flood map'
    break;
  default:
    // code block
}


function create_layers() {
  // Loop over the flood collection to export single flood map and flood vectors
  print('Creating single flood images')
  var size = floods.size().getInfo()
  var floods_list = floods.toList(size)
  print(floods_list)
  for (var n=0; n<size; n++) {
    var image = ee.Image(floods_list.get(n))
    var mydate = image.get('system:index').getInfo().slice(17, 25)
    Map.addLayer(image,{min:0,max:1,palette:['black','aqua']},'flood_'+mydate,1,0);
    // Export single flood map
    Export.image.toDrive({
      image: image,
      description: 'flood_'+mydate,
      fileNamePrefix: 'flood_'+mydate,
      folder: 'EE Outputs',
      scale: 10,
      region: aoi,
      maxPixels: 130000000000,
    })
    // Create vectorised layer of the individual flood map
    var flooded_vec = image.reduceToVectors({
      scale: 10,
      geometryType:'polygon',
      geometry: aoi,
      eightConnected: false,
      crs: 'EPSG:4326',
      bestEffort:true,
      tileScale:12,  
    });
    // Display vector on map
    //Map.addLayer(flooded_vec,{},'flood_vec_'+mydate,1,0)
    // Export flood polygons as shape-file
    Export.table.toDrive({
      collection:flooded_vec,
      description:'Flood_vector_'+mydate,
      fileFormat:'SHP',
      fileNamePrefix:'flooded_vector_'+mydate
    });
  }
}
/////////////////////////////////////////////////////
// Create and Display and Export cumulative flood.
//////////////////////////////////////////////////////
var cumflood=floods.sum().rename('cum_flood');
Map.addLayer(cumflood,
    {min: 0, max: 30, palette: ['000000','FFFFFF','cyan','aqua','blue','navy']}, 'Cumulative flood');
// exporting cumulative flood
Export.image.toDrive({
  image:cumflood.toInt16(),
  description:'Cumulative_flood',
  scale: 10,
  fileNamePrefix:'Cumulative_flood',
  region: aoi,
  maxPixels:1e10
});
/////////////////////////////////////////////////
///   Exporting cumulative flood and flood vector
/////////////////////////////////////////////////

var cumflood_vec = cumflood.reduceToVectors({
  scale: 50,
  geometryType:'polygon',
  geometry: aoi,
  eightConnected: false,
  bestEffort:true,
  tileScale:2,
  crs: 'EPSG:4326',
});

// Export cumulative flood polygons as shape-file
Export.table.toDrive({
  collection:cumflood_vec,
  description:'Cumulative_Flood_vector',
  fileFormat:'SHP',
  fileNamePrefix:'cumulative_flood_vector'
});

Map.addLayer(cumflood_vec,{},'cumulative flood vectorised',1,0)


//----------------------------- Display legend on the map --------------------------//

// Create legend (*credits to thisearthsite on Open Geo Blog: https://mygeoblog.com/2016/12/09/add-a-legend-to-to-your-gee-map/)
// set position of panel
var legend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px',
  }
});
var titleTextVis = {
  'margin':'0px 0px 15px 0px',
  'fontSize': '18px', 
  'font-weight':'', 
  'color': '3333ff'
  };
// Create legend title
var legendTitle = ui.Label('Legend',titleTextVis);
 
// Add the title to the panel
legend.add(legendTitle);
 
// Create second legend title to display exposed population density
var legendTitle2 = ui.Label({
value: 'Flood occurency',
style: {
fontWeight: 'bold',
fontSize: '15px',
margin: '10px 0 0 0',
padding: '0'
}
});

// Add second title to the panel
legend.add(legendTitle2);

// flood visualisation
var floodVis = {
  min: 0,
  max: floods.size().getInfo(),
  palette: ['000000','FFFFFF','cyan','aqua','blue','navy'],
};

// create the legend image
var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply((floodVis.max-floodVis.min)/100.0).add(floodVis.min);
var legendImage = gradient.visualize(floodVis);
 
// create text on top of legend
var panel = ui.Panel({
widgets: [
ui.Label('> '.concat(floodVis['max']))
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
ui.Label(floodVis['min'])
],
});
 
legend.add(panel);
 
// add legend to map (alternatively you can also print the legend to the console)
Map.add(legend);