var debounce = require('debounce');
var log = require('./client/log')('transitive');
var session = require('session');
var Transitive = require('conveyal~transitive.js');

var transitive = module.exports = new Transitive({
  displayMargins: {
    bottom: 43,
    right: 330,
    top: 43
  },
  draggableTypes: ['PLACE'],
  gridCellSize: 200,
  useDynamicRendering: true,
  styles: require('./style')
});

var placeChanged = debounce(function(name, coordinate) {
  var plan = session.plan();
  plan.setAddress(name, {'ll':coordinate.lng + ',' + coordinate.lat}, function(err, rees) {
    if (!err) plan.updateRoutes();
  });
}, 150, true);

transitive.on('place.from.dragend', function(place) {
  placeChanged('from', {
    lat: place.place_lat,
    lng: place.place_lon
  });
});

transitive.on('place.to.dragend', function(place) {
  placeChanged('to', {
    lat: place.place_lat,
    lng: place.place_lon
  });
});
