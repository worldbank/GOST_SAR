<p><center> <img src="../images/GOST_Logo_2021.png" width="700"/> </p></center>

# Flood Analysis and Mapping using Google Earth Engine

***

The scope of this repository is to provide resources and examples to help you leverage SAR data for flood analysis and mapping using Google Earth Engine. The penetration of the microwave radar through the clouds makes radar satellite data an ideal choice for space flood mapping during rainy periods. 

<p><center> <img src="../images/Cumulative_Flood_S1_NDFI.png" width="600"/> </p></center>


Unfortunately, there is no "one fit all" solution for flood mapping using radar data. There are different indexes that can be utilized, suitable for certain topography or lengths of flood event. 

The Global Operational Support Team (GOST) of World Bank has been researching and testing different solutions on various use cases and developed a Decision Matrix (see PPT) with the hope that it will help you gest quick and accurate results for your analysis.

<p><center> <img src="../images/Flood_decision_matrix.png" width="600"/> </p></center>


The scripts available here were developed in Google Earth Engine and contain a series of common elements, such as:
- **user input** is clearly delimited and kept to a minimum: users need to change the AOI and date and can run the script
<p><center> <img src="../images/user_input_small.png" width="1000"/> </p></center>

- **damage assessment analysis** included in each script, which intersects the flood extent with WorldPop 2020 and with Copernicus Global Land Services (2019) to determine the number of people affected, the total ha of urban areas and cropland affected.
<p><center> <img src="../images/damage_assessment.png" width="200"/> </p></center>
The damage assessment analysis was inspired by the UN-SPIDER GEE script available [here](https://code.earthengine.google.com/f5c2f984c053c8ea574bfcd4040d084e)
## Requirements
- Google account
- Basic knowledge in SAR and Multi-Spectral data processing and applications

## Learning material 
Here a non-exhaustive list of peer review publications covering the surface water or flood detection using remote sensed satellite data: 
 - [Normalized Difference Flood Index for rapid flood mapping: Taking advantage of EO big data](https://doi.org/10.1016/j.rse.2018.03.006)
 - [Modification of normalised difference water index (NDWI) to enhance open water features in remotely sensed imagery](https://doi.org/10.1080/01431160600589179)

## Get started
- [Google Earth Engine](https://developers.google.com/earth-engine/tutorials/tutorials
- [GOST Flood mapping scripts](https://code.earthengine.google.com/?accept_repo=users/GOST_WBG/Flood_Mapping)

## GOST Flood scripts
Some of the scripts developed are used for:
- Flood mapping using [Sentinel-1 time series anomaly detection](https://code.earthengine.google.com/8dc95ad91a98824088a8a89b2738dbcf)
- Flood mapping using [Sentinel-2 and Modified Normalized Difference Water Index (MNDWI)](https://code.earthengine.google.com/fa9f20cea7d600377292a3afaead1979)
- Flood mapping using [cloud mask Sentinel-2 and MNDWI] [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/mdelgadoblasco/GOST_SAR/blob/master/Flood%20Analysis%20and%20Mapping/code/FloodMapping_MNDWI_S2_cloudmask_COLAB.ipynb)
- Flood mapping using [Sentinel-1 Normalized Difference Flood Index (NDFI) and Normalised Difference Flood over short Vegetation Index (NDFVI)](https://code.earthengine.google.com/1c4f0b1a01494088f665f818f86f8543) ([Cian,F. et al. 2018](https://doi.org/10.1016/j.rse.2018.03.006))
- Flood mapping using [Sentinel-1 and the NDFI](https://code.earthengine.google.com/acff3d6a5cffe961156cd6919e01a5ab) ([Cian,F. et al. 2018](https://doi.org/10.1016/j.rse.2018.03.006))
- Flood mapping using [Sentinel-1 and Sentinel-2 data fusion from previous approaches](https://code.earthengine.google.com/acc43b4c2e50a9a59207817f33f2904c)
- Flood mapping using [land cover classification using Support Vector Machines and Sentinel-2 data](https://code.earthengine.google.com/83bb7f66fde2469b0bbd3b66db876b78)
- [Cumulative flood mapping using Sentinel-1 and NDFI](https://code.earthengine.google.com/59ef104855abfaedf2b157ac7183beaf)


You can get our repo using the git command below:
```
git clone https://earthengine.googlesource.com/users/GOST_WBG/Flood_Mapping
``` 
