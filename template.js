/*
  Template Version 1.3.33
  MIT License
  by Sean MacIsaac

  Changelog:
  1.1.0  :  Added nesting of the [data-template] element inside templates

  1.1.1  :  Cleaning up template().init() function, moved template().getData()
            to become getData()

  1.1.11 :  Regex fix for when [key]: [value] is passed to a nested template
            call, it would cause
            the regex to gobble up the next line if the [value] was "empty"

  1.2.0  :  Template now passes an object containing 'this' which references
            the string that is being manipulated. It no longer passes a jQuery
            object.

  1.2.2  :  Added iterator to get();

  1.2.3  :  Fixed bug where get() would return an array of jQuery objects with
            empty strings

  1.2.7  :  Changed storage format to a JSON string

  1.2.8  :  Added {%each "iterator" "template"%}

  1.2.9  :  Fixed empty string parsed to JSON causing error

  1.3.0  :  $.trim(s) on fill to remove any unecessary white space

  1.3.1  :  Added '{{oddOrEven}}' for arrays and '{{position}}'

  1.3.2  :  Added '{{variable.transform}}' dot transform

  1.3.3  :  Added template('template-name').fill(object)

  1.3.4  :  Fixed fill() error when object was undefined

  1.3.5  :  Added template('context').load(files,callback);

  1.3.6  :  Cleaned up initiation

  1.3.7  :  template_fn now returns "string" as a property of "options"

  1.3.8  :  <div template="name"></div> now accepts html which will return an
            object named '$'

  1.3.9  :  Refactored the code to be cleaner and removed some redundancy temp-
            lates are whitespace active now, so:

            template-name
              <div></div>

  1.3.10 :  Refactored to use $.get() instead of load to fetch the template
            string. $('<div>') was creating an element on the page causing
            an error when images were being loaded that didn't exist yet.

  1.3.11 :  Template name is now delimited by white-space, eg:

            template-name <div class="something"></div>
            or
            template-name
              <div class="something"></div>

            Added {{self}} variable which will return the name of the template

            Added {{variable-name.toUpperCase}}

            Added {{parent}} to {%each %}

            Removed need to return string for template.fn['template-name']

            {%each %} is now white space active :each 'iterator' 'template-name'

            Fixed bug where each would only work once per template

            Added {{variable.toTitleCase}}

            :each is back to {%each%}

  1.3.12 :  {{variable.toTitleCase}} supports exclusion words, such as 'and, b-
            ut' etc... and also handles compound words

            Fixed fill not accepting variables with '-' or '_'

            Properties now accept '_' and '-'

            Properties can now be chained

            template.bind('template-name') will return either a jQuery element
            or an array or object

  1.3.13 :  The object is now inside the attribute string.
            element content defaults to {{}}, so you can now have templated st-
            rings with html content.

  1.3.14 :  Data and HTML can share the same content area

  1.3.18 :  Fixed bug with HTML and OBJ sharing the same space.

  1.3.19 :  Process will now work if the first element in the template is a re-
            ference to another template

            Fixed JSON not being removed from the string if there was other te-
            xt inside the match

  1.3.20 :  Fixed double dipping bug

  1.3.21 :  Refactored the loop
            Fixed template.data returning child data

  1.3.22 :  Added '%total' to augment
            Renamed augmented variables so they are protected

  1.3.23 :  Added comments

  1.3.24 :  Can now point to an object stored in the database
            Options are now stored in the dom object

  1.3.25 :  Can now use template.key.keyName to perform operations on specific
            key names

  1.3.26 :  Fixed data pointer not working unless the element had JSON

  1.3.27 :  Bug in digit group

  1.3.28 :  Added math and ability to process strings and template names

  1.3.30 :  template.fill now accepts <div template=""></div> tags, moved all
            properties and extends into their own respective files

  1.3.31 :  Fixed while loop for nest() which was caused by not replacing the
            string value with 'empty' once the nest was scoped

  1.3.32 :  Added error for when a template which does not exist is referenced

  1.3.33 :  Added template.process which will look for an execute functions after
            template.fn has executed

  1.3.34 :  Added a default ID which is created with a unique index
  
  1.3.5  :  Unified data conversion, and made a globally accessible function 
            called template.getData(string|template.name);

*/

