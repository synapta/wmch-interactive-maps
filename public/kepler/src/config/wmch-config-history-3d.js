const layerConfig3D = {
  "version": "v1",
  "config": {
    "visState": {
      "filters": [
        {
          "dataId": [
            "wmch_data_static"
          ],
          "id": "a4zxb4nb",
          "name": [
            "languages"
          ],
          "type": "range",
          "value": [
            0,
            27.9
          ],
          "enlarged": false,
          "plotType": "histogram",
          "yAxis": null
        }
      ],
      "layers": [
        {
          "id": "80lkaa",
          "type": "icon",
          "config": {
            "dataId": "wmch_data_time",
            "label": "History",
            "color": [
              195,
              40,
              153
            ],
            "columns": {
              "lat": "lat",
              "lng": "lon",
              "icon": "icon"
            },
            "isVisible": false,
            "visConfig": {
              "radius": 90,
              "fixedRadius": false,
              "opacity": 0.8,
              "colorRange": {
                "name": "Global Warming",
                "type": "sequential",
                "category": "Uber",
                "colors": [
                  "#5A1846",
                  "#900C3F",
                  "#C70039",
                  "#E3611C",
                  "#F1920E",
                  "#FFC300"
                ]
              },
              "radiusRange": [
                0,
                50
              ]
            },
            "textLabel": [
              {
                "field": null,
                "color": [
                  255,
                  255,
                  255
                ],
                "size": 18,
                "offset": [
                  0,
                  0
                ],
                "anchor": "start",
                "alignment": "center"
              }
            ]
          },
          "visualChannels": {
            "colorField": null,
            "colorScale": "quantile",
            "sizeField": null,
            "sizeScale": "linear"
          }
        },
        {
          "id": "hzqjar",
          "type": "hexagon",
          "config": {
            "dataId": "wmch_data_static",
            "label": "Live Data",
            "color": [
              23,
              184,
              190,
              255
            ],
            "columns": {
              "lat": "lat",
              "lng": "lon"
            },
            "isVisible": true,
            "visConfig": {
              "opacity": 1,
              "worldUnitSize": 1.5,
              "resolution": 8,
              "colorRange": {
                "name": "Custom Palette",
                "type": "custom",
                "category": "Custom",
                "colors": [
                  "#231F20",
                  "#990000",
                  "#E5AD40",
                  "#339966"
                ]
              },
              "coverage": 1,
              "sizeRange": [
                0,
                894.75
              ],
              "percentile": [
                1.33,
                100
              ],
              "elevationPercentile": [
                0,
                100
              ],
              "elevationScale": 50,
              "colorAggregation": "average",
              "sizeAggregation": "average",
              "enable3d": true
            },
            "textLabel": [
              {
                "field": null,
                "color": [
                  255,
                  255,
                  255
                ],
                "size": 50,
                "offset": [
                  0,
                  0
                ],
                "anchor": "middle",
                "alignment": "center"
              }
            ]
          },
          "visualChannels": {
            "colorField": {
              "name": "languages",
              "type": "integer"
            },
            "colorScale": "quantize",
            "sizeField": {
              "name": "languages",
              "type": "integer"
            },
            "sizeScale": "linear"
          }
        }
      ],
      "interactionConfig": {
        "tooltip": {
          "fieldsToShow": {
            "wmch_data_static": [
              "name",
              "languages",
              "wikipedia_articles",
              "wikidata",
              "commons",
              "website",
              "<img>"
            ],
            "wmch_data_time": [
              "name",
              "wikidata",
              "commons",
              "website",
              "<img>"
            ]
          },
          "enabled": true
        },
        "brush": {
          "size": 26.3,
          "enabled": false
        },
        "coordinate": {
          "enabled": false
        }
      },
      "layerBlending": "normal",
      "splitMaps": [],
      "animationConfig": {
        "currentTime": null,
        "speed": 1
      }
    },
    "mapState": {
      "bearing": 24,
      "dragRotate": true,
      "latitude": 46.74517850377229,
      "longitude": 7.650847552135359,
      "pitch": 50,
      "zoom": 7.601148252686482,
      "isSplit": false
    },
    "mapStyle": {
      "styleType": "OpenStreetMap",
      "topLayerGroups": {},
      "visibleLayerGroups": {
        "label": true,
        "road": true,
        "building": true,
        "water": true,
        "land": true
      },
      "threeDBuildingColor": [
        230.92517894351974,
        227.2005792831404,
        223.47597962276103
      ],
      "mapStyles": {
        "OpenStreetMap": {
          "accessToken": null,
          "custom": true,
          "icon": "https://api.mapbox.com/styles/v1/https://tile.synapta.io/styles/osm-bright/style.json/static/-122.3391,37.7922,9,0,0/400x300?access_token=&logo=false&attribution=false",
          "id": "OpenStreetMap",
          "label": "OpenStreetMap",
          "url": "https://tile.synapta.io/styles/osm-bright/style.json"
        }
      }
    }
  }
};

export default layerConfig3D;
