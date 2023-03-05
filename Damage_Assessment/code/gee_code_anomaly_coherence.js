/*===========================================================================================
       COHERENCE CHANGE DETECTION BASED ON ANOMALY DETECTION ON COHERENCE TIME SERIES
  ===========================================================================================
  
  Within this script SAR Sentinel-1 Interferometric Coherence products (externally computed 
  using COLAB script) are used  to compute coherence change detection using statistical
  anomaly detection on the time series coherence data. 
  
  This anomaly detection product is consequently employed to derive preliminary damage 
  assessment over intersecting buildings. 
  The building layer used as input is provided by OpenStreetMap
*******************************************************************************************
                                  SELECT YOUR OWN STUDY AREA   
   The user can :
   1) select the oblast name from Ukraine or;
   2) use the polygon-tool in the top left corner of the map pane to draw the shape of your 
   study area. Single clicks add vertices, double-clicking completes the polygon.
   **CAREFUL**: Under 'Geometry Imports' (top left in map panel) uncheck the 
               geometry box, so it does not block the view on the imagery later.
   3) load a shapefile stored in the user Assets collection */
   
  /* 1)  select aoi based on oblast name */
  var oblastname='Donetska'
  var aoi=ukr_admin2.filter(ee.Filter.eq('ADM1_EN',oblastname))

  /* 2) Use a user defined geometry.
    Uncomment the two lines below if you want to use a defined geometry as AoI */
  var aoi=geometry

  /* 3) Load a shapefile from Assets collection.
  Uncomment and modify the lines below if you want to use a shapefile stored in your assets
  var aoi= ee.FeatureCollection('users/josemanueldelgadoblasco/custom_aoi') */

  Map.addLayer(aoi,{},'Area of study')
  Map.centerObject(aoi,8);

/* ***************************************************************************************** 
                                        SELECT DATA
   Select data to analysed based on dates and track (relative_orbit) //
   Define track (for Mariupol ascending orbit the track = 43)*/
var track=43;

/*******************************************************************************************
                                       SET TIME FRAME

   Set start and end dates of a period BEFORE the flood. Make sure it is long enough for 
   Sentinel-1 to acquire an image (repitition rate = 6 days). Adjust these parameters, if
   your ImageCollections (see Console) do not contain any elements.*/

// Set the start and stop dates to be used in YYYY-MM-DD format.
// Define start /stop of previous year
var start_pre='2021-01-01';
var stop_pre='2021-12-31';
// start/stop time of period under analysis
var start='2022-02-01';
var stop='2022-12-31';

/********************************************************************************************
  ---->>> DO NOT EDIT THE SCRIPT PAST THIS POINT! (unless you know what you are doing) <<<---
  ------------------>>> now hit the'RUN' at the top of the script! <<<-----------------------
  -----> The final products will be ready to download on the right (under the Tasks tab) <-----

  ******************************************************************************************/

//---------------------------------- Translating User Inputs ------------------------------//
// Subsetting based on track
cohs=cohs.filter(ee.Filter.eq('relative_orbit', track))

// Subset data for statistical analysis with previous parameters
var cohpremean=cohs.filterDate(start_pre,stop_pre).mean()
var cohprestd=cohs.filterDate(start_pre,stop_pre).reduce(ee.Reducer.stdDev())

//printing information
print('Number of coherence maps from 2021')
print(cohs.filterDate(start_pre,stop_pre).size())

print('Number of coherence maps from 2022')
print(cohs.filterDate(start,stop).size())

// Adding to map 
Map.addLayer(cohpremean,{min:0,max:10000},'coh average pre')
Map.centerObject(geometry,12)
Map.addLayer(cohprestd,{min:0,max:5000},'coh std pre')

/***************************************************************************
                            DEFINING CHANGE 
****************************************************************************/
// Get data after start of war
var coherence=cohs.filterDate(start,stop);
// Get most recent coherence map from collection
var last=coherence.limit(1, 'system:time_start', false).first()
print(last)
var properties=last.getInfo()
print(last.getInfo().properties['relative_orbit'])

/* Computing changes in most recent coherence map using anomaly detection aproach 
using previous year statistics */
var changeLast = cohpremean.subtract(ee.Image(3).multiply(cohprestd)).gt(last)
Map.addLayer(changeLast,{min:0,max:1,palette:['white','red']},'change wrt last coh map')

// Exporting layers
Export.image.toDrive({
  image: changeLast.toByte(),
  description: 'ccd_a43_last',
  folder: 'Ukraine_ccd',
  region: aoi,
  maxPixels: 1e13,
  scale: 20});
  

/********************************************************************************
                               DAMAGE ASSESSMENT

Select buildings from oblast to analyse*/
var sel_buildings=ukr_buildings.filterBounds(aoi)
Map.addLayer(sel_buildings.style({color: 'green'}),null,'buildings')

print('N. building in aoi')
var Tot_B=sel_buildings.size()
print(Tot_B)

// Get damaged buildings
var damagedBuildings = changeLast.reduceRegions({
  collection: sel_buildings,
  reducer: ee.Reducer.max(),
  scale: 10,
}).filter(ee.Filter.eq('max',1));

print('N. damaged buildings')
var B_damaged=damagedBuildings.size()
print(B_damaged)

Map.addLayer(damagedBuildings.style({color: 'red'}), null, 'damaged buildings')

/*****************************************************************
                      CHART INSPECTOR PANEL
// Create User Interface portion
// Create a panel to hold our widgets.*/
var panel = ui.Panel();
panel.style().set('width', '300px');

// Create an intro panel with labels.
var intro = ui.Panel([
  ui.Label({
    value: 'Chart Inspector',
    style: {fontSize: '20px', fontWeight: 'bold'}
  }),
  ui.Label('Click a point on the map to inspect.')
]);
panel.add(intro);

// panels to hold lon/lat values
var lon = ui.Label();
var lat = ui.Label();
panel.add(ui.Panel([lon, lat], ui.Panel.Layout.flow('horizontal')));

// Register a callback on the default map to be invoked when the map is clicked
Map.onClick(function(coords) {
  // Update the lon/lat panel with values from the click event.
  lon.setValue('lon: ' + coords.lon.toFixed(2)),
  lat.setValue('lat: ' + coords.lat.toFixed(2));
  var point = ee.Geometry.Point(coords.lon, coords.lat);


 // Create an S1 RVI chart.
var rviChart = ui.Chart.image.series(cohs, point, ee.Reducer.max(), 20);
  rviChart.setOptions({
    title: 'S1 coherence',
    vAxis: {title: 'coherence', maxValue: 1000},
    hAxis: {title: 'date', format: 'MM-yy-dd', gridlines: {count: 7}},
  });
  panel.widgets().set(3, rviChart);
});

Map.style().set('cursor', 'crosshair');

// Add the panel to the ui.root.
ui.root.insert(0, panel);
