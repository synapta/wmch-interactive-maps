const layerConfig = {
  "version": "v1",
  "config": {
    "visState": {
      "filters": [
        {
          "dataId": [
            "wmch_data_time"
          ],
          "id": "lbdu5d2oe",
          "name": [
            "timestamp"
          ],
          "type": "timeRange",
          "value": [
            1577184724000,
            1579035123000
          ],
          "enlarged": false,
          "plotType": "histogram",
          "yAxis": null
        },
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
            16
          ],
          "enlarged": false,
          "plotType": "histogram",
          "yAxis": null
        }
      ],
      "layers": [
        {
          "id": "luccf1q",
          "type": "icon",
          "config": {
            "dataId": "wmch_data_static",
            "label": "Static Data",
            "color": [
              23,
              184,
              190,
              255
            ],
            "columns": {
              "lat": "lat",
              "lng": "lon",
              "icon": "icon"
            },
            "isVisible": true,
            "visConfig": {
              "radius": 50,
              "fixedRadius": false,
              "opacity": 1,
              "colorRange": {
                "name": "Uber Viz Diverging 1.5",
                "type": "diverging",
                "category": "Uber",
                "colors": [
                  "#00939C",
                  "#5DBABF",
                  "#BAE1E2",
                  "#F8C0AA",
                  "#DD7755",
                  "#C22E00"
                ]
              },
              "radiusRange": [
                1,
                30
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
            "colorScale": "quantile",
            "sizeField": null,
            "sizeScale": "linear"
          }
        },
        {
          "id": "80lkaa",
          "type": "icon",
          "config": {
            "dataId": "wmch_data_time",
            "label": "new layer",
            "color": [
              250,
              227,
              0
            ],
            "columns": {
              "lat": "lat",
              "lng": "lon",
              "icon": "icon"
            },
            "isVisible": true,
            "visConfig": {
              "radius": 87.9,
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
        }
      ],
      "interactionConfig": {
        "tooltip": {
          "fieldsToShow": {
            "wmch_data_static": [
              "name",
              "languages",
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
      "bearing": 0,
      "dragRotate": false,
      "latitude": 46.73194962387401,
      "longitude": 7.999332695433259,
      "pitch": 0,
      "zoom": 7.599985831836746,
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
          "icon": "https://api.mapbox.com/styles/v1/http://localhost:9000/styles/osm-bright/style.json/static/-122.3391,37.7922,9,0,0/400x300?access_token=&logo=false&attribution=false",
          "id": "OpenStreetMap",
          "label": "OpenStreetMap",
          "url": "http://localhost:9000/styles/osm-bright/style.json"
        }
      }
    }
  }
};

export default layerConfig;
