;(function (global) {

if ("EventSource" in global) return;

var reTrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;

var EventSource = function (url) {
  var eventsource = this,  
      interval = 500, // polling interval  
      lastEventId = null,
      cache = '';

  if (!url || typeof url != 'string') {
    throw new SyntaxError('Not enough arguments');
  }

  this.URL = url;
  this.readyState = this.CONNECTING;
  this._pollTimer = null;
  this._xhr = null;
  
  function pollAgain(interval) {
    eventsource._pollTimer = setTimeout(function () {
      poll.call(eventsource);
    }, interval);
  }
  
  function poll() {
    try { // force hiding of the error message... insane?
      if (eventsource.readyState == eventsource.CLOSED) return;

      // NOTE: IE7 and upwards support
      var xhr = new XMLHttpRequest();
      xhr.open('GET', eventsource.URL, true);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      // we must make use of this on the server side if we're working with Android - because they don't trigger 
      // readychange until the server connection is closed
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      if (lastEventId != null) xhr.setRequestHeader('Last-Event-ID', lastEventId);
      cache = '';
    
      xhr.timeout = 50000;
      xhr.onreadystatechange = function () {
        if (this.readyState == 3 || (this.readyState == 4 && this.status == 200)) {
          // on success
          if (eventsource.readyState == eventsource.CONNECTING) {
            eventsource.readyState = eventsource.OPEN;
            eventsource.dispatchEvent('open', { type: 'open' });
          }

          var responseText = '';
          try {
            responseText = this.responseText || '';
          } catch (e) {}
        
          // process this.responseText
          var parts = responseText.substr(cache.length).split("\n"),
              eventType = 'message',
              data = [],
              i = 0,
              line = '';
            
          cache = responseText;
        
          // TODO handle 'event' (for buffer name), retry
          for (; i < parts.length; i++) {
            line = parts[i].replace(reTrim, '');
            if (line.indexOf('event') == 0) {
              eventType = line.replace(/event:?\s*/, '');
            } else if (line.indexOf('retry') == 0) {                           
              retry = parseInt(line.replace(/retry:?\s*/, ''));
              if(!isNaN(retry)) { interval = retry; }
            } else if (line.indexOf('data') == 0) {
              data.push(line.replace(/data:?\s*/, ''));
            } else if (line.indexOf('id:') == 0) {
              lastEventId = line.replace(/id:?\s*/, '');
            } else if (line.indexOf('id') == 0) { // this resets the id
              lastEventId = null;
            } else if (line == '') {
              if (data.length) {
                var event = new MessageEvent(data.join('\n'), eventsource.url, lastEventId);
                eventsource.dispatchEvent(eventType, event);
                data = [];
                eventType = 'message';
              }
            }
          }

          if (this.readyState == 4) pollAgain(interval);
          // don't need to poll again, because we're long-loading
        } else if (eventsource.readyState !== eventsource.CLOSED) {
          if (this.readyState == 4) { // and some other status
            // dispatch error
            eventsource.readyState = eventsource.CONNECTING;
            eventsource.dispatchEvent('error', { type: 'error' });
            pollAgain(interval);
          } else if (this.readyState == 0) { // likely aborted
            pollAgain(interval);
          } else {
          }
        }
      };
    
      xhr.send();
    
      setTimeout(function () {
        if (true || xhr.readyState == 3) xhr.abort();
      }, xhr.timeout);
      
      eventsource._xhr = xhr;
    
    } catch (e) { // in an attempt to silence the errors
      eventsource.dispatchEvent('error', { type: 'error', data: e.message }); // ???
    } 
  };
  
  poll(); // init now
};

EventSource.prototype = {
  close: function () {
    // closes the connection - disabling the polling
    this.readyState = this.CLOSED;
    clearInterval(this._pollTimer);
    this._xhr.abort();
  },
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2,
  dispatchEvent: function (type, event) {
    var handlers = this['_' + type + 'Handlers'];
    if (handlers) {
      for (var i = 0; i < handlers.length; i++) {
        handlers[i].call(this, event);
      }
    }

    if (this['on' + type]) {
      this['on' + type].call(this, event);
    }
  },
  addEventListener: function (type, handler) {
    if (!this['_' + type + 'Handlers']) {
      this['_' + type + 'Handlers'] = [];
    }
    
    this['_' + type + 'Handlers'].push(handler);
  },
  removeEventListener: function (type, handler) {
    var handlers = this['_' + type + 'Handlers'];
    if (!handlers) {
      return;
    }
    for (var i = handlers.length - 1; i >= 0; --i) {
      if (handlers[i] === handler) {
        handlers.splice(i, 1);
        break;
      }
    }
  },
  onerror: null,
  onmessage: null,
  onopen: null,
  readyState: 0,
  URL: ''
};

var MessageEvent = function (data, origin, lastEventId) {
  this.data = data;
  this.origin = origin;
  this.lastEventId = lastEventId || '';
};

MessageEvent.prototype = {
  data: null,
  type: 'message',
  lastEventId: '',
  origin: ''
};

if ('module' in global) module.exports = EventSource;
global.EventSource = EventSource;
 
})(this);

