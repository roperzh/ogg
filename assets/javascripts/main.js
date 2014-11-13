//= require javascripts/vendor/event-source

var source = new EventSource("/events");
var content = document.querySelector(".content");

source.onmessage = function(event) {
  console.log("event", event);
  var wrapper = document.createElement("li");
  var data = JSON.parse(event.data);
  var innerContent = '';

  innerContent += '<a href="' + data.Url + '">' + data.Url + '</a>';
  innerContent += '<h3>' + data.Title + '</h3>';
  innerContent += '<p>' + data.Description + '</p>';

  wrapper.innerHTML = innerContent;

  content.appendChild(wrapper);
};
