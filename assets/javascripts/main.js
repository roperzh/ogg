//= require javascripts/vendor/event-source
//= require javascripts/vendor/cuid
//= require javascripts/vendor/essential

'use strict';

window.Ogg = {};
window.Ogg.Behaviors = {};

Ogg.Behaviors.ResultsForm = Essential.Behavior.extend({
  init: function() {
    var idInput = this.el.querySelector('input[type="hidden"]');
    idInput.value = cuid();
  },

  events: {
    "submit": "updateValues"
  },

  updateValues: function() {

  }
});

Ogg.Behaviors.ResultUpdater = Essential.Behavior.extend({
  init: function() {
    var id = this.getQueryVariable("id");
    var source = new EventSource("/events/" + id);
    source.onmessage = this.updateContent.bind(this);
  },

  updateContent: function(event) {
    var wrapper = document.createElement("li");
    var data = JSON.parse(event.data);
    var innerContent = '';
    var imgSrc = data.OgAttrs["og:image"] ? data.OgAttrs["og:image"] : "http://dummyimage.com/200x200/000000/fff.jpg&text=none";

    wrapper.className = "scrapped-page ten columns";
    wrapper.style.opacity = 0;

    // innerContent += '<a href="' + data.Url + '">' + data.Url + '</a>';
    innerContent += '<article class="scrapped-data">';
    innerContent += '<h3>' + data.Title + '</h3>';
    innerContent += '<p>' + data.Description + '</p>';

    innerContent += '<h4>OG Data</h4>';
    innerContent += '<ul class="og-list">';

    for (var attrIndex in data.OgAttrs) {
      if(attrIndex.indexOf("image") === -1) {
        innerContent += '<li><strong>' + attrIndex + ': </strong>' + data.OgAttrs[attrIndex] + '</li>'
      }
    };

    innerContent += '</ul></article>';

    innerContent += '<figure><img src="' + imgSrc + '" alt="og:image"></figure>';

    wrapper.innerHTML = innerContent;

    this.el.appendChild(wrapper);

    setTimeout(function() {
      wrapper.style.opacity = 1;
    }, 10);
  },

  getQueryVariable: function(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) == variable) {
        return decodeURIComponent(pair[1]);
      }
    }
    console.log('Query variable %s not found', variable);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  Essential.loadBehaviors({
    application: Ogg.Behaviors,
    context: document
  });
});