/**
 * cuid.js
 * Collision-resistant UID generator for browsers and node.
 * Sequential for fast db lookups and recency sorting.
 * Safe for element IDs and server-side lookups.
 *
 * Extracted from CLCTR
 * 
 * Copyright (c) Eric Elliott 2012
 * MIT License
 */

/*global window, navigator, document, require, process, module */
(function (app) {
  'use strict';
  var namespace = 'cuid',
    c = 0,
    blockSize = 4,
    base = 36,
    discreteValues = Math.pow(base, blockSize),

    pad = function pad(num, size) {
      var s = "000000000" + num;
      return s.substr(s.length-size);
    },

    randomBlock = function randomBlock() {
      return pad((Math.random() *
            discreteValues << 0)
            .toString(base), blockSize);
    },

    safeCounter = function () {
      c = (c < discreteValues) ? c : 0;
      c++; // this is not subliminal
      return c - 1;
    },

    api = function cuid() {
      // Starting with a lowercase letter makes
      // it HTML element ID friendly.
      var letter = 'c', // hard-coded allows for sequential access

        // timestamp
        // warning: this exposes the exact date and time
        // that the uid was created.
        timestamp = (new Date().getTime()).toString(base),

        // Prevent same-machine collisions.
        counter,

        // A few chars to generate distinct ids for different
        // clients (so different computers are far less
        // likely to generate the same id)
        fingerprint = api.fingerprint(),

        // Grab some more chars from Math.random()
        random = randomBlock() + randomBlock();

        counter = pad(safeCounter().toString(base), blockSize);

      return  (letter + timestamp + counter + fingerprint + random);
    };

  api.slug = function slug() {
    var date = new Date().getTime().toString(36),
      counter,
      print = api.fingerprint().slice(0,1) +
        api.fingerprint().slice(-1),
      random = randomBlock().slice(-2);

      counter = safeCounter().toString(36).slice(-4);

    return date.slice(-2) + 
      counter + print + random;
  };

  api.globalCount = function globalCount() {
    // We want to cache the results of this
    var cache = (function calc() {
        var i,
          count = 0;

        for (i in window) {
          count++;
        }

        return count;
      }());

    api.globalCount = function () { return cache; };
    return cache;
  };

  api.fingerprint = function browserPrint() {
    return pad((navigator.mimeTypes.length +
      navigator.userAgent.length).toString(36) +
      api.globalCount().toString(36), 4);
  };

  // don't change anything from here down.
  if (app.register) {
    app.register(namespace, api);
  } else if (typeof module !== 'undefined') {
    module.exports = api;
  } else {
    app[namespace] = api;
  }

}(this.applitude || this));

//     EssentialJS v0.5.0
//     Copyright (c)2014 Roberto Dip
//     Distributed under MIT license
//     http://roperzh.github.io/essential.js

