var mapView = require('map-view');
var config = require('config');
var get = require('./client/request').get

/* 
 * This code is pulled into separate file b/c the mapping makes it unecessarily complicated.
 * This being said, the mapping will allow us to switch back to the amigo geocode with ease
 * in index.js
 */

window.modeify.config['geocode_bounds'] = {}
window.modeify.config['geocode_bounds']['center'] = [37.303626, -121.884750];

/*
 * Utils
 */

var defineProp = function (path, oldVal, newVal) {
  Object.defineProperty(path, newVal, Object.getOwnPropertyDescriptor(path, oldVal));
  delete path[oldVal];
};

var getCurrMap = function () {
  return mapView.getMap();
};

/*
 * Suggestions geocoding
 */

GoogleSuggestions = function (text, res) {
  this.text = text;
  this.res = res;

  this.futureRes = {
    body: {}
  };
}

GoogleSuggestions.prototype = {
  responseMapper: function (res) {
    if (status !== google.maps.places.PlacesServiceStatus.OK) {
      console.warn('PlacesService status:'+status)
      return;
    }
    var execute = function (func) { func(); };
    var toMap = [
      function getData () {
        defineProp(res.body, 'result', 'features');
      },

      function mapLocations () {
        res.body.features.forEach(function (feature, idx) {
          defineProp(feature, 'address_components', 'properties');
          feature.properties = {
            country_a: "USA", // google results are always filtered to USA
            region_a: "CA",
            label: res.body.features[idx].formatted_address
          };

          defineProp(feature.geometry, 'location', 'coordinates');
          var lat = feature.geometry.coordinates.lat,
              lng = feature.geometry.coordinates.lng;
          feature.geometry.coordinates = [lng, lat];
        });
      }
    ];

    toMap.forEach(execute);
    return res;
  },

  _getPlaces: function () {
    var dfd = $.Deferred(),
        futureRes = this.futureRes,
        text = this.text;

    var getMapSpecs = function() {
      var map = getCurrMap();
      var mapBoundNorthEast = map.getBounds().getNorthEast();
      return {
        radius: 17000,
        location: {lat: 37.303626, lng: -121.884750}
        // TODO: make this part of a global configuration, using the following as defaults
        // radius: mapBoundNorthEast.distanceTo(map.getCenter()),
        // location: map.getCenter()
      };
    };
    var specs = getMapSpecs();

    var placesCallback = function (results, status) {
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.warn('PlacesService status:'+status)
        return;
      }
      console.log('placesCallback results=', results)
      results.forEach(function (feature, idx) {
        feature.formatted_address = feature.name + ', ' + feature.vicinity;
        feature.address_components = {};
        feature.geometry = {
          location: {
            lat: feature.geometry.location.lat(),
            lng: feature.geometry.location.lng()
          } 
        };
      });

      if (!futureRes.body.result) {
        futureRes.body.result = results
      } else {
        var method = $.isNumeric(text.charAt(0)) ? 'push' : 'unshift';
        Array.prototype[method].apply(futureRes.body.result, results);
      }
      dfd.resolve();
    }

    var request = {
      'keyword': this.text,
      'location': specs.location,
      'radius': specs.radius
    };

    var service = new google.maps.places.PlacesService(document.createElement('div'));
    service.nearbySearch(request, placesCallback);
    return dfd.promise();
  },

  //_getAutocomplete: function () {
    //var futureRes = this.futureRes,
    //    text = this.text;
    //console.log('making request to Google Autocomplete service.')
    //var endpoint = 'https://maps.googleapis.com/maps/api/place/autocomplete/xml';
    //var parameter = {
    //  'input': text,
    //  'key': 'AIzaSyD8qeGQRYwwYO6-xFPAhtjh8doJJO2UrL0'
    //};
    //var query_params = '?' + Object.keys(parameter).map(function(k) { return k + '=' + encodeURIComponent(parameter[k]) }).join('&');
    //var res = get(endpoint+query_params,  function(err, res) {
    //  console.log('autocomplete response callback', err, res)
    //  if (err) {
    //    log('<-- geocoding error %s', err);
    //    return null;
    //  } else {
    //    log('<-- geocoding complete %j', res.body);
    //    return res.body;
    //  }
    //})
  //  return res
  //},

  _getAutocomplete: function () {
    var dfd = $.Deferred(),
        futureRes = this.futureRes,
        text = this.text;


    var autocompleteCallback = function (results, status) {
      
      console.log('autocompleteCallback status='+status+', results=', results)
      results.forEach(function (feature, idx) {
        feature.formatted_address = feature.description;
        feature.address_components = {};
        feature.geometry = {location: { lat:0, lng:0 }}
      });

      futureRes.body.result = results
      dfd.resolve();
    }
    var location_bounds = new google.maps.LatLng({lat: 37.303626, lng: -121.884750});

    var request = {
      radius: 17000,
      location: location_bounds,
      input: this.text
    };

    var service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions(request, autocompleteCallback);
    return dfd.promise();


  },

  _getGeocode: function () {
    var futureRes = this.futureRes,
        text = this.text;

    var endpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
    var parameter = {
      'address': text,
      'key': config.google_api_key(),
      'components': 'administrative_area:CA|country:US'
    };

    if (this.res && this.res.body && this.res.body.boundingbox) {
      var boundsArr = this.res.body.boundingbox.split(','),
          westArr = boundsArr[0].split(' '),
          eastArr = boundsArr[1].split(' '),
          bounds = westArr[0] + '|' + westArr[1] + '|' + eastArr[0] + '|' + eastArr[1];

      parameter.bounds = bounds;
    }

    return $.get(endpoint, parameter).then(function (geoRes) {
      if (!futureRes.body.result) {
        futureRes.body.result = geoRes.results
      } else {
        var method = $.isNumeric(text.charAt(0)) ? 'unshift' : 'push';
        Array.prototype[method].apply(futureRes.body.result, geoRes.results);
      }
    });
  },

  get: function () {
    self = this; 
    return self._getAutocomplete()
    //apiCalls.push(self._getGeocode());
    //apiCalls.push(self._getPlaces());
    //return $.when.apply($, apiCalls).then(function () { 
    //  return self.futureRes;
    //});
  }
};


