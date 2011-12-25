/**
 * Highcharts 2.1.9 Zepto adapter
 *
 * (c) 2010-2011 Slawek Kolodziej
 *
 * License: MIT
 */

// JSLint options:
/*global Fx, $, $extend, $each, $merge, Events, Event, DOMEvent */

(function () {

var win = window,
	doc = document,
//	mooVersion = win.MooTools.version.substring(0, 3), // Get the first three characters of the version number
//	legacy = mooVersion === '1.2' || mooVersion === '1.1', // 1.1 && 1.2 considered legacy, 1.3 is not.
//	legacyEvent = legacy || mooVersion === '1.3', // In versions 1.1 - 1.3 the event class is named Event, in newer versions it is named DOMEvent.
	extend = Zepto.extend || function () {
		return Object.append.apply(Object, arguments);
	},
	anim = function(el, prop, value) {
		var start = +new Date,
			duration = 1000,
			t;

		function step(time) {
			t = time-start;
			if( t < duration )
				requestAnimFrame(step);

			el.attr(prop, ~~(t*100 / duration) * value / 100 );
		}

		step(+new Date);
	};

win.requestAnimFrame = (function(){
	return  win.requestAnimationFrame ||
	win.webkitRequestAnimationFrame ||
	win.mozRequestAnimationFrame ||
	win.oRequestAnimationFrame ||
	win.msRequestAnimationFrame ||
	function( callback ){
		win.setTimeout(callback, 1000 / 60);
	};
})();

win.HighchartsAdapter = {
	/**
	 * Initialize the adapter. This is run once as Highcharts is first run.
	 * @param {Object} pathAnim The helper object to do animations across adapters.
	 */
	init: function (pathAnim) {
		this.pathAnim = pathAnim;
	},

	/**
	 * Utility for iterating over an array. Parameters are reversed compared to jQuery.
	 * @param {Array} arr
	 * @param {Function} fn
	 */
	each: function (arr, fn) {
		var i = 0,
			len = arr.length;
		for (; i < len; i++) {
			if (fn.call(arr[i], arr[i], i, arr) === false) {
				return i;
			}
		}
	},

	/**
	 * Filter an array
	 */
	grep: Array.prototype.filter,

	/**
	 * Map an array
	 * @param {Array} arr
	 * @param {Function} fn
	 */
	map: function (arr, fn) {
		var results = [],
			i = 0,
			len = arr.length;
		for (; i < len; i++) {
			results[i] = fn.call(arr[i], arr[i], i, arr);
		}
		return results;

	},

	/**
	 * Deep merge two objects and return a third object
	 */
	merge: function () { // the built-in prototype merge function doesn't do deep copy
		function doCopy(copy, original) {
			var value, key;

			for (key in original) {
				value = original[key];
				if (value && typeof value === 'object' && value.constructor !== Array &&
						typeof value.nodeType !== 'number') {
					copy[key] = doCopy(copy[key] || {}, value); // copy

				} else {
					copy[key] = original[key];
				}
			}
			return copy;
		}

		function merge() {
			var args = arguments,
				i,
				retVal = {};

			for (i = 0; i < args.length; i++) {
				retVal = doCopy(retVal, args[i]);

			}
			return retVal;
		}

		return merge.apply(this, arguments);
	},

		// var args = arguments;
		// return jQuery.extend(true, null, args[0], args[1], args[2], args[3]);

	/**
	 * Add an event listener
	 * @param {Object} el A HTML element or custom object
	 * @param {String} event The event type
	 * @param {Function} fn The event handler
	 */
	addEvent: function (el, event, fn) {
		if (el.addEventListener) {
			el = $(el);
		}
		else {
			HighchartsAdapter._extend(el);
		}

		el.bind(event, fn);
	},

	/**
	 * Remove event added with addEvent
	 * @param {Object} el The object
	 * @param {String} eventType The event type. Leave blank to remove all events.
	 * @param {Function} handler The function to remove
	 */
	removeEvent: function (el, eventType, handler) {
		if (el.removeEventListener)
			el = $(el);

		el.unbind && el.unbind(eventType, handler);
	},

	/**
	 * Fire an event on a custom object
	 * @param {Object} el
	 * @param {String} type
	 * @param {Object} eventArguments
	 * @param {Function} defaultFunction
	 */
	fireEvent: function (el, type, eventArguments, defaultFunction) {
		if (el.dispatchEvent) {
			el = $(el);
		}

		el.trigger && el.trigger(event, eventArguments || {});

		if (eventArguments && eventArguments.defaultPrevented) {
			defaultFunction = null;
		}
		if (defaultFunction) {
			defaultFunction(eventArguments);
		}
	},

	/**
	 * Animate a HTML element or SVG element wrapper
	 * @param {Object} el
	 * @param {Object} params
	 * @param {Object} options jQuery-like animation options: duration, easing, callback
	 */
	animate: function (el, params, options) {
		// var el = $(el.element);

		// default options
		// options = options || {};
		// options.delay = 0;
		// options.duration = (options.duration || 500) / 1000;

		for (key in params) {
			if (key !== 'd')
				el.attr(key, params[key]);
				// anim(el, key, params[key]);
			// else
		}



		// $el.stop();
		// if(!params.d) {
			// el.animate(params, options)
		// }
	},

	/**
	 * Stop running animation
	 */
	stop: function (el) {
		// $(el).stop();
	},

	/*
	 * Extend an object to handle highchart events (highchart objects, not svg elements).
	 */
	_extend: function(object){
		if (!object._highcharts_extended) {
			extend(object, {
				// based on backbone.js
				bind: function(e, callback, context) {
					var calls = this._highcharts_callbacks,
						list  = calls[e] || (calls[e] = []);
					list.push([calls, context]);
					return this;
				},
				unbind: function(e, callback) {
					var calls;
					if (!e) {
						this._highcharts_callbacks = {};

					} else if (calls = this._highcharts_callbacks) {
						if (!callback) {
							calls[ev] = [];

						} else {
							var list = calls[ev];
							if (!list) return this;
							for (var i = 0, l = list.length; i < l; i++) {
								if (list[i] && callback === list[i][0]) {
									list[i] = null;
									break;
								}
							}
						}
					}
					return this;
				},
				trigger: function(eventName) {
					var list, calls, ev, callback, args;
					var both = 2;
					if (!(calls = this._highcharts_callbacks))
						return this;

					while (both--) {
						ev = both ? eventName : 'all';
						if (list = calls[ev]) {
							for (var i = 0, l = list.length; i < l; i++) {
								if (!(callback = list[i])) {
									list.splice(i, 1); i--; l--;
								} else {
									args = both ? Array.prototype.slice.call(arguments, 1) : arguments;
									callback[0].apply(callback[1] || this, args);
								}
							}
						}
					}
					return this;
				},
				_highcharts_extended: true,
				_highcharts_callbacks: {}
			});
		}
		return object
	}
}

}());
