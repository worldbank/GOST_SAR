/*===========================================================================================
       Sentinel-1 modified RADAR VEGETATION INDEX (mRVI)
  ===========================================================================================
  
  Within this script SAR Sentinel-1 is being used to generate a vegetation index maps
  using the mRVI approach defined in Çolak et al.(2021) with doi 
  10.5194/isprs-archives-xliii-b3-2021-701-2021. We have selected this one as it has shown to
  provide more similar information to the MODIS NDVI data.
  
  We create mRVI nation-wide composites from both ascending and descending orbits together as 
  it has shown to provide better results on successive steps. The final maps are masked using
  the ESA WorldCover map to generate only the mRVI index over crop areas, and finally rescaled
  by a factor of 10000 to convert it into UInt16 (lighter than float)
  *******************************************************************************************
                                 SELECT YOUR OWN STUDY AREA   

   The user can :
   1) select a full country by changing the countryname variable or;
   2) use the polygon-tool in the top left corner of the map pane to draw the shape of your 
   study area. Single clicks add vertices, double-clicking completes the polygon.
   **CAREFUL**: Under 'Geometry Imports' (top left in map panel) uncheck the 
               geometry box, so it does not block the view on the imagery later.
   3) load a shapefile stored in the user Assets collection */
   
   /*1)  Choose country name */
   var countryname='Ukraine'
   var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
   var aoi = countries.filter(ee.Filter.eq('country_na', countryname));
   Map.addLayer(aoi,{},'AoI')
   Map.centerObject(aoi,6);

   /* 2) Use a user defined geometry.
    Uncomment the two lines below if you want to use a defined geometry as AoI
   var aoi = ee.FeatureCollection(geometry);
   Map.centerObject(aoi,8); */

  /* 3) Load a shapefile from Assets collection.
  Uncomment and modify the lines below if you want to use a shapefile stored in your assets
  var aoi= ee.FeatureCollection('users/josemanueldelgadoblasco/UKR_adm0')
  //Map.centerObject(aoi,8);


  /*******************************************************************************************
                                       SET TIME FRAME

   Set start and end dates of a period that you want to generate the mRVI. Make sure it is long enough for 
   Sentinel-1 to acquire an image (repitition rate = 6 days). Adjust these parameters, if
   your ImageCollections (see Console) do not contain any elements.*/

// Set the start and end dates to be used as pre-event in YYYY-MM-DD format.
// suggested minimum 1 year
var start='2021-03-21';
var stop='2021-03-31';


/********************************************************************************************
  ---->>> DO NOT EDIT THE SCRIPT PAST THIS POINT! (unless you know what you are doing) <<<---
  ------------------>>> now hit the'RUN' at the top of the script! <<<-----------------------
  -----> The final flood product will be ready for download on the right (under tasks) <-----

  ******************************************************************************************/
//-------------------------Auxiliary variables and Data  -----------------------------/
// VH polarization is needed to compute the mRVI
var polarization='VH'
// Using the ESA WorldCover to mask out urban, water and other non crop areas.
var LULC=ee.ImageCollection("ESA/WorldCover/v100")
//Selecting cropland and herbaceous classes (class with value 40)
var cropland=LULC.mosaic().clip(aoi).eq(40)

//------------------------ Defining auxiliary functions --------------------/
// Defining the mRVI formula
var addmRVI = function(img){
  var mRVI=(img.select(['VV']).divide(img.select(['VV']).add(img.select(['VH'])))).pow(0.5).multiply(img.select(['VH']).multiply(ee.Image(4)).divide(img.select(['VV']).add(img.select(['VH'])))).rename('mRVI');
  return img.addBands(mRVI).multiply(ee.Image(10000));
}
// convert imageCollection to Uint16
var toUInt16 = function(img){
  return img.toUint16()
}
// apply mask to imageCollection
var masking = function(img){
  return img.updateMask(cropland)
}

//---------------------------------- Translating User Inputs ------------------------------//

//------------------------------- DATA SELECTION & PREPROCESSING --------------------------//
// Load the Sentinel-1 GRD data (linear units) and filter by predefined parameters
var rvi= ee.ImageCollection('COPERNICUS/S1_GRD_FLOAT')
  .filterBounds(aoi)
  .filterDate(start, stop)
  .filter(ee.Filter.eq('instrumentMode','IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', polarization))
  .filter(ee.Filter.eq('resolution_meters',10))
  .map(addmRVI).select('mRVI').map(masking).map(toUInt16).mean();

print(rvi)

//------------Export image to GDrive-----------------------/
print('Exporting...')
print('rvi_ASCENDING_DESCENDING_'+start+'_'+stop)
Export.image.toDrive({
  image: rvi,
  description: 'rvi_ASCENDING_DESCENDING_'+start+'_'+stop,
  folder: 'Ukraine_RVI',
  scale: 100,
  maxPixels:1e16,
  region: aoi
});


//------------------Visualizing layers--------------------------/
Map.addLayer(LULC.mosaic().clip(aoi),{min:0,max:100},'LULC')
Map.addLayer(cropland.updateMask(cropland),{min:0,max:1,palette:['black','green']},'cropland')
//Map.addLayer(rvi.mean().clip(aoi),{min:0,max:10000},'RVI mean')
Map.addLayer(rvi.clip(aoi),{min:0,max:10000},'RVI mean')
