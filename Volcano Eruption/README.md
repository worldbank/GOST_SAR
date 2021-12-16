<p><center> <img src="../images/GOST_Logo_2021.png" width="700"/> </p></center>

# Lava flow detection using time series anomaly detection on Google Earth Engine
An ilustrative example of this application is the lava flow detection after the eruption of the Mount Nyiragongo ocurred on 22 May 2021. Using our scripts, it is possible to perform a quick damage assessment. In red colour the area detected as lava using Copernicus Sentinel-1 data, using our anomaly detection algorith which takes the advantage of analysing large time series of data.
More information about the lava flow mapping of UNITAR is available [here](https://unitar.org/maps/map/3300)

<p><center> <img src="../images/volcano_lava_detection.jpg" width="700"/> </p></center>

This image above puts together the UNITAR map and the results obtained using our approach, showing a strong agreement between both. 

***
The scope of this repository is to provide resources and examples to help you leverage SAR data for Lava flow using our anomaly detection method developed on Google Earth Engine.
The usage of Synthetic Aperture Radar (SAR) data for Anomaly Detection provides relevant information in phenomena with big changes, that could be consequence of natural or anthropogenic actions. 

The GEE code available for this application, as it is based on anomaly detection can be employed also for analysing other type of phenomena, such as floods or oil spills, as far as these can be considered an anomaly. The code has an initial section indicating the user inputs that are needed, and the suggested parameters had been selected to be appropriate with this kind of phenomenom. 

## Study cases - idenfitication of damage on urban infrastructure using Interferometric coherence

1. Nyiaragongo eruption, DR Congo, May 2021

## Requirements
- Google account
- Basic knowledge in (In)SAR data processing

## Learning material 
Here a non-exhaustive list of peer review publications covering the Anomaly Detection using Copernicus Sentinel-1 data: 
 - []()
## Get started
- [Google Earth Engine](https://colab.research.google.com/notebooks/intro.ipynb)
