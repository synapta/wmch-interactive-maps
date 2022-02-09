# Interactive WMCH maps user manual

This user manual explores the use of the interactive maps admin backend.

## Accesses

Admin paths are protected by user name and password.

The frontend is visible and everyone can see it.

## How to create a map

You can create a map by visiting the path:

- [map.wikimedia.swiss/wizard](https://map.wikimedia.swiss/wizard)

You will see a form divided into different steps in which you can:

### 1. Choose a title and a path where the map will be visible, egs. /v/name-path

![1st step](/wizard/man/_media/wizard-01.png)

### 2. Write the SPARQL query that will populate the map

![2nd step](/wizard/man/_media/wizard-02.png)

### 3. Choose the map frontend

![3rd step](/wizard/man/_media/wizard-03.png)

SPARQL data are displayed in preview. From the dashboard you can choose:

- The map style;
- Pin icon;
- Coordinates;
- Clustering;
- Zoom levels.

#### Pin icon

You can choose the icon that you want to see on the pin in the map by typing the icon English name you want to see. For example: if you type the word university you will see the related icon, or if you type the word arrow you will see different arrow icons you to choose from. 

#### Zoom and coordinates

By using the zoom feature or the + or – buttons you will see a specific part of the territory. 

By clicking on the *Coordinates on current position* button on the top of the map, latitude and longitude will be calculated on the center of the map currently visible on the map preview. 

The preview has a limited framework compared to the map that will be published full screen mode, so it is recommended to use a zoom level a little bit higher so as to take the elements on the sidelines slightly off the preview framework.

#### Auto vs. Manual

By selecting the *Auto* mode, you can avoid to specify a zoom level.

In this mode the map will be zoomed and centered on the basis of the received data.

However, the Auto mode could be used also to take a portion of the map after you’ve seen it, or to center it on data and then choose a different zoom level by following this steps: 

1. Select the *Auto* mode
2. Click on the *Coordinates on current position* button
3. Select again *Manual* mode

After that you will be able to use the zoom and drag the map using always the *Coordinates on current position* button until you see the wished portion of map. 


#### Clustering

The *clustering* feature could be used to cluster elements geographically adjacent. The higher is the embedded value, the higher will be the number of clustered elements.

In framing, if you select a clustered group, the map will be zoomed to see all the clustered elements.


#### Minimum and maximum zoom

These parameters can be unaltered. They establish how much the user can zoom back (minimum zoom) or zoom forward (maximum zoom).

The embedded values must be integer and it is better not to overcome the default values (maximum 18 and at least 1).


### 4. Review and edit the map before publishing

![4th step](/wizard/man/_media/wizard-04.png)

There can’t be two maps with the same path, there will be suggested an editable one based on the title.

## Admin dashboard

You can find the admin dashboard at:

- [map.wikimedia.swiss/admin](https://map.wikimedia.swiss/admin)

![Admin dashboard](/wizard/man/_media/admin-01.png)

In the admin dashboard you can:

1. List the published maps on the site;
2. Edit the single map;
3. Choose the order of the map appearance in the landing page; 
4. Enable the history feature;
5. Publish or unpublish maps;

Once you click on a map title you will be sent back to the edit page.

Whether you change any of the statuses above, you always need to click on the save button. 

## Edit a map

On the edit page of the single map you can change what you’ve already added in.

You will see again the wizard form already explained in *How to create a map*. You could edit the query as well as the profile of display the map. 

