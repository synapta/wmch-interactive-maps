/**
    prefix: 'glyphicon',
    markerColor: 'blue'

    icon: 'plane',
    markerColor: 'cadetblue'

    icon: 'home',
    markerColor: 'red'

    icon: 'train',
    markerColor: 'darkred'
});
**/

// 'green',  // si confonde con cluster minori
// 'white',  // non si vede icona
//  'black',
//     'purple',  'darkpurple',
// 0- 9
// 'blue',
// 'darkblue',
// 'cadetblue',
// 0 = red
// 1-3 = darkred
// 4-8 = orange
// 9-12 = darkgreen
// > 12 = green


var markerCounter2PinDataObj = function (counters) {
    //  restituisce un colore adeguato per il numero di elementi
    var avcount = 0;
    var obj = new Object();
    // Se non esiste in tutte le lingue ufficiali o tot <= 2
    if (!counters['wikipediaBaseLang']) {
        obj.color = markerAvailableColors[avcount];
        obj.label = markerLabels[avcount];
        return obj;
    }
    avcount += 1;
    if (counters['wikipediaBaseLang'] == 1 || (counters['wikipediaBaseLang'] == 2 && counters['commons'] == 0)) {
      obj.color = markerAvailableColors[avcount];
      obj.label = markerLabels[avcount];
      return obj;
    }
    avcount += 1;
    if ((counters['wikipediaBaseLang'] == 2 && counters['commons'] == 1) || counters['wikipediaBaseLang'] == 3 || (counters['wikipediaBaseLang'] == 4 && counters['commons'] == 0)) {
      obj.color = markerAvailableColors[avcount];
      obj.label = markerLabels[avcount];
      return obj;
    }
    avcount += 1;
    if (counters['wikipediaBaseLang'] == 4 && counters['commons'] == 1) {
      obj.color = markerAvailableColors[avcount];
      obj.label = markerLabels[avcount];
      return obj;
    }
};

var markerAvailableColors = [
    'black',
    'red',
    'orange',
    'green'
];
var markerLabels = [
    "Poor",
    "Mediocre",
    "Good",
    "Excellent"
];

/**
function generatePin (L, icon, color) {

  return L.geoJSON (null, {
        onEachFeature: function (feature, layer) {
            popupGenerator(feature, layer);
        },
        pointToLayer: function (feature, latlng) {
            var pin = L.AwesomeMarkers.icon({
                icon: pinIcon,
                prefix: 'fa',
                markerColor: feature.properties.pin.color
            });
            return L.marker(latlng, { icon: pin }).on('popupopen', openModal);
        },
        filter: function (feature, layer) {
            return feature.properties.pin.color === "black";
        }
  });
}
 **/