var template = {
    store:   {},
    fn:      {},
    prop:    {},
    process: {},
    key:     {},
    ext:     {}
};

template.isJs = function (string) {
  // Check if object
  var isObject = /^\{(\s+|)\"/.test($.trim(string));
  var isArray  = /^\[(\s+|)\"/.test($.trim(string));
  var is       = false;
  if (isObject) {
    is = true;
  } else if (isArray) {
    is = true;
  }
  return is;
};

template.augment = function (i,options,length) {
  // Odd or Even
  if (i%2) {
    options['%oddOrEven'] = 'even';
  } else {
    options['%oddOrEven'] = 'odd';
  }
  // Position
  if (i===0&&length===1) {
    options['%position'] = 'first-last';
  } else if (i===0) {
    options['%position'] = 'first';
  } else if (i>0&&i<length-1) {
    options['%position'] = 'member';
  } else {
    options['%position'] = 'last';
  }
  options['%index']      = i+1;
  options['%total']      = length;
  return options;
};

template.toJson = function (string) {
  if (template.isJs(string)) {
    return JSON.parse(string);
  } else {
    return {};
  }
};

template.getData = function (name) {
  function removeChildren(string) {
    var nest;
    // Remove HTML
    while (/<[a-zA-Z]+/.test(string)) {
      nest   = snippet.scope(string,['<[a-zA-Z]+(?:[\\s\\S]*?|)>'])[0];
      string = string.replace(nest,'');
    }
    // Remove HTML comments
    string = string.replace(/<!--[\s\S]*?-->/g,'');
    return $.trim(string);
  }
  function getInner() {
    var store = template.store[name];
    if (typeof store === 'string') {
      return store;
    } else {
      return name;
    }
  }
  function toData() {
    var inner      = getInner();
    var dataString = removeChildren(inner);
    var data       = template.toJson(dataString);
    data['']       = $.trim(inner.replace(dataString,''));
    return data;
  }
  return toData();
};

template.fill = function () {
  var arr = Array.prototype.slice.apply(arguments);
  var options;
  var name;
  for (var i = 0; i < arr.length; i++) {
    if (typeof arr[i] === 'object') {
      options = arr[i];
    } else if (typeof arr[i] === 'string') {
      name    = arr[i];
    }
  }
  options = $.extend(true,{},options);
  if (typeof template.store[name] === 'string') {
    options.string  = $.trim(template.store[name]);
    options.self    = name;
  } else if (/\{\{|\{\%/.test(name)) {
    options.string = name;
    options.self = 'template';
  } else {
    return false;
  }

  function templateFn() {
    if (typeof template.fn[options.self] === 'function') {
      template.fn[options.self](options);
    }
  }

  function templateProcess() {
    for (var k in template.process) {
      template.process[k](options);
    }
  }

  function keyFn(match) {
    if (typeof template.key[match] === 'function') {
      template.key[match](options);
    }
  }

  function replaceKey(match) {
    var name;
    if (/^\$/.test(match)) {
      name = match.match(/[a-zA-Z0-9\-\_]+/)[0];
      return template.fill(name);
    } else if (options.hasOwnProperty(match) && typeof options[match] !== 'undefined') {
      return options[match];
    } else {
      return '';
    }
  }

  function prop(val,transform) {
    var out = val;
    $.each(transform.split('.'),function (i,k) {
      if (typeof template.prop[k] === 'function') {
        out = template.prop[k](val);
      }
    });
    return out;
  }

  function fillKeys() {
    var val;
    options.string = options.string.replace(/\{\{([a-zA-Z0-9\-\_\%\$]+|)(?:\.|)([0-9a-zA-Z\_\-\.]+|)}}/g,function (n,match,transform) {
      // Replace variables with function variables if they exist
      keyFn(match);
      val = replaceKey(match);
      val = prop(val,transform);
      return val;
    });
  }

  function ext() {
    for (var k in template.ext) {
      options.string = template.ext[k](options.string,options,k);
    }
  }

  function nests() {
    while (/<div template="[a-zA-Z0-9\-\_]+">/.test(options.string)) {
      i++;
      var nested     = snippet.scope(options.string,['<div template="[a-zA-Z0-9\\-\\_]+">','</div>']);
      var inner      = nested[1];
      var name       = nested[0].match(/<div template="([a-zA-Z0-9\-\_]+)">/)[1];
      var data       = template.getData(inner);
      options.string = options.string.replace(nested[0],template.fill(name,data));
    }
  }

  templateFn();
  templateProcess();
  fillKeys();
  ext();
  nests();

  return options.string;
};

template.bind = function (name,options) {
  var fill = template.fill(name,options);
  function bind(el) {
    if (typeof dingo === 'object') {
      return dingo.bind(el);
    } else {
      return el;
    }
  }
  if (typeof fill === 'string') {
    if (fill.match(/<[a-zA-Z]+[\s\S]*?>/) !== null) {
      return bind($(fill));
    } else {
      return fill;
    }
  } else {
    return fill;
  }
};

template.loop = function (target,callback) {
  function getName(el) {
    if (typeof el === 'object') {
      var reg   = /(?:([a-zA-Z0-9\-\_]+)\-\>[a-zA-Z0-9\-\_\.]+|([a-zA-Z0-9\-\_]+))/;
      var match = el.attr('template').match(reg);
      if (typeof match[1] === 'string') {
        return match[1];
      } else {
        return match[2];
      }
    } else {
      return '[template]';
    }
  }

  function process(el) {
    var name  = getName(el);
    var data  = template.getData(el.html());
    var getEl = template.bind(name,data);
    if (getEl) {
      el.replaceWith(getEl);
      return getEl;
    } else {
      throw 'Template reference error: \'' + name + '\' does not exist';
    }
  }

  function loop(el) {
    if (typeof el == 'object') {
      el.each(function () {
        // is a template
        if (typeof $(this).attr('template') === 'string') {
          loop(process($(this)));
        } else {
          // has templates inside it
          $(this).find(getName()).each(function () {
            loop($(this));
          });
        }
      });
    }
  }

  if (target.length) {
    loop(target);
  }

  if (typeof callback === 'function') {
    callback(target);
  }
  //return target[0];
};

template.load = function (files,callback) {
  var string = '';
  function removeComments() {
    string = string.replace(/^\/\/[\s\S]*?$/gm,'');
  }
  function convertString() {
    var names  = string.match(/^[a-zA-Z0-9\-\_]+/gm);
    var groups = string.split(/^[a-zA-Z0-9\-\_]+\s/gm);
    var match;
    groups.splice(0,1);
    for (var i=0;i<names.length;i++) {
      names[i] = names[i].replace(/\n/,'');
    }
    $.each(names,function (i,k) {
      template.store[k] = $.trim(groups[i]);
    });
  }
  function load(files,i) {
    i = i||0;
    $.get(files[i],function (s) {
      i += 1;
      string += s + '\n';
      if (i < files.length) {
        load(files,i);
      } else {
        removeComments();
        convertString();
        if (typeof callback === 'function') {
          callback();
        }
      }
    });
  }
  load(files);
};

template.each = function (array,name) {
  var each = [];
  for (var i = 0; i < array.length; i++) {
    each.push(
      template.fill(
        name,
        template.augment(i,array[i],array.length)
      )
    );
  }
  return each.join('\n');
};

template.onload = function (fileArray,callback) {
  template.load(fileArray,function () {
    template.loop($('body'),callback);
  });
};
