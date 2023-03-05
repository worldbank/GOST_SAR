![image](https://user-images.githubusercontent.com/20595425/163215124-fa2bb9c3-903f-443b-8a2f-37391595eeef.png)

# Damage assessment using SAR Interferometric Coherence
In this section we developed two different approaches to perform damage assessment using SAR Interferometric Coherence:
- **Coherence Change Detection**
In this first case the coherence change detection is done computing the differences in coherence values between 2 coherence maps, one computed with images acquired before an specific event, and the second coherence map computed with one image acquired before and one after that event. Is later defined a threshold for which consider change/no change situation.
An example of this method has been applied to Mariupol city for damage assessment purposes and can be found [here](Mariupol_city.md).
![image](https://user-images.githubusercontent.com/20595425/222987514-10850025-fd9e-4f66-95a8-03361de71445.png)

- **Anomaly detection of coherence values**
In this second case, a larger time series of coherence maps had been used to be able to compute anomalies in the coherence values. For that purpose, more than 20 coherence maps were computed for the year 2021 (pre-war) to have a standard/normal situation of the coherence values and derive statistics such as mean and standard deviation per pixel. 

This second approach requires many more resources, data processing and storage but is the changes are computed threshold-free, without the need of the definition of a strong threshold for the entire image. Hence, this approach can be considered more robust as there is no influence of a threshold definition on the final detected changes.
An example of this method has been also applied to Mariupol city for damage assessment purposes and can be found [here](Coherence_AnomalyDetection.md).
![image](https://user-images.githubusercontent.com/20595425/222987491-d23d4350-15cc-4c0f-84b3-846b1887f2ad.png)
(Note: the coherence values had been scaled by a factor of x10000 for resource optimisation purposes).



The Global Operational Support Team, DECAT, The World Bank.