window.Essential = {

  rootElement: document,

  Core: {},

  // Start
  // -----
  //
  // since v0.1.0
  //
  // A wrapper of  `#Essential.loadBehaviors`, this method is deprecated
  // direct usage of `loadBehaviors` is encouraged.
  //
  // Param application[`Object`] an object containing behaviors names as a key
  // and behaviors objects as a value.

  start: function(application) {
    this.loadBehaviors({
      application: application
    });
  },

  // Load Behaviors
  // --------------
  //
  // since v0.5.0
  //
  // Wakes up the engine, searching and attaching
  // behaviors with their proper elements
  //
  // Param options[`Object`] allows the follwing values:
  //  - `application`[`Object`] an object containing behaviors names as a key
  //    and behaviors objects as a value
  //  - `context` [`DOMElement`] context to look for behaviors.
  //     If no context is provided the default is `Essential.rootElement`
  //
  // **Example**
  //
  // ```javascript
  // MyApp = {};
  // MyApp.Carousel = Essential.Behaviors.extend();
  // Essential.loadBehaviors({ application: MyApp, context: document });
  // // will attach the carousel behavior to proper elements
  // ```

  loadBehaviors: function(options) {
    options.context = options.context || this.rootElement;

    var initializedBehaviors =
      this.initializeBehaviors(options.application, options.context);

    this.launchBehaviors(initializedBehaviors);
  },

  // Initialize Behaviors
  // --------------------
  //
  // Crawls an element looking for behaviors and call `#new` on every behavior
  // found with `lateStart = true`, so the behaviors are initialized, but
  // there is no event delegation
  //
  // param application [`Object`] object containing behaviors to be initialized
  //
  // param element [`DomeElement`] context to look for declared behaviors

  initializeBehaviors: function(application, element) {
    var behaviorsInDOM = this.Core.crawl(element),
      rawBehaviorsNames = Object.keys(behaviorsInDOM),
      initializedBehaviors = [],
      i = -1;

    while(rawBehaviorsNames[++i]) {
      var rawName = rawBehaviorsNames[i],
        name = this.Core.camelize(rawName),
        behavior = application[name];

      if(typeof behavior !== "undefined") {
        var elementsWithBehavior = behaviorsInDOM[rawName],
          j = -1;

        while(elementsWithBehavior[++j]) {
          var initializedBehavior = behavior.new(elementsWithBehavior[j], true);
          initializedBehaviors.push(initializedBehavior);
        }
      }
    }

    return initializedBehaviors;
  },

  // Launch Behaviors
  // ----------------
  //
  // Given a list of behaviors, this method sort these based on their
  // `priority` value, and then call `#start` on every one
  //
  // param behaviorList[`Array<Object>`] an array containing behaviors already
  // initialized

  launchBehaviors: function(behaviorList) {
    var sortedBehaviors = behaviorList.sort(this.Core.SortMethods.byPriority),
      i = -1;

    while(sortedBehaviors[++i]) {
      sortedBehaviors[i].start();
    }
  }
};
/*!
 * Includes proto-js by Axel Rauschmayer
 * https://github.com/rauschma/proto-js
 */

if (!Object.getOwnPropertyDescriptors) {
  Object.getOwnPropertyDescriptors = function (obj) {
    var descs = {};
    Object.getOwnPropertyNames(obj).forEach(function (propName) {
      descs[propName] = Object.getOwnPropertyDescriptor(obj, propName);
    });
    return descs;
  };
}

var Proto = {
  new: function () {
    var instance = Object.create(this);
    if (instance.constructor) {
      instance.constructor.apply(instance, arguments);
    }
    return instance;
  },

  extend: function (subProps) {
    var subProto = Object.create(this, Object.getOwnPropertyDescriptors(subProps));
    subProto.super = this;
    return subProto;
  },
};

Function.prototype.extend = function (subProps) {
  var constrFunc = this;
  var tmpClass = Proto.extend.call(constrFunc.prototype, Proto);
  return tmpClass.extend(subProps);
};
// Custom Event Polyfill
// ---------------------
//
// since 0.5.0
//
// source: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
//
// Allows the usage of custom events on IE 9 - 10

function CustomEvent ( event, params ) {
  params = params || { bubbles: false, cancelable: false, detail: undefined };
  var evt = document.createEvent( 'CustomEvent' );
  evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
  return evt;
 };

CustomEvent.prototype = window.Event.prototype;

