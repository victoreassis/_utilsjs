(function(win, doc){
  'use strict';
  /* Array */
  Array.prototype.indexOf || (Array.prototype.indexOf = function(searchValue, index){//fix IE indexOf
    var len = this.length >>> 0;
    index |= 0;
    if (index < 0)
      index = Math.max(len - index, 0);
    else if (index >= len)
      return -1;

    if (searchValue === undefined)
      do {
        if (index in this && this[index] === undefined)
          return index;
      } while (++index !== len)
    else
      do {
        if (this[index] === searchValue)
          return index;
      } while (++index !== len)

    return -1;
  });
  Array.prototype.forEach || (Array.prototype.forEach = function(fn, scope) {
    for(var i = 0, len = this.length; i < len; ++i) {
      fn.call(scope, this[i], i, this);
    }
  });
  Array.prototype._uRemove = function(index){
    this.splice(index, 1);
  }

  /* Number*/
  Number.prototype._uPad = function(width, z) {
    width = width || 2;
    z = z || '0';
    var n = this + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  /* String */
  String.prototype._uIsEmpty = String.prototype.isEmpty = function() {
    return (this.length === 0 || !this.trim());
  };
  String.prototype._uReplaceAt = String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
  }

  /* NodeList */
  NodeList.prototype._uContains = function(text){
    return Array.prototype.filter.call(this, function(element){
      return RegExp(text).test(element.textContent)
    });
  }

  win._utils = {
    isUndefined : function(value){
      return value === undefined;
    },
    isString : function(value){
      return typeof value === 'string'
    },
    isBoolean : function(value){
      return typeof(value) == typeof(true);
    },
    isNumeric : function (value) {
      return !isNaN(parseFloat(value)) && isFinite(value);
    },
    isInteger : function (value) {
      value = parseFloat(value);
      return !isNaN(value) && Math.floor(value) == value;
    },
    isFunction : function(value){
      return typeof value === 'function';
    },
    isArray : function(value){
      return value.constructor === Array
    },
    isObject : function(value) {
      return value === Object(value);
    },
    isEmpty : function() {
      for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] == null && arguments[i].isEmpty())
          return true;
      }
    },
    arrayIsEqual : function(a, b) {
      if (a === b) return true;
      if (a == null || b == null) return false;
      if (a.length != b.length) return false;

      // If you don't care about the order of the elements inside
      // the array, you should sort both arrays here.

      for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    },
    getScrollbarWidth : function(elem){
      if (elem !== undefined)
        return elem.offsetWidth-elem.clientWidth;
      return win.innerWidth-doc.documentElement.clientWidth;
    },
    fireEvent : function(element, type){
      if ("createEvent" in doc) {
        var evt = doc.createEvent("HTMLEvents");
        evt.initEvent(type, false, true);
        element.dispatchEvent(evt);
      }
      else
        element.fireEvent("onchange");
    },
    uniqid : function () {
      var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
      };
      return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    },
    getJson : function(string){
      return JSON.parse(string)
    },
    unset : function(object, keys){
      if (!_utils.isObject(object)) return;
      keys = keys.trim().split(" ");
      for (var i = 0; i < keys.length; i++){
        delete object[ keys[i] ];
      }
    },
    extract : function(object, keys){
      if (!_utils.isObject(object)) return;
      var extracted = {};
      keys = keys.trim().split(" ");
      for (var i = 0; i < keys.length; i++){
        extracted[ keys[i] ] = object[ keys[i] ];
      }
      return extracted;
    },
    mergeObject : function(source, properties){
      if (_utils.isArray(source)){
        source.forEach(function(s){
          _utils.mergeObject(s, properties);
        });
      }
      if (!_utils.isObject(source) && !_utils.isObject(properties)) return;
      var property;
      for (property in properties) {
        if (properties.hasOwnProperty(property)) {
          source[property] = properties[property];
        }
      }
      return source;
    },
    ajax : (function(){
        var onCallback = function(req, cb){
              if (!cb) return;
              req.onreadystatechange = function(){
                var res = req.responseText;
                try {
                  res = _utils.getJson(res);
                } catch (e) {}
                if(req.readyState == 4 && req.status == 200) {
                  if (cb.onSuccess && _utils.isFunction(cb.onSuccess))
                    cb.onSuccess(res);
                } else 
                if (req.readyState == 4 && [403,404,500,].indexOf(req.status) > -1) {
                  if (cb.onFail && _utils.isFunction(cb.onFail))
                    cb.onFail(req);
                }
              }
            },
            setHeader = function(request, headerOptions){
              var property;
              for (property in headerOptions){
                request.setRequestHeader(property, headerOptions[property]);
              }
            },
            handleCall = function (options){
              /*{
                  type : 'POST'
                  url : '',
                  data : {},
                  ajaxHeader: false,
                  csrf: '',
                  onSuccess: function(){},
                  onFail: function(){},
                  callbacks : {
                      onSuccess: function(){},
                      onFail: function(){},
                  }
              }*/
              var request = new XMLHttpRequest();

              var type = 'GET';
              if (options.type)
                type = options.type.toUpperCase();
              
              request.open(type, options.url, true);

              onCallback(request, options.callbacks ? options.callbacks : options );

              var headerOptions = {
                'Content-type': 'application/json',
                'X-CSRF-Token': _utils.params.getCsrf()
              };

              if (!options.removeAjaxHeader)
                _utils.mergeObject(headerOptions, {'X-Requested-With': 'XMLHttpRequest'});
              //setHeader(request, 'X-Requested-With', 'CordovaRequest');

              setHeader(request, headerOptions);

              if (options.data)
                request.send(JSON.stringify(options.data));
              else
                request.send();
            };

        return {
          req : function(options){
            handleCall(options);
          }
        }
    })(),
    base64: (function(){
      var _str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      return {
        encode: function(string){
          var t = "";
          var n, r, i, s, o, u, a;
          var f = 0;
          var e = this._utf8_encode(string);
          while(f < e.length){
            n = e.charCodeAt(f++);
            r = e.charCodeAt(f++);
            i = e.charCodeAt(f++);
            s = n >> 2;
            o = (n & 3)  << 4 | r >> 4;
            u = (r & 15) << 2 | i >> 6;
            a = i & 63;
            if(isNaN(r)){
              u = a = 64
            } else
            if(isNaN(i)){
              a = 64
            }
            t = t+_str.charAt(s)+_str.charAt(o)+_str.charAt(u)+_str.charAt(a)
          }
          return t
        },
        decode: function(string){
          var t = "";
          var n, r, i;
          var s, o, u, a;
          var f = 0;
          var e = string.replace(/[^A-Za-z0-9\+\/\=]/g,"");
          while(f < e.length){
            s =_str.indexOf(e.charAt(f++));
            o =_str.indexOf(e.charAt(f++));
            u =_str.indexOf(e.charAt(f++));
            a =_str.indexOf(e.charAt(f++));
            n = s << 2 | o >> 4;
            r = (o & 15) << 4 | u >> 2;
            i = (u & 3)  << 6 | a;
            t = t+String.fromCharCode(n);
            if(u != 64){
              t = t+String.fromCharCode(r)
            }
            if(a != 64){
              t = t+String.fromCharCode(i)
            }
          }
          t = this._utf8_decode(t);
          return t
        },
        _utf8_encode: function(e){
          e = e.replace(/\r\n/g,"\n");
          var t = "";
          for(var n = 0; n < e.length; n++){
            var r = e.charCodeAt(n);
            if(r<128){
              t += String.fromCharCode(r)
            } else
            if(r>127&&r<2048){
              t += String.fromCharCode(r >> 6| 192);
              t += String.fromCharCode(r & 63| 128)
            } else {
              t += String.fromCharCode(r >> 12 | 224);
              t += String.fromCharCode(r >> 6 & 63 | 128);
              t += String.fromCharCode(r & 63 | 128)
            }
          }
          return t
        },
        _utf8_decode: function(e){
          var t = "";
          var n = 0;
          var r = c1 = c2 = 0;
          while(n < e.length){
            r = e.charCodeAt(n);
            if(r < 128){
              t += String.fromCharCode(r);
              n++
            } else
            if(r > 191 && r < 224){
              c2 = e.charCodeAt(n+1);
              t += String.fromCharCode((r & 31) << 6 | c2 & 63);
              n += 2
            } else {
              c2 = e.charCodeAt(n+1);
              c3 = e.charCodeAt(n+2);
              t += String.fromCharCode((r & 15) << 12| (c2 & 63) << 6 | c3 & 63);
              n += 3
            }
          }
          return t
        }
      }
    })(),
    serializeObject : function(form) {
        if (!form || form.nodeName !== "FORM") {
          return;
        }
        var o = {},
            keys,
            parseKeys = function(value){
              var valueInt = parseInt(value);
              if (!isNaN(valueInt))//if (z_.isInt(value))
                return valueInt;
              return value;
            },
            parseElement = function(element, options){
              keys = element.name.replace(/]/g, '').split('[');
              keys = keys.map(parseKeys);
              if (options){
                [].slice.call(element.options).forEach(function(option){
                  if (option.selected){
                    deepSet(o, keys, option.value);
                  }
                });
              } else {
                deepSet(o, keys, element.value);
              }
            },
            deepSet = function (o, keys, value, opts) {
              var key, nextKey, tail, lastIdx, lastVal, f;
              if (opts == null) { opts = {}; }

              key = keys[0];

              // Only one key, then it's not a deepSet, just assign the value.
              if (keys.length === 1) {
                if (key === '') {
                  o.push(value); // '' is used to push values into the array (assume o is an array)
                } else {
                  o[key] = value; // other keys can be used as object keys or array indexes
                }
                // With more keys is a deepSet. Apply recursively.
              } else {
                nextKey = keys[1];

                // '' is used to push values into the array,
                // with nextKey, set the value into the same object, in object[nextKey].
                // Covers the case of ['', 'foo'] and ['', 'var'] to push the object {foo, var}, and the case of nested arrays.
                if (key === '') {
                  lastIdx = o.length - 1; // asume o is array
                  lastVal = o[lastIdx];
                  if (_utils.isObject(lastVal) && (_utils.isUndefined(lastVal[nextKey]) || keys.length > 2)){// if nextKey is not present in the last object element, or there are more keys to deep set
                    key = lastIdx; // then set the new value in the same object element
                  } else {
                    key = lastIdx + 1; // otherwise, point to set the next index in the array
                  }
                }

                // '' is used to push values into the array "array[]"
                if (nextKey === '') {
                  if (_utils.isUndefined(o[key]) || !_utils.isArray(o[key])){//if is undefined or not an array
                    o[key] = []; // define (or override) as array to push values
                  }
                } else {
                  //if (opts.useIntKeysAsArrayIndex && f.isValidArrayIndex(nextKey)) { // if 1, 2, 3 ... then use an array, where nextKey is the index
                  if (!isNaN(nextKey)){
                    if (_utils.isUndefined(o[key]) || !_utils.isArray(o[key]))//if is undefined or not an array
                      o[key] = []; // define (or override) as array, to insert values using int keys as array indexes
                  } else { // for anything else, use an object, where nextKey is going to be the attribute name
                    if (_utils.isUndefined(o[key]) || !_utils.isObject(o[key]))//if is undefined or not an object
                      o[key] = {};
                  }
                }

                // Recursively set the inner object
                tail = keys.slice(1);
                deepSet(o[key], tail, value, opts);
              }
            };
        [].slice.call(form.elements).forEach(function(element){
          if (element.name === "") return;
          switch (element.nodeName) {
            case 'INPUT':
              switch (element.type) {
                case 'text':
                case 'hidden':
                case 'password':
                case 'button':
                case 'reset':
                case 'submit':
                case 'tel':
                  parseElement(element);
                break;
                case 'number':
                  keys = element.name.replace(/]/g, '').split('[');
                  keys = keys.map(parseKeys);
                  deepSet(o, keys, element.value == '' ? 0 : parseFloat(element.value));
                break;
                case 'checkbox':
                case 'radio':
                  if (element.checked) {
                    parseElement(element);
                  }
                break;
                case 'file':
                break;
              }
            break;
            case 'TEXTAREA':
              parseElement(element);
            break;
            case 'SELECT':
              switch (element.type) {
                case 'select-one':
                  parseElement(element);
                break;
                case 'select-multiple':
                  parseElement(element, true);
                break;
              }
            break;
            case 'BUTTON':
              switch (element.type) {
                case 'reset':
                case 'submit':
                case 'button':
                  parseElement(element);
                break;
              }
            break;
          }
        });
        return o;
    },
    submitForm : function (form) {
      //get the form element's document to create the input control with
      //(this way will work across windows in IE8)
      //make sure it can't be seen/disrupts layout (even momentarily)
      //make it such that it will invoke submit if clicked
      //append it
      var button = form.ownerDocument._uMake('input', {type: 'submit'})._uCss('display', 'none')._uAppendTo(form);
      //click it
      button.click();
      //if it was prevented, make sure we don't get a build up of buttons
      button._uRemove();
    },
    /* DATE */
    //Source: https://stackoverflow.com/a/27947860
    getDaysInMonth : function (m, y) {
      return m===2 ? y & 3 || !(y%25) && y & 15 ? 28 : 29 : 30 + (m+(m>>3)&1);
    },
    /* URL */
    parseURLQuery: (function(){
      return {
        //Source: https://stackoverflow.com/a/8649003
        toObject: function(){
          var search = location.search.substring(1);
          if (search.length > 0)
            return JSON.parse('{"' + decodeURIComponent(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
          return null;
        },
        toString: function(object){
          var search = [];
          for (var property in object){
            search.push(property + '=' + encodeURIComponent(object[property]));
          }
          if (search.length > 0)
            return '?'+search.join('&');
          return '';
        }
      }
    })()
  };

  _utils.mergeObject(Document.prototype, {
    _uReady: function(fn){
      this._uOn('DOMContentLoaded', fn);
    },
    _uGetScroll: function(){
      return {
        x : (win.pageXOffset || doc.documentElement.scrollLeft || doc.body.scrollLeft || 0),
        y : (win.pageYOffset || doc.documentElement.scrollTop || doc.body.scrollTop || 0)
      };
    },
    _uScroll: function(value, pos){
      pos = 'Top';
      if (pos !== undefined && pos == 'x')
        pos = 'Left';
      doc.documentElement['scroll'+pos] = doc.body['scroll'+pos] = doc.body.parentNode['scroll'+pos] = value;
    },
    _uContains: function(selector, text){
      var ret = this._uGetAll(selector)._uContains(text);
      return ret.length == 0 ? null : (ret.length > 1 ? ret : ret[0]);
    },
    _uMake: function(tagName, properties){
      var elem = doc.createElement(tagName),
          property;

      for (property in properties){
        if (!_utils.isUndefined(elem[property])){
          if (tagName == 'input' && property == 'readOnly'){//fix for material select-dropdown
            elem._uOn('focus', function(){
              this.blur();
            });
          }
          elem[property] = properties[property];
        }
      }
      return elem;
    },
  });

  _utils.mergeObject(Element.prototype, {
    _uScroll: function(value, pos){
      pos = 'Top';
      if (pos !== undefined && pos == 'x')
        pos = 'Left';
      this['scroll'+pos] = value;
    },
    _uFirstChild : function(){
      return this.firstElementChild;
    },
    _uChild : function(index){
      return this.children[index];
    },
    _uParent : function(until){
      var node = this,
      parentElement = null;
      while(node=node.parentElement){
        if (until && until > 1){
          until--;
        } else {
          parentElement=node;
          break;
        }
      }
      return parentElement;
    },
    _uParentUntilClass: function(className){
      var node = this.parentElement,
      parentElement = null;
      for(;node;node=node.parentElement){
        if(node._uHasClass(className)){
          parentElement=node;
          break;
        }
      }
      return parentElement;
    },
    _uParentUntilTag: function(tagName){
      var node = this.parentElement,
          parentElement = null,
          tagName = tagName.toUpperCase();
      for(;node;node=node.parentElement){
        if(node.tagName == tagName){
          parentElement=node;
          break;
        }
      }
      return parentElement;
    },
    _uNext: function(until){
      var node = this,
      nextElement = null;
      while(node=node.nextSibling){
        if(node.nodeType===1){
          if (until && until > 1){
            until--;
          } else {
            nextElement=node;
            break;
          }
        }
      }
      return nextElement;
    },
    _uNextWithClass: function(className, count, or){
      var node = this,
      nextElement = null,
      between = 0;
      while(node=node.nextSibling){
        if(node.nodeType===1){
          if (node._uHasClass(className, or)){
            nextElement=node;
            break;
          }
          between++;
        }
      }
      if (count)
        return between;
      return nextElement;
    },
    _uCountNextWithEitherClass: function(className){
      return this._uNextWithClass(className, true, true);
    },
    _uCountNextWithClass: function(className){
      this._uNextWithClass(className, true);
    },
    _uPrevious: function(until){
      var node = this,
      previousElement = null;
      while(node=node.previousSibling){
        if(node.nodeType===1){
          if (until && until > 1){
            until--;
          } else {
            previousElement=node;
            break;
          }
        }
      }
      return previousElement;
    },
    _uPreviousWithClass: function(className, count, or){
      var node = this,
      nextElement = null,
      between = 0;
      while(node=node.previousSibling){
        if(node.nodeType===1){
          if (node._uHasClass(className, or)){
            nextElement=node;
            break;
          }
          between++;
        }
      }
      if (count)
        return between;
      return nextElement;
    },
    _uHtml: function(html){
      if (html || html === ''){
        if (typeof html === "string"){
          this.innerHTML = html;
          return this;
        } else
          return this.outerHTML;
      }
      return this.innerHTML;
    },
    _uText: function(text){
      if (text || text === ''){
        if (typeof text === 'string'){
          this.innerText = text;
          return this;
        } else
          return this.outerText;
      }
      return this.innerText;
    },
    _uAppend: function(child){
      if (typeof child === "string"){
        child = doc._uMake('div')._uReplace(child);
      }
      if (!_utils.isUndefined(child.push)){
        if (!_utils.isUndefined(child.length)){
          for(var i = 0; i < child.length; i++){
            this.appendChild(child[i]);
          }
          return child;
        }
      }
      return this.appendChild(child);
    },
    _uPrepend: function(value, text){
      if (typeof value === "string"){
        value = doc._uMake('div')._uReplace(value);
        if (typeof value.length !== "undefined"){
          var i = value.length;
          while(i--){
            this.insertBefore(value[i], this.children[0]);
          }
          return value;
        }
      }
      if (text)
        this.insertBefore(value, this.childNodes[0]);
      else
        this.insertBefore(value, this.children[0]);
      return value;
    },
    _uAppendTo: function(parent){
      return parent.appendChild(this);
    },
    _uInsertBefore: function(value){
      var parent = this.parentNode;
      
      if (_utils.isString(value))
        value = doc._uMake('div')._uReplace(value);

      if (parent)
        parent.insertBefore(value, this);
      else
        this.insertBefore(value, this);
      return value;
    },
    _uInsertAfter: function(value){
      var parent = this.parentNode;
      if (_utils.isString(value))
        value = doc._uMake('div')._uReplace(value);
      if (parent)
        this.parentNode.insertBefore(value, this.nextSibling);
      else
        this.insertBefore(value, this.nextSibling);
      return value;
    },
    _uReplace: function(value, until){
      var tmp = doc._uMake(value.indexOf('<td')!=-1?'tr':'div')._uHtml(value);
      if (typeof value === "string"){//html replace
        if (until){//remove close elements
          if (until > 0){
            until--;
            while (until--){
              this._uNext()._uRemove();
            }
          } else {
            until++;
            while (until++){
              this._uPrevious()._uRemove();
            }
          }
          value = tmp.children[0];
        } else {
          var elm, last;
          last = this;
          value = [];
          for(;(elm = tmp.children[0]);){
            value.push(last._uInsertAfter(elm));
            last = elm;
          }
          this._uRemove();
          return value.length == 1 ? value[0] : value;
        }
      }
      this.parentNode.replaceChild(value, this);
      return value;
    },
    _uRemove: function() {
      var parent = this._uParent();
      if (parent)
        parent.removeChild(this);
    },
    _uHasClass: function(className, or){
      className = className.trim();
      var _ = false;
      className = className.split(" ");
      if (this.classList){
        for (var i = 0; i < className.length; i++){
          _ = this.classList.contains( className[i] );
          if (_ && or) break;
        }
      } else {
        var classList = this.className.trim().split(" ");
        for (var i = 0; i < className.length; i++){
          _ = classList.indexOf( className[i] ) >= 0;
          if (_ && or) break;
        }
      }
      return _;
    },
    _uHasEitherClass: function(className){
      return this._uHasClass(className, true);
    },
    _uAddClass: function(className){
      className = className.trim();
      if (className != ""){
        className = className.split(" ");

        if (this.classList){
          for (var i = 0; i < className.length; i++){
            this.classList.add( className[i] );
          }
        } else {
          var classList = this.className.trim().split(" ");
          for (var i = 0; i < className.length; i++){
            if (classList.indexOf( className[i] ) == -1)
              this.className += " " + className[i];
          }
        }
      }
      return this;
    },
    _uDropClass: function(className){
      className = className.trim();
      if (className != ""){
        className = className.split(" ");

        if (this.classList){
          for (var i = 0; i < className.length; i++){
            this.classList.remove( className[i] );
          }
        } else {
          var classList, index;
          classList = this.className.split(" ");
          for (var i = 0; i < className.length; i++){
            index = classList.indexOf( className[i] );
            if (index >= 0)
              classList.splice(index, 1);
          }
          this.className = classList.join(" ");
        }
      }

      return this;
    },
    _uReplaceClass: function(oldClassName, newClassName){
      this._uDropClass(oldClassName)._uAddClass(newClassName);
      return this;
    },
    _uToggleClass: function(className, conditions){
      if (conditions == undefined || conditions){
        if (this._uHasClass(className))
          this._uDropClass(className);
        else
          this._uAddClass(className);
      }
      return this;
    },
    _uCss: function(styles, value){
      if (typeof styles === "string"){
        if (value || value == '')
          this.style[styles] = value;
        else
          return this.style[styles]

        return this;
      }
      var property;
      for (property in styles) {
        if (!_utils.isUndefined(this.style[property])) {
          this.style[property] = styles[property];
        }
      }
      return this;
    },
    _uAttr: function(properties){
      var elem = this;

      for (var property in properties){
        if (!_utils.isUndefined(elem[property])){
          if (elem._uIs('input') && property == 'readOnly'){//fix for material select-dropdown
            elem._uOn('focus', function(){
              if (elem.readOnly)
                elem.blur();
            });
          }
          elem[property] = properties[property];
        }
      }
      return elem;
    },
    _uShow: function(display){
      return this._uCss('display', display || 'block');
    },
    _uHide: function(){
      return this._uCss('display', 'none');
    },
    _uIsHidden: function(){
      return this.currentStyle && this.currentStyle.display == 'none' || getComputedStyle && getComputedStyle(this).display == 'none' || this.style.display == 'none';
    },
    _uData: function(name, value){
      if (name && !_utils.isUndefined(value)){
        if (this.dataset)
          this.dataset[name] = value;
        else
          this.setAttribute('data-'+name, value);

        return this;
      }
      if (this.dataset)
        return this.dataset[name];

      return this.getAttribute('data-'+name);
    },
    _uValue: function(value){
      if (_utils.isString(value)){
        this.value = value;
        return this;
      }
      return this.value;
    },
    _uToggleChecked: function(value, click){
      if (this.checked && click){
        this.click();
      }
      this.checked = value || false;
    },
    _uSelectedIndex: function(index){
      if (this._uIs('select') && index !== undefined){
        this.selectedIndex = index;
      } else {
        return this.selectedIndex;
      }
      return this;
    },
    _uCoords: function (){
      var box, body, html, scroll = {}, client = {}, top, left;
      box = this.getBoundingClientRect();

      body = doc.body;
      html = doc.documentElement;

      scroll.top = window.pageYOffset || html.scrollTop || body.scrollTop;
      scroll.left = window.pageXOffset || html.scrollLeft || body.scrollLeft;

      client.top = html.clientTop || body.clientTop || 0;
      client.left = html.clientLeft || body.clientLeft || 0;

      top  = box.top +  scroll.top - client.top;
      left = box.left + scroll.left - client.left;

      return { top: Math.round(top), left: Math.round(left) };
    },
    _uGetIndex: function(){
      var index = 0;
      var node = this;
      while(node=node.previousSibling){
        if(node.nodeType!=3 || !/^\s*$/.test(node.data)){
          index++;
        }
      }
      return index;
    },
    _uGetStyles: function(){
      return getComputedStyle && getComputedStyle(this);
    },
    _uIs: function(nodeName){
      return this.nodeName == nodeName.toUpperCase();
    },
    _uAfterTransition: function(callback){
      var element = this;
      if (callback && _utils.isFunction(callback)){
        if (_utils.transitionIsSupported){
          element._uOn('transitionend', callback.bind(element), false);
        } else {
          setTimeout(callback.bind(element), +element._uGetStyles().transitionDuration.replace('s', '')*1000);
        }
      }
    }
  });

  _utils.mergeObject([Window.prototype, Document.prototype, Element.prototype], {
    _uOn: function(type, fn){
      type = type.trim();
      if (type != ""){
        type = type.split(" ");

        for (var i = 0; i < type.length; i++){
          this.addEventListener(type[i], fn);
        }
      }
      return this;
    },
    _uOff: function(type, fn){
      type = type.trim();
      if (type != ""){
        type = type.split(" ");

        for (var i = 0; i < type.length; i++){
          this.removeEventListener(type[i], fn);
        }
      }
      return this;
    }
  });

  _utils.mergeObject([Document.prototype, Element.prototype], {
    _uGet: function(selector){
      selector = selector.trim();
      var regex = /#|\.| |\[|:|\(|,|>|~|\+/;
      if (selector.indexOf('#') == 0){
        if (!regex.test(selector.substr(1))){
          return document.getElementById(selector.substr(1));
        }
      }
      //regex = /#|\.| |\[|:|\(|,/;
      if (selector.indexOf('.') == 0){
        if (!regex.test(selector.substr(1)))
          return this.getElementsByClassName(selector.substr(1))[0];
      }
      if (selector.indexOf('.') == -1 && selector.indexOf('#') == -1){
        if (!regex.test(selector))
          return this.getElementsByTagName(selector)[0];
      }
      return this.querySelector(selector);
    },
    _uGetAll: function(selector){
      selector = selector.trim();
      var regex = /#|\.| |\[|:|\(|,|>|~|\+/;
      if (selector.indexOf('.') == -1 && selector.indexOf('#') == -1){
        if (!regex.test(selector))
          return this.getElementsByTagName(selector);
      }
      if (selector.indexOf('.') == 0){
        if (!regex.test(selector.substr(1)))
          return this.getElementsByClassName(selector.substr(1));
      }
      return this.querySelectorAll(selector);
    }
  });

  _utils.mergeObject([DocumentFragment.prototype], {
    _uAppend: function(child){
      if (typeof child === "string"){
        child = doc._uMake('div')._uReplace(child);
      }
      if (!_utils.isUndefined(child.push)){
        if (!_utils.isUndefined(child.length)){
          for(var i = 0; i < child.length; i++){
            this.appendChild(child[i]);
          }
          return child;
        }
      }
      return this.appendChild(child);
    },
    _uAppendTo: function(parent){
      return parent.appendChild(this);
    },
  });

  _utils.mergeObject([NodeList.prototype, HTMLCollection.prototype], {
    forEach: function (callback, thisArg) {
      thisArg = thisArg || window;
      for (var i = 0; i < this.length; i++) {
        callback.call(thisArg, this[i], i, this);
      }
    },
    _uOn: function(type, fn){
      [].slice.call(this).forEach(function(el){
        el._uOn(type, fn);
      });
      return this;
    }
  })

  _utils.mergeObject(_utils, {
    transitionIsSupported : (function(){
      var style = doc._uMake('div').style;
      return 'transition' in style ||
          'WebkitTransition' in style ||
          'MozTransition' in style ||
          'msTransition' in style ||
          'OTransition' in style;
    })(),
    inputEvent : (function(){
        return 'oninput' in doc._uMake('div') ? 'input' : 'keyup';
    })(),
    scrolling : (function(){
      var docEl = doc.documentElement;
      /* Get Document Scroll Width*/
      var auxEl = doc._uMake('div')._uCss({
        overflow: 'scroll',
        position: 'absolute',
        top: '-9999px'
      })._uAppendTo(doc.body);
      var scrollWidth = auxEl.offsetWidth+'px';
      auxEl._uRemove();

      return {
        block: function(){
          if (docEl.clientHeight < docEl.offsetHeight)
            docEl._uCss('padding-right', scrollWidth);
          return docEl._uAddClass('no-scroll');
        },
        free: function(){
          return docEl._uDropClass('no-scroll')._uCss('padding-right', '');//._uCss('top', '');
        }
      }
    })(),
    rem : (function(){
      var temp = doc._uMake('div')._uCss('height', '1rem')._uAppendTo(doc.body),
      rem = +temp._uGetStyles().height.replace('px', '');
      temp.remove();
      return rem;
    })()
  })

  win._uOn('scroll', function(){
    _utils.documentScroll = (win.pageYOffset || doc.documentElement.scrollTop || doc.body.scrollTop || 0);
  });