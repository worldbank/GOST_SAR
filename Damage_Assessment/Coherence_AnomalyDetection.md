![image](https://user-images.githubusercontent.com/20595425/163215124-fa2bb9c3-903f-443b-8a2f-37391595eeef.png)

# Damage assessment using Anomaly detection of Interferometric Coherence

We have employed the Interferometric Coherence to analyse anomalies in the Coherence values between the different Sentinel-1 images available over Mariupol, in ascending orbit.
Taking the advantage of the complex information on the SAR image (amplitude and phase) we are able to depict changes and permanent changes over Mariupol, to finally assess the possible damange due to war during the analysed period.
In order to employ the anomaly detection method, we have computed medium to large time series coherence since the start of the war in Ukraine in 2022 and also in the same period the year before, in order to have coherence values on the standard/normal situation.

## Using Google Earth Engine with the Interferometric Coherence images
The coherence maps computed for 2021 and 2022 had been uploaded into GEE under a dedicated imageCollection so that we can develop prototype algorithms that will allow us to compute coherence changes without the usage of any threshold, but using their temporal statistics.
This is the principle of the anomaly detection approach employed, where a pixel is depicted as anomalous where its coherence value is outside the standard situation, or in this case, outside the normal distribution (mean - 3 x std)

The test site to this approach has been Mariupol, for which we were able to collect some information on real damage buildings on specific dates, as seen [here](README.md)

The resources available for that purpose are two scripts: 
 1) a Google Colaboratory (COLAB) script for the Sentinel-1 coherence generation that is needed when willing to analyze recent data (from June 2022 onwards) and 
 2) the Google Earth Engine script, needed for the change detection and damage assessment analysis. 

Both scripts are listed below: 
- COLAB script: generation of individual coherence maps available [here](https://colab.research.google.com/drive/194RPigw-CW8CWDDdLRfcS6CsL_7_O3Dq?authuser=1)
- GEE: analysis of time series coherence variation and coherence change detection computation and damage building assessment. Script available [here](https://code.earthengine.google.com/726c7579bc7e7950f5403b1bc7d6f40b)

The existing solution provided by GOST contains a script to be used within Google Earth Engine that allows users to identify changes that occurred in the built environment using the anomaly detection approach mentioned above, by utilizing the time series coherence products included as a sharable Image Collection.

![image](https://user-images.githubusercontent.com/20595425/222986395-bff809fc-5342-41e3-9e8c-1e0513dc79ee.png)

For the creation of the shared coherence image collection, two reference images were defined, the first one selected as the oldest image employed for the period 2021 (February - September 2021) and the second reference image as the oldest image employed for the period 2022 (February - June 2022).  
The proposed solution makes use of the procedure called <anomaly detection>. In our algorithm we use the outlier whose value is lower than the value obtained by applying the “3sigma-rule" (), i.e. 
μ−3σ 
 
These anomalies can be intersected with other geoinformation layers, such as building footprints, so that the buildings for which it has been measured a change can be identified. For that purpose we have selected the OpenStreetMap building footprints.
![image](https://user-images.githubusercontent.com/20595425/222986471-01576501-ec58-4c7f-9747-5e1dd7c33724.png)


An example of the time series coherences wheree the changes are clearly detected is shown in figure below (Note: The coherence images were scaled by a factor of 10000 and converted into UInt16 instead of Float32 for saving resources).
![image](https://user-images.githubusercontent.com/20595425/222986497-baa0a72c-1068-4bcc-be9c-f39abaa7c0cd.png)

## Disclaimer
The results may contain geographic information with limitations due to the scale, resolution, date and interpretation of the original source materials and open layers employed. No liability concerning the content or the use thereof is assumed by the producer.

The Global Operational Support Team, DECAT, The World Bank.
