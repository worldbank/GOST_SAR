<p><center> <img src="../images/GOST_Logo_2021.png" width="700"/> </p></center>

# Coherence Change Detection using Google Colab
The interferometric coherence allows to measure the degree of similarity between 2 SAR images acquired using the same geometry in different times. Hence, the coherence map that generates can be used to analyse changes occurred on the mapped area during the observation period. The Coherence Change Detection uses 2 coherence maps computed using 3 SAR images to analysed the changes between them. The SAR images should be acquired: 2 prior crisis event and 1 posterior to the event. Strong changes observed in short time period are typically related to changes on crop fields and other phenomena, such as natural disasters, but also disasters that could occurred due to anthropogenic causes (i.e. explosions, etc).

An ilustrative example of this application is the analysis of the Beirut area affected by the blast occured in its harbor area last 4th August 2019. In red colour the area affected by a significant drop of the coherence values before and after the explosion event.
<p><center> <img src="../images/example_CCD.png" width="1000"/> </p></center>

***
The scope of this repository is to provide resources and examples to help you leverage SAR data using Coherence Change Detection using Google Colaboratory environment.
The usage of Synthetic Aperture Radar (SAR) data for Coherence Change Detection provides relevant information in phenomena with big changes, that could be consequence of natural or anthropogenic actions. Satellite remote sensing data is able to retrieve information from inaccessible or critical areas, even under cloud conditions, being an unvaluable tool for operational monitoring activities. 

The Jupyter Notebooks available for both study cases cover the installation of the necessary open tools (i.e. the ESA SentiNel Application Platform), the satellite data download (which requires previous user registration), interferometric coherence computation and post-processing steps, needed in some of the user input parameters, providing finally a Coherence Change map in an exportable webmap or GeoTIFF. These Jupyter Notebooks follow the workflow illustrated below, indicating, when the user input is needed. 

<p><center> <img src="../images/workflow_CCD.png" width="1000"/> </p></center>


## Study cases - idenfitication of damage on urban infrastructure using Interferometric coherence

1. Explosion in Bata, Equatorial Guinea (03.07.2021) [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/worldbank/GOST_SAR/blob/master/Coherence%20Change%20Detection/code/WB_Bata_HandOn_session.ipynb)
2. Explosion in Beirut, Lebanon (08.04.2020) [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/worldbank/GOST_SAR/blob/master/Coherence%20Change%20Detection/code/WB_Beirut_HandsOn_session.ipynb)

## Requirements
- Google account
- Copernicus Open Data Hub or Alaska Satellite Facilities account
- Basic knowledge in (In)SAR data processing

## Learning material 
Here a non-exhaustive list of peer review publications covering the Coherence Change detection: 
 - [Coherence Change-Detection with Sentinel-1 for Natural and Anthropogenic Disaster Monitoring in Urban Areas](https://www.mdpi.com/2072-4292/10/7/1026)
 - [Urban Change Detection Using Coherence and Intensity Characteristics ofMulti-temporal ERS-1/2 Imagery](http://earth.esa.int/workshops/fringe2005/proceedings/papers/350_liao.pdf)
 - [Detection of landslide induced by large earthquake using InSAR coherence techniques – Northwest Zagros, Iran](https://www.sciencedirect.com/science/article/pii/S1110982318302886)

## Get started
- [Google Colaboratory](https://colab.research.google.com/notebooks/intro.ipynb)
- GOST Generic Coherence Change Detection code [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/worldbank/GOST_SAR/blob/master/Coherence%20Change%20Detection/code/WB_CoherenceChangeDetection_generic.ipynb)

