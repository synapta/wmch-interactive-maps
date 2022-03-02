# User manual

This user manual explores the use of the interactive maps admin backend.

## Access

Admin paths are protected by user name and password.

The frontend is visible and everyone can see it. Not published maps will appear only on edit.

## Create a map

You can create a map by visiting the path:

- [map.wikimedia.swiss/wizard](https://map.wikimedia.swiss/wizard)

Form is separated into different steps below:

### 1. Name

- Title: map title
- Path: path used in the url, in the form /v/my-path. The leading /v/ will be automatically added.

### 2. Category

Choosing a category for a map is required.

### 3. Data

SPARQL Query to populate map is here.

### 4. Appearance

Results from SPARQL query will be displayed as preview. From here you can choose:

4.1. Map style
4.2. Pin Icon
4.3. Zoom mode and level
4.4. Coordinates by latitude and longitude
4.5. Switch to disable clusters (optional)
4.6. Minimum and maximum values for the zoom (optional)
4.7. Coordinates by map
4.8. Publish or save draft 

#### 4.2. Pin Icon

You can choose icon to show on pin searching for the english name of icon.

Typing *university* its icon will be displayed. Typing *arrow* multiple choices will be displayed.

Complete list of icons is on https://semantic-ui.com/elements/icon.html.

#### 4.4 and 4.7. Coordinates

By using the zoom feature or the + or – buttons you will see a specific part of the territory. 

By clicking on the *Coordinates on current position* button on the top of the map, latitude and longitude will be calculated on the center of the map currently visible on the map preview. 

The preview has a limited framework compared to the map that will be published full screen mode, so it is recommended to use a zoom level a little bit higher so as to take the elements on the sidelines slightly off the preview framework.

#### 4.3 Zoom mode and zoom level

You can pick one zoom level (between 1 and 18) or alternatively select the *Auto* mode.

In this mode the map will be zoomed and centered on the basis of the received data.

However, the Auto mode could be used also to take a portion of the map after you’ve seen it, or to center it on data and then choose a different zoom level by following this steps: 

1. Select the *Auto* mode
2. Click on the *Coordinates on current position* button
3. Select again *Manual* mode

After that you will be able to use the zoom and drag the map using always the *Coordinates on current position* button until you see the wished portion of map. 

#### 4.5. Switch to disable clusters

Choosing a group, map will zoom to include all elements of selected group.

It is strongly advised not to switch off since the interactive map performance will worsen noticeably.

#### 4.6. Minimum and maximum values for the zoom

These parameters can be unaltered. They establish how much the user can zoom back (minimum zoom) or zoom forward (maximum zoom).

The embedded values must be integer and it is better not to overcome the default values (maximum 18 and at least 1).


### 5. Publish or save draft

Publishing the map will be displayed to the public.

Saving the map as draft, map can be edited later without publishing it.

## Admin dashboard

You can find the admin dashboard at:

- [map.wikimedia.swiss/admin](https://map.wikimedia.swiss/admin)

![Admin dashboard](/wizard/man/_media/admin-01.png)

In the admin dashboard you can:

1. List, add, change categories on the site;
2. List map on site;
3. Edit map through title; 
4. Chane display order of maps and categories using drag & drop;
6. Publish or unpublish maps.

Press Save to apply the changes.

## Edit a map

On the edit page of the single map you can change what you’ve already added in.

You will see again the wizard form already explained in *How to create a map*. You could edit the query as well as the profile of display the map. 

You can unpublish a previously published map.
