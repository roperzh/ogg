Ogg.Behaviors.ResultUpdater = Essential.Behavior.extend({
  init: function() {
    var id = Ogg.Services.UrlParser.getQueryVariable("id");
    var source = new EventSource("/events/" + id);
    source.onmessage = this.updateContent.bind(this);
  },

  updateContent: function(event) {
    var wrapper = document.createElement("ul");
    var data = JSON.parse(event.data);
    var fallbackImg = "http://dummyimage.com/200x200/000000/fff.jpg&text=none";

    data.OgAttrs["og:image"] = data.OgAttrs["og:image"] ?
      Ogg.Services.UrlParser.resolveUrl(data.Url, data.OgAttrs["og:image"]) : fallbackImg ;

    wrapper.innerHTML = tmpl("item_tmpl", data);
    var li = wrapper.firstElementChild;

    this.el.appendChild(li);

    setTimeout(function() {
      li.style.opacity = 1;
    }, 10);
  }
});
