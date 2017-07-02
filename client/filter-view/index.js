var reactiveSelect = require('reactive-select');
var template = require('./template.html');
var view = require('view');
var analytics = require('analytics');

var View = module.exports = view(template, function(view, plan) {
  view.reactive.use(reactiveSelect);
  view.bikeFilters = view.find('.bike-filters');
  view.on('active', function() {
    analytics.send_ga({
      category: 'filter',
      action: 'change',
      label: 'toggle transportation method',
      value: 1
    });
    plan.updateRoutes();
  });
  view.on('selected', function() {
    analytics.send_ga({
      category: 'filter',
      action: 'change',
      label: 'select transportation timeframe',
      value: 1
    });
    plan.updateRoutes();
  });
  setTimeout(function(){
    // console.log('"BICYCLE" is an active mode, setting the bike options')
    if (plan.modesCSV() && plan.modesCSV().indexOf('BICYCLE') !== -1){
      view.bikeFilters.classList['remove']('hidden');
    }
    if (plan.flat()){
      $(view.bikeFilters).find('[data-active="flat"]').addClass('active')
    } else {
      $(view.bikeFilters).find('[data-active="flat"]').removeClass('active')
    }

    if (plan.safe()){
      $(view.bikeFilters).find('[data-active="safe"]').addClass('active')
    } else {
      $(view.bikeFilters).find('[data-active="safe"]').removeClass('active')
    }

    if (plan.fast()){
      $(view.bikeFilters).find('[data-active="fast"]').addClass('active')
    } else {
      $(view.bikeFilters).find('[data-active="fast"]').removeClass('active')
    }
  },100)
});

// var times = hourOptions();

// View.prototype.startTimes = function() {
//   return times;
// };

// View.prototype.endTimes = function() {
//   return times;
// };

View.prototype.toggleBikeFilters = function (e) {
  // gets activated when the bike icon is clicked in the mode-filters
  var view = this.reactive.view;
  var el = null;
  if (e.target.nodeName === 'I') {
      el = e.target.parentElement;
  } else {
     el = e.target;
  }
  var isHidden = !view.model[el.getAttribute('data-active')](),
      toggle = isHidden ? 'remove' : 'add';

  view.bikeFilters.classList[toggle]('hidden');
};

var toggleBikeFilters = View.prototype.toggleBikeFilters;

View.prototype.parseInt = parseInt;

// function hourOptions() {
//   var times = [];
//   for (var i = 0; i < 24; i++) {
//     times.push(toOption(i));
//   }
//   return times;
// }

// function toOption(n) {
//   var opt = {
//     name: '',
//     value: n
//   };

//   if (n > 23 || n === 0) opt.name = 'Midnight';
//   else if (n > 12) opt.name = n - 12 + ':00 pm';
//   else if (n === 12) opt.name = 'Noon';
//   else opt.name = n + ':00 am';

//   return opt;
// }
