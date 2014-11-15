// -------------------------------------------
//   Results Form
// -------------------------------------------

Ogg.Behaviors.ResultsForm = Essential.Behavior.extend({
  init: function() {
    var idInput = this.el.querySelector('input[type="hidden"]');
    idInput.value = cuid();
  },

  events: {
    "submit": "updateValues"
  },

  updateValues: function(e) {
    var urlInput = this.el.querySelector('input[type="text"]');
    urlInput.value = this.setProtocol(urlInput.value);
  },

  setProtocol: function(url) {
    if (url.search(/^http[s]?\:\/\//) == -1) {
      url = 'http://' + url;
    }

    return url;
  }
});
