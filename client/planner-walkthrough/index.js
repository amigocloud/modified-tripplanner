var config = require('config');
var introJs = require('intro.js').introJs;

/**
 * Expose a function to activate the walktrhough
 */

module.exports = function walkthrough() {
  var intro = introJs();

  intro.onbeforechange(function(el) {
    if (el.classList.contains('option')) {
      var simple = el.querySelector('.simple .show-hide');
      simple.click();
    }
  });

  intro.setOptions({
    disableInteraction: false,
    exitOnEsc: false,
    exitOnOverlayClick: false,
    overlayOpacity: 1,
    scrollToElement: false,
    showBullets: false,
    showProgress: false,
    showStepNumbers: false,
    skipLabel: 'Skip',
    steps: [{
      intro: 'Let\'s take a look at how to use ' + config.application() + '!'
    }, {
      element: document.querySelector('#locations-form'),
      intro: 'Here you can change your start and end locations and the travel modes you\'d like to see.',
      position: 'bottom'
    }, {
      element: document.querySelector('.Options'),
      intro: 'These are the best options we found for your trip. We sorted them using a combination of factors including cost, calories burned, ease, and time.',
      position: 'top'
    }] 

    //TODO: #119 Make this help dialog work better.
    // {
    //   element: document.querySelector('.help-me-choose'),
    //   intro: 'Can\'t decide on an option? Select "Help Me Choose" to compare each factor directly and rank by your own preferences.',
    //   position: 'left'
    // }, {
    //   element: document.querySelectorAll('.option')[0],
    //   intro: 'Here you can explore the details of a specific option including step by step directions and the factors we\'ve used to rate this option.',
    //   position: 'top'
    // }, {
    //   element: document.querySelector('.show-profile-button'),
    //   intro: 'Go to your profile to change your travel preferences, manage your account, or view saved journeys.',
    //   position: 'bottom',
    // }]
  });

  intro.start();
};
