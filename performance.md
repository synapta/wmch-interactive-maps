# WMCH performance tests

Test performance using JavaScript native `performance.now()` API.

Testing conditions:
* NodeJS server running locally
* remote DB (tunnel localhost -> rattata.synapta.io -> 192.168.128.15 (wikimch))
* Synapta tile server [https://tile.synapta.io/](https://tile.synapta.io/)

Map rendered with Leaflet (client side rendering).

## 1 Swiss Museums Map
#### Real time mode
```
******* MEASURE 1 ************
Retrieving map options took 1011.9049999993877ms
Rendering basemap took 23.615000001882436ms
Retrieving geo data took 118.75499999950989ms
Rendering data on map took 465.64500000022235ms
Finalizing map UI took 462.8100000008999ms
```
```
******* MEASURE 2 ************
Retrieving map options took 972.2199999996519ms
Rendering basemap took 67.15500000063912ms
Retrieving geo data took 6302.339999998367ms
Rendering data on map took 486.64500000086264ms
Finalizing map UI took 515.4150000016671ms
```

#### History browse mode
> average over 3 measurements
```
******************************************
Retreiving map options - 1200 ms
Retreiving geo data - 12229 ms
Rendering basemap - 42 ms
Rendering geo data on map - 971 ms
Finalizing map UI - 1244 ms
******************************************
Total time for data retreiving - 13429 ms
Total map rendering - 2257 ms
```


## 2 Swiss Railway Stations
##### Real time mode
```
******* MEASURE 1 ************
Retrieving map options took 1505.9000000001106ms
Rendering basemap took 53.28000000008615ms
Retrieving geo data took 6863.209999999526ms
Rendering data on map took 517.3299999987648ms
Finalizing map UI took 408.90000000217697ms
```
```
******* MEASURE 2 ************
Retrieving map options took 1668.2499999988067ms
Rendering basemap took 64.34000000081141ms
Retrieving geo data took 53.12000000049011ms
Rendering data on map took 571.58999999956ms
Finalizing map UI took 480.38000000087777ms
```


##### History browse mode
```
******* MEASURE 1 ************
Retrieving map options took 882.0899999991525ms
Retrieving geo data took 24018.529999997554ms
Rendering basemap took 32.68000000025495ms
Rendering data on map took 1981.885000001057ms
Finalizing map UI took 2132.3000000011234ms
*********************************************
```
```
******* MEASURE 2 ************
Retrieving map options took 902.4050000007264ms
Retrieving geo data took 23998.42500000159ms
Rendering basemap took 33.20999999777996ms
Rendering data on map took 2134.280000002036ms
Finalizing map UI took 2212.919999998121ms
*********************************************
```
```
******* MEASURE 3 ************
Retrieving map options took 890.9999999996217ms
Retrieving geo data took 24044.14000000179ms
Rendering basemap took 35.77500000028522ms
Rendering data on map took 2076.4600000002247ms
Finalizing map UI took 2248.0949999990116ms
```

## 3 Germanophone Museums
##### Real time mode
```
******* MEASURE 1 ************
Retrieving map options took 1106.6350000000966ms
Rendering basemap took 79.17499999894062ms
Retrieving geo data took 26536.019999999553ms
Rendering data on map took 1318.6949999981152ms
Finalizing map UI took 639.3100000022969ms
```
```
******* MEASURE 2 ************
Retrieving map options took 1617.2149999983958ms
Rendering basemap took 46.88499999974738ms
Retrieving geo data took 216.08500000002095ms
Rendering data on map took 1181.3700000020617ms
Finalizing map UI took 640.5099999974482ms
```
```
******* MEASURE 3 ************
Retrieving map options took 1055.8149999997113ms
Rendering basemap took 87.21499999955995ms
Retrieving geo data took 160.72999999960302ms
Rendering data on map took 1386.6799999996147ms
Finalizing map UI took 571.9649999991816ms
```

##### History browse mode
Error retrieveing geo data


## 4 Museums CH-DE-IT-FR
##### Real time mode
```
******* MEASURE 1 ************
Retrieving map options took 1232.7149999982794ms
Rendering basemap took 47.370000000228174ms
Retrieving geo data took 49522.45000000039ms
Rendering data on map took 1597.5749999997788ms
Finalizing map UI took 387.07500000236905ms
```
```
******* MEASURE 2 ************
Retrieving map options took 1212.7150000014808ms
Rendering basemap took 85.5200000005425ms
Retrieving geo data took 227.01999999844702ms
Rendering data on map took 1678.264999998646ms
Finalizing map UI took 431.72000000049593ms
*********************************************
```
```
******* MEASURE 3 ************
Retrieving map options took 899.810000002617ms
Rendering basemap took 98.88499999942724ms
Retrieving geo data took 404.51499999835505ms
Rendering data on map took 1571.749999999156ms
Finalizing map UI took 424.00500000076136ms
```

##### History browse mode
Error retrieveing geo data


## Note
* la seconda richiesta è nettamente più veloce della prima (ovviamente cache)
* il tempo rendering resta più o meno costante
* in locale (col tunnel) per le query grosse (3 e 4) in modalità history il server non riesce
nemmeno a rispondere. Nella versione online risponde ma non riesco a calcolare i tempi chiaramente. Valutiamo se deployare la versione con il calcolo della performance.
* la versione history non ha i cluster e con mappe grosse (3 e 4) la performance di Leaflet è terribile.