/*
 * Google Places Endpoint
 */

GooglePlaces = function (place_id) {
  this.place_id = place_id;
  this.futureRes = {
    body: {}
  };
}

GooglePlaces.prototype = {
  
  _getPlace: function () {
    var dfd = $.Deferred(),
        futureRes = this.futureRes,
        place_id = this.place_id;


    var placesCallback = function (placeResult, status) {
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.warn('PlacesService status:'+status)
        return;
      }
      console.log('placesCallback PlaceResult=', placeResult)
      futureRes.body.result = placeResult
      dfd.resolve();
    }

    var request = {
      placeId: place_id
    };


    var service = new google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails(request, placesCallback);

    return dfd.promise();
  },

  get: function () {
    var self = this;  
    return self._getPlace();
  }
};



/*
 * Reverse geocoding
 */

GoogleReverse = function (ll) {
  this.ll = ll;
  this.parameter = this.getParameter();
}

GoogleReverse.prototype = {
  endpoint: 'https://maps.googleapis.com/maps/api/geocode/json',

  responseMapper: function (res) {
    var execute = function (func) { func(); };
    var toMap = [
      function getData () {
        defineProp(res.body, 'results', 'features');
      },

      function setLabel () {
        var feature = res.body.features[0],
            props = feature.properties = {};
        props.label = feature.formatted_address;
      },

      function mapCoords () {
        var geo = res.body.features[0].geometry,
            lat = geo.location.lat,
            lng = geo.location.lng;
        defineProp(res.body.features[0].geometry, 'location', 'coordinates');
        geo.coordinates = [lng, lat];
      },

      function setId () {
        var feature = res.body.features[0],
            id = feature.place_id;
        feature.properties.id = id;
        delete feature.place_id;
      }
    ];
    
    toMap.forEach(execute);
    return res;
  },

  getParameter: function () {
    return {
      latlng: this.ll[1] + ', ' + this.ll[0],
      'key': config.google_api_key()
    }
  }
};

module.exports = {
  googleSuggestions: function (text, res) {
    return new GoogleSuggestions(text, res);
  },
  googleReverse: function (ll) {
    return new GoogleReverse(ll);
  },
  googlePlaceLookup: function (place_id) {
    return new GooglePlaces(place_id);
  }
};
