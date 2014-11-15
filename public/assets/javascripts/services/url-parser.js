// -------------------------------------------
//   Url Parser
// -------------------------------------------

Ogg.Services.UrlParser = {
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
  },

  resolveUrl: function(baseUrl, url) {
    if (url.indexOf("/") == 0) {
      url = baseUrl + url;
    }

    return url;
  }
}
