# Flood mapping and damage assessment

The penetration of the microwave radar through the clouds makes radar satellite data an ideal choice for space flood mapping during rainy periods. 
Unfortunately, there is no "one fit all" solution for flood mapping using radar data. There are different indexes that can be utilized, suitable for certain topography or lengths of flood event. 
GOST has been doing research and tested different solutions on various use cases and developed a Decision Matrix (see PPT) with the hope that it will help you gest quick and accurate results for your analysis.

The scripts are developed in Google Earth Engine and contain a series of common elements, such as:

a) user input is clearly delimited and kept to a minimum: users need to change the AOI and date and can run the script

b) there is a damage assessment analysis included in each script, which intersects the flood extent with WorldPop 2020 and with Copernicus Global Land Services (2019) to determine the number of people affected, the total ha of urban areas and cropland affected.