window.CustomEvent = CustomEvent;
// Behavior
// --------
//
// Represents a behavior of some element or group of elements.
// The objetive is define a set of rules and events which
// can be associated to an element and reutilized later on
//
// When a behavior is defined, a hash of events must be defined too,
// and on initialization a DOM element must be provided
//
// Also you can define an `init` function, which is always called when the
// behavior is initialized
//
// **Example**
// ```javascript
// Carousel = Essential.Behavior.extend({
//   events: {
//     "click .next": "goToNextSlide"
//   },
//
//  init: function() {
//    // Called on behavior initialization
//  },
//
//   goToNextSlide: function(e) {
//     //...
//   }
// });
//
// var carousel = Carousel.new(domElement);
// ```

Essential.Behavior = Proto.extend({
  constructor: function(domElement, lateStart) {
    this.el = domElement;

    // A behavior can be initialized without attaching events with the `lateStart`
    // flag, if it is present the methods `delegateEvents` and `ìnit` are omitted
    // but can be called later with `start`
    //
    // **Example**
    // ```javascript
    // carousel = new Carousel(domElement, true);
    // // delegateEvents and init not called
    //
    // carousel.start();
    // // delegateEvents and init called
    // ```

    if(!lateStart) {
      this.start();
    }
  },

  start: function() {
    this.delegateEvents();
    this.listenChannels();

    if(typeof this.init === "function") {
      this.init();
    }
  },

  // Delegate Events
  // ---------------
  //
  // since v0.1.0
  //
  // Delegates events declared in `this.events`, using `this.el` as a context

  delegateEvents: function() {
    Essential.Core.mapEvents.call(this, this.events, this.el);
  },

  // Listen Channels
  // ---------------
  //
  // since v0.5.0
  //
  // Attach event handlers to channels declared in `this.channels using
  // `document` as a context

  listenChannels: function() {
    Essential.Core.mapEvents.call(this, this.channels, document);
  },

  // Emit
  // ----
  //
  // Facilitates the emission of custom events through the CustomEvent
  // Interface. IE9 and IE10 are supported via polyfill
  //
  // since v0.5.0
  //
  // param dataset[`Object`] valid dataset values are:
  //
  //   - channel: [`String`] name (identifier) of the channel
  //
  //   - context: [`DOMElement`] DOM context in which the event is triggered,
  //      this parameter can be ommited. Default value is `document`
  //
  //   - bubles: [`Boolean`] defines if this event should bubble or not,
  //     defaults to true
  //
  //   - cancelable: [`Boolean`] indecates whether the event is cancelable,
  //     defaults to false
  //
  //   - data: [`Object`] data to be included in the `"detail"` key of the
  //      event can be accesed later via `event.detail`
  //      (check the CustomEvent spec for more info)

  emit: function(dataset) {
    dataset.context = dataset.context || this.el;
    dataset.data = dataset.data || {};
    dataset.bubbles = dataset.bubbles || true;
    dataset.cancelable = dataset.cancelable || false;

    var customEvent = new CustomEvent(dataset.channel, {
      "bubbles": dataset.bubbles,
      "cancelable": dataset.cancelable,
      "detail": dataset.data
    });

    dataset.context.dispatchEvent(customEvent);
  },

  priority: 0
});
// Map Events
// ----------
//
// since v0.5.0
//
// Given a document context, maps a hash of events to all ocurrences
// in the context using the DOM Event Interface
//
// param events[`Object`] key-value map which follows some conventions:
//
//   - key: must be a String, containing the event name. Optionally after the event
//     name a valid CSS selector must be placed, for example `"click #element"`
//
//   - value: must be a name of a funciton pertaining to the current in which
//     `mapEvents` its executed
//
// param context[`DOMElement`] element to search through
//
// **Example**
// ```javascript
// var events = {
//   "click .next": "goToNextSlide"
// };
//
// Essential.Core.mapEvents(events, document);
// ```

Essential.Core.mapEvents = function(events, context) {
  if(typeof events === "undefined") {
    return;
  }

  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  for(var key in events) {
    var method = events[key];

    var match = key.match(delegateEventSplitter);
    var eventName = match[1],
      selector = match[2],
      nodeList = selector ? context.querySelectorAll(selector) : [context];

    if(typeof this[method] === "undefined") {
      continue;
    }

    Essential.Core.bind(eventName, nodeList, this[method].bind(this));
  }
};
// Bind
// ----
//
// Binds an event to a node
//
// Param eventName[`String`] name of the event to be binded
//
// Param callback[`Function`] function to be called when the event is triggered
//
// Param nodeList[`NodeList`, `Array`] node elements to be binded
//
// **Example**
//
// ```javascript
// var nodeList = document.querySelectorAll("*");
//
// Essential.Core.bind("hover", nodeList, function() {
//   alert("hover!");
// });
//
// // If the hover event is triggered for any of the
// // elements in the nodeList the alert will appear
// ```

