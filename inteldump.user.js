// ==UserScript==
// @id inteldump@holocron
// @name IITC Plugin: inteldump
// @category Information
// @version 0.0.6
// @namespace https://github.com/holocron/inteldump
// @updateURL https://github.com/holocron/inteldump/raw/ichiji/inteldump.user.js
// @downloadURL https://github.com/holocron/inteldump/raw/ichiji/inteldump.user.js
// @description Exports portals to a JSON list
// @include https://intel.ingress.com/*
// @include http://intel.ingress.com/*
// @match https://intel.ingress.com/*
// @match http://intel.ingress.com/*
// @grant none
// ==/UserScript==
/*global $:false */
/*global map:false */
/*global L:false */

// by superloach
// see README.md for credit

function inteldumpWrapper() {
	// in case IITC is not available yet, define the base plugin object
	if (typeof window.plugin !== "function") {
		window.plugin = function() {};
	}

	// base context for plugin
	window.plugin.inteldump = function() {};
	var self = window.plugin.inteldump;

	self.portals = {};
	self.enabled = false;
	self.scraped = false;

	self.portalInScreen = function portalInScreen(p) {
		return map.getBounds().contains(p.getLatLng());
	};

	//  adapted from
	//+ Jonas Raoni Soares Silva
	//@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
	self.portalInPolygon = function portalInPolygon(polygon, portal) {
		var poly = polygon.getLatLngs();
		var pt = portal.getLatLng();
		var c = false;
		for (var i = -1, l = poly.length, j = l - 1; ++i < l; j = i) {
			((poly[i].lat <= pt.lat && pt.lat < poly[j].lat) || (poly[j].lat <= pt.lat && pt.lat < poly[i].lat)) && (pt.lng < (poly[j].lng - poly[i].lng) * (pt.lat - poly[i].lat) / (poly[j].lat - poly[i].lat) + poly[i].lng) && (c = !c);
		}
		return c;
	};

	// return if the portal is within the drawtool objects.
	// Polygon and circles are available, and circles are implemented
	// as round polygons.
	self.portalInForm = function(layer) {
		if (layer instanceof L.Rectangle) {
			return true;
		}
		if (layer instanceof L.Circle) {
			return true;
		}
		return false;
	};

	self.portalInGeo = function(layer) {
		if (layer instanceof L.GeodesicPolygon) {
			return true;
		}
		if (layer instanceof L.GeodesicCircle) {
			return true;
		}
		return false;
	};

	self.portalInDrawnItems = function(portal) {
		var c = false;

		window.plugin.drawTools.drawnItems.eachLayer(function(layer) {
			if (!(self.portalInForm(layer) || self.portalInGeo(layer))) {
				return false;
			}

			if (self.portalInPolygon(layer, portal)) {
				c = true;
			}
		});
		return c;
	};

	self.inBounds = function(portal) {
		if (window.plugin.drawTools && window.plugin.drawTools.drawnItems.getLayers().length) {
			return self.portalInDrawnItems(portal);
		} else {
			return self.portalInScreen(portal);
		}
	};

	self.updateTotalScrapedCount = function() {
		$('#totalScrapedPortals').html(Object.keys(self.portals).length);
	};

	self.drawRectangle = function() {
		var bounds = window.map.getBounds();
		bounds = [[bounds._southWest.lat, bounds._southWest.lng], [bounds._northEast.lat, bounds._northEast.lng]];
		L.rectangle(bounds, {color: "#00ff11", weight: 1, opacity: 0.9}).addTo(window.map);
	};

	self.managePortals = function managePortals(obj, portal, id) {
		if (self.inBounds(portal)) {
			var item = {
				'id': id,
				'name': portal.options.data.title || null,
				'image': portal.options.data.image || null,
				'lat': portal._latlng.lat,
				'lng': portal._latlng.lng,
				'time': portal.options.timestamp,
			};

			obj.list.push(item);
			obj.count += 1;

			self.portals[id] = item;
			self.updateTotalScrapedCount()
		}

		return obj;
	};

	self.checkPortals = function checkPortals(portals) {
		var obj = {
			list: [],
			count: 0
		};
		for (var x in portals) {
			if (typeof window.portals[x] !== "undefined") {
				self.managePortals(obj, window.portals[x], x);
			}
		}
		return obj;
	};

	self.generateJSON = function() {
		var arr = [];
		for (var e in self.portals) {
		    arr.push({
			Name: self.portals[e].name,
			Image: self.portals[e].image,
			Latitude: self.portals[e].lat,
			Longitude: self.portals[e].lng
		    });
		};
		return arr;
	};

	self.downloadJSON = function() {
		var jsonData = JSON.stringify(self.generateJSON());
		var link = document.createElement("a");
		link.download = 'inteldump.json';
		link.href = "data:application/json," + escape(jsonData);
		link.click();
	}

	self.showDialog = function showDialog(o) {
		var csvData = JSON.stringify(self.generateJSON());

		var data = `
		<form name='maxfield' action='#' method='post' target='_blank'>
			<div class="row">
				<div id='form_area' class="column" style="float:left;width:100%;box-sizing: border-box;padding-right: 5px;">
					<textarea class='form_area'
						name='portal_list_area'
						rows='30'
						placeholder='Zoom level must be 15 or higher for portal data to load'
						style="width: 100%; white-space: nowrap;">${csvData}</textarea>
				</div>
			</div>
		</form>
		`;

		var dia = window.dialog({
			title: "Portal JSON Export",
			html: data
		}).parent();
		$(".ui-dialog-buttonpane", dia).remove();
		dia.css("width", "600px").css("top", ($(window).height() - dia.height()) / 2).css("left", ($(window).width() - dia.width()) / 2);
		return dia;
	};

	self.gen = function gen() {
		var dialog = self.showDialog(self.portals);
		return dialog;
	};

	self.setZoomLevel = function() {
		window.map.setZoom(15);
		$('#currentZoomLevel').html('15');
		self.updateZoomStatus();
	};

	self.updateZoomStatus = function() {
		var zoomLevel = window.map.getZoom();
		$('#currentZoomLevel').html(window.map.getZoom());
		if (zoomLevel != 15) {
			self.scraped = false;
			$('#currentZoomLevel').css('color', 'red');
			if (self.enabled) $('#scraperStatus').html('Invalid Zoom Level').css('color', 'yellow');
		}
		else $('#currentZoomLevel').css('color', 'green');
	};

	self.updateTimer = function() {
		self.updateZoomStatus();
		if (self.enabled) {
			if (window.map.getZoom() == 15) {
				if ($('#innerstatus > span.map > span').html() === 'done') {
					if (!self.scraped) {
						self.checkPortals(window.portals);
						self.scraped = true;
						$('#scraperStatus').html('Running').css('color', 'green');
						self.drawRectangle();
					} else {
						$('#scraperStatus').html('Area Scraped').css('color', 'green');
					}
				} else {
					self.scraped = false;
					$('#scraperStatus').html('Waiting For Map Data').css('color', 'yellow');
				}
			}
		}
	};

	self.toggleStatus = function() {
		if (self.enabled) {
			self.enabled = false;
			$('#scraperStatus').html('Stopped').css('color', 'red');
			$('#startScraper').show();
			$('#stopScraper').hide();
			$('#csvControlsBox').hide();
			$('#totalPortals').hide();
		} else {
			self.enabled = true;
			$('#scraperStatus').html('Running').css('color', 'green');
			$('#startScraper').hide();
			$('#stopScraper').show();
			$('#csvControlsBox').show();
			$('#totalPortals').show();
			self.updateTotalScrapedCount();
		}

	};

	// setup function called by IITC
	self.setup = function init() {
		// add controls to toolbox
		var link = $("");
		$("#toolbox").append(link);

		var csvToolbox = `
		<div id="csvToolbox" style="position: relative;">
			<p style="margin: 5px 0 5px 0; text-align: center; font-weight: bold;">Portal CSV Exporter</p>
			<a id="startScraper" style="position: absolute; top: 0; left: 0; margin: 0 5px 0 5px;" onclick="window.plugin.inteldump.toggleStatus();" title="Start the portal data scraper">Start</a>
			<a id="stopScraper" style="position: absolute; top: 0; left: 0; display: none; margin: 0 5px 0 5px;" onclick="window.plugin.inteldump.toggleStatus();" title="Stop the portal data scraper">Stop</a>

			<div class="zoomControlsBox" style="margin-top: 5px; padding: 5px 0 5px 5px;">
				Current Zoom Level: <span id="currentZoomLevel">0</span>
				<a style="margin: 0 5px 0 5px;" onclick="window.plugin.inteldump.setZoomLevel();" title="Set zoom level to enable portal data download.">Set Zoom Level</a>
			</div>

			<p style="margin:0 0 0 5px;">Scraper Status: <span style="color: red;" id="scraperStatus">Stopped</span></p>
			<p id="totalPortals" style="display: none; margin:0 0 0 5px;">Total Portals Scraped: <span id="totalScrapedPortals">0</span></p>

			<div id="csvControlsBox" style="display: none; margin-top: 5px; padding: 5px 0 5px 5px; border-top: 1px solid #20A8B1;">
				<a style="margin: 0 5px 0 5px;" onclick="window.plugin.inteldump.gen();" title="View the JSON portal data.">View Data</a>
				<a style="margin: 0 5px 0 5px;" onclick="window.plugin.inteldump.downloadJSON();" title="Download the JSON portal data.">Download CSV</a>
			</div>
		</div>
		`;

		$(csvToolbox).insertAfter('#toolbox');

		window.csvUpdateTimer = window.setInterval(self.updateTimer, 500);

		// delete self to ensure init can't be run again
		delete self.init;
	};
	// IITC plugin setup
	if (window.iitcLoaded && typeof self.setup === "function") {
		self.setup();
	} else if (window.bootPlugins) {
		window.bootPlugins.push(self.setup);
	} else {
		window.bootPlugins = [self.setup];
	}
}
// inject plugin into page
var script = document.createElement("script");
script.appendChild(document.createTextNode("(" + inteldumpWrapper + ")();"));
(document.body || document.head || document.documentElement)
.appendChild(script);
