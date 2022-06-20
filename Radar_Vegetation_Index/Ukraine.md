![image](https://user-images.githubusercontent.com/20595425/163215124-fa2bb9c3-903f-443b-8a2f-37391595eeef.png)

# Radar Vegetation Index
We have employed the SAR dual polarisation amplitude signal in VV and VH channels, to generate the so-called Radar Vegetation Index (RVI) based on the particular combination of the
co-polarised and cross-polarised SAR signal. It has shown to be very valuable where the areas of analysis are particularly covered very often by cloud cover. SAR signal has been used
as alternative to derive vegetation indices due to its capability to see through clouds due to its active microwave sensor.

The employed methodology can be found [here](https://www.int-arch-photogramm-remote-sens-spatial-inf-sci.net/XLIII-B3-2021/701/2021/isprs-archives-XLIII-B3-2021-701-2021.pdf)
and its original formulation developed by [Agapiou, 2020](https://doi.org/10.3390/app10144764).

## ESA World Cover 10m LULC 
We have used the new ESA World Cover map 10m LULC to mask out areas which aren't of interest in computing the mRVI, i.e. built-up, water, forest, etc.
![image](https://user-images.githubusercontent.com/20595425/174681203-254aafc6-fab3-4ecd-aa03-8030025b469a.png)

The cropland class has value equal to 40, which will be used within Google Earth Engine to generate the mask

## The modified Radar Vegetation Index definition
The employed formula has been defined by ([Agapiou, 2020](https://doi.org/10.3390/app10144764))

![image](https://user-images.githubusercontent.com/20595425/174681795-4c8ec386-2f69-4912-a778-619a3cc17dd4.png)

## Result sample
The developed script generates a composite of mRVI derived from Copernicus Sentinel-1 using both ascending and descending acquisitions for the period specified by the user.
Note that during the period mid-2016 to December 2021, the revisit time of the Copernicus Sentinel-1 mission was 6 days, while currently it is 12 days.

The final composite is rescaled by a factor of 10000 to finally convert float values to unsigned integer 16 (Uint16) which produces lighter files.
The developed code can be found in [here](https://code.earthengine.google.com/2b3eff8d77e245c0ba67c3dd127ec6e9)
Full AOI mRVI sample is illustrated below
![image](https://user-images.githubusercontent.com/20595425/174682588-0b01a1d7-7f69-494d-b7a5-fbb1faaceaf6.png)

And finally, here below a zoom over a cropland area, where it is visible the patterns of mRVI values over different parcels
![image](https://user-images.githubusercontent.com/20595425/174682579-815ea2be-3ae0-402b-b794-a303990e1c17.png)

## Requirements
- Google account
- Basic knowledge in SAR data processing

## Learning material 
Here a non-exhaustive list of peer review publications covering the oil spill detection: 
- [Estimating Proportion of Vegetation Cover at the Vicinity of Archaeological Sites Using Sentinel-1 and -2 Data](https://doi.org/10.3390/app10144764)
- [THE USE OF SENTINEL 1/2 VEGETATION INDEXES WITH GEE TIME SERIES DATA IN DETECTING LAND COVER CHANGES IN THE SINOP NUCLEAR POWER PLANT CONSTRUCTION SITE](https://www.int-arch-photogramm-remote-sens-spatial-inf-sci.net/XLIII-B3-2021/701/2021/isprs-archives-XLIII-B3-2021-701-2021.pdf)
## Get started
- [Google Earth Engine](https://earthengine.google.com)

## Disclaimer
The results may contain geographic information with limitations due to the scale, resolution, date and interpretation of the original source materials and open layers employed. No liability concerning the content or the use thereof is assumed by the producer.

The Global Operational Support Team, DECAT, The World Bank.
