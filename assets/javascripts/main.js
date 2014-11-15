//= require javascripts/initializer
//= require javascripts/vendor/event-source
//= require javascripts/vendor/cuid
//= require javascripts/vendor/essential
//= require javascripts/vendor/micro-template
//= require javascripts/services/url-parser
//= require javascripts/behaviors/result-updater
//= require javascripts/behaviors/results-form

document.addEventListener('DOMContentLoaded', function() {
  Essential.loadBehaviors({
    application: Ogg.Behaviors,
    context: document
  });
});