Essential.Core.bind = function(eventName, nodeList, callback) {
  var i = -1;

  while(nodeList[++i]) {
    var currentElement = nodeList[i];

    if(currentElement.addEventListener) {
      nodeList[i].addEventListener(eventName, callback);
    } else {
      currentElement.attachEvent("on" + eventName, callback);
    }
  }
};
// RegExp Helpers
// --------------

// Looks for some of this characters `:` `-` `_` the objetive is allow
// to define behaviors like `cool:carousel` or `small-carousel`

Essential.Core.SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;

// Finds the first letter of a given string

Essential.Core.FIRST_LETTER_REGEXP = /^[a-z]/g;

// Camelize
// --------
//
// Converts strings to UpperCamelCase
//
// Param name[`String`] the name to be camelized
//
// Returns `String` camel case representation of the name
//
// **Example**
//
// ```javascript
// Essential.Core.camelize("cool-carousel");
//
// // => CoolCarousel
// ```

Essential.Core.camelize = function(name) {
  return name.
  replace(Essential.Core.FIRST_LETTER_REGEXP, function(letter) {
    return letter.toUpperCase();
  }).
  replace(Essential.Core.SPECIAL_CHARS_REGEXP, function(_, separator, letter) {
    return letter.toUpperCase();
  });
};
// Crawl
//------
//
// Scans the DOM looking for behaviors
//
// Return `Array<Object>` an array of objects with the behavior name as
// a key and an array of DOM nodes as a value
//
// **Example**
//
// ```html
// <div behavior="carousel"></div>
// ```
//
// ```javascript
// Essential.Core.crawl();
//
// // => [{ carousel: [<HTMLDivElement>, <HTMLDivElement>] }]
// ```

Essential.Core.crawl = function(rootElement) {
  var all = rootElement.querySelectorAll("[data-behavior], [behavior]"),
    i = -1,
    result = {};

  while(all[++i]) {
    var currentElement = all[i],
      rawBehaviors = currentElement.getAttribute("data-behavior") || currentElement.getAttribute("behavior"),
      behaviorsList = rawBehaviors.split(" "),
      j = -1;

    while(behaviorsList[++j]) {
      var currentBehavior = behaviorsList[j];

      if(result[currentBehavior]) {
        result[currentBehavior].push(currentElement);
      } else {
        result[currentBehavior] = [currentElement];
      }
    }
  }

  return result;
};
// Sort Methods
// ------------
//
// Namespace to hold sort methods

Essential.Core.SortMethods = {

  // By Priority
  // -----------
  //
  // This criteria allows to sort behaviors based on their respective priorities,
  // in descending order, that means behaviors with bigger priority will appear
  // first

  byPriority: function(behaviorA, behaviorB) {
    return behaviorB.priority - behaviorA.priority;
  }
};


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
    var imgSrc = data.OgAttrs["og:image"] ? this.resolveUrl(data.Url, data.OgAttrs["og:image"]) : "http://dummyimage.com/200x200/000000/fff.jpg&text=none";

    wrapper.className = "scrapped-page ten columns";
    wrapper.style.opacity = 0;

    // innerContent += '<a href="' + data.Url + '">' + data.Url + '</a>';
    innerContent += '<article class="scrapped-data">';
    innerContent += '<h3>' + data.Title + '</h3>';
    innerContent += '<p>' + data.Description + '</p>';

    innerContent += '<h4>OG Data</h4>';
    innerContent += '<ul class="og-list">';

    for (var attrIndex in data.OgAttrs) {
      if (attrIndex.indexOf("image") === -1) {
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
  },

  resolveUrl: function(baseUrl, url) {
    if (url.indexOf("/") == 0) {
      url = baseUrl + url;
    }

    return url;
  }
});

document.addEventListener('DOMContentLoaded', function() {
  Essential.loadBehaviors({
    application: Ogg.Behaviors,
    context: document
  });
});
