![image](https://user-images.githubusercontent.com/20595425/163215124-fa2bb9c3-903f-443b-8a2f-37391595eeef.png)

# Damage assessment using Coherence Change Detection

We have employed the Interferometric Coherence to analyse Coherence Changes between the different Sentinel-1 images available over Mariupol, in both ascending and descending orbit.
Taking the advantage of the complex information on the SAR image (amplitude and phase) we are able to depict changes and permanent changes over Mariupol, to finally assess the possible damange due to war during the analysed period.

We have employed the methodology described [here](https://github.com/worldbank/GOST_SAR/tree/master/Coherence%20Change%20Detection)

## Coherence map pre war (left) and co-war (right)
Both coherence maps are 24 days apart from its reference image acquired on 28th Feb 2022. The left one is formed by the images 16th and 28th Feb and the right one by 28th Feb and 24th March 2022.
We can appreciate significant coherence variation within the cyan polygon, which delimits the Mariupol urban area.

![image](https://user-images.githubusercontent.com/20595425/162282360-08e49265-b323-4b28-8407-d6d06f5574ad.png)

## Coherence Change detection
The coherence change detection method consists in the difference of 2 coherence maps with same reference image (in this example 28th February 2022).

![image](https://user-images.githubusercontent.com/20595425/163357598-f3002ddd-9685-43bd-aa09-391c7b8b1fe9.png)

We computing coherence maps and coherence change maps  from 2 Sentinel-1 orbits, 1 ascending (track 94) and 1 descending (track 43) specifically:
- ascending orbit with relative orbit 43: with images acquired on last 8th and 20th February 2022 and, 4th and 28th March. 2022. We selected the coherence map of the pair **20th Feb - 4th March as reference coherence map**.
- descending orbit with relative orbit 94: with images acquiered on last 4th, 16th, 28th February 2022 and, 12th,24th March 2022. In this case we selected the coherence map of the pair **16th Feb – 28th Feb as reference coherence map**.

The coherence change maps prior the start of the war were used as a proxy to select an appropiate values to consider a **change**.

In the final Coherence Change map showed below, we have included the results of analysing the permanent changes combining the 5 coherence change detection maps, computing with the following coherence pairs:
- CCD1: (20th-Feb - 4th March), (4th March = 16th March)
- CCD2: (20th-Feb - 4th March), (4th March = 28th March)
- CCD3: (16th Feb - 28th Feb), (28th Feb - 12th March)
- CCD4: (16th Feb - 28th Feb), (28th Feb - 24th March)
- CCD5: (16th Feb - 28th Feb), (28th Feb - 5th Apr)

resulting on the map below, showing in red the permanent changes detected during the whole analysed period (16th February - 5th April)

![image](https://user-images.githubusercontent.com/20595425/163257338-1700561a-553c-40b8-b12f-8f919ec49622.png)

## Damage buildings idenfitication
Combining our layer of permanent changes together with building footprints from Open Street Map, we are able to identify and quantify possible damage buildings, which seem to be, unfortunately, all over the city.

![image](https://user-images.githubusercontent.com/20595425/163257274-3da48e6b-0ad4-412d-8b52-1ebe4fae641c.png)

## Identifying major POIs damaged from news and crowdsource
We have been picking up important points of interest (POIs) which were bombed or affected reported by BBC or crowdsourced via https://ukraine.bellingcat.com/

Here below some examples of damages buildings in red footprints and their pictures from the news.
<img width="837" alt="image" src="https://user-images.githubusercontent.com/20595425/162289912-629ace61-9a45-4cae-97e5-ce7b9583cb76.png">

Additionally, from the 42 locations reported (up to 5th April 2022) in the aforementioned website, we have detected 37 of them in our analysis.

## Damage assessment in numbers
Using open layers from OpenStreetMap, we were able to quantify damaged infrastructures, such as buildings, roads and bridges, and distinguishing between industrial and commercial buildings. The damage assessment results are summarized in the table below.

![image](https://user-images.githubusercontent.com/20595425/163357148-5b7ef920-32d3-47a8-86be-61281fc17a51.png)

## Conclusions
- Using CCD from free and open satellite data provides a quick and reliable overview of the situation, being able to assess damage infrastructures almost in very near real time.
- As a result of our analysis, we have detected that, during the analysed period (from 16th February until 5th April 2022), 
    - more than 1/4 of the buildings of the city damaged. From those, we have identified that 75% of buildings classified as commercial had been damaged, as well as more than 50% of the industrial buildings on the analyzed area.
    - 520km of roads affected (representing a 19% of the total road lenght) and, 12 bridges (37.5% of the total).
    - both the airport and the harbour had been detected as damaged.

## Disclaimer
The results may contain geographic information with limitations due to the scale, resolution, date and interpretation of the original source materials and open layers employed. No liability concerning the content or the use thereof is assumed by the producer.

The Global Operational Support Team, DECAT, The World Bank.
