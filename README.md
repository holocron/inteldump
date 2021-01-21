# inteldump
this is a plugin for [iitc](https://github.com/iitc-project/ingress-intel-total-conversion). it allows you to scrape data for all ingress portals within the viewport. this portal data can then be downloaded as a json file or viewed in-browser.

## usage
- install [iitc](https://github.com/iitc-project/ingress-intel-total-conversion).
- install [inteldump.user.js](https://github.com/superloach/inteldump/raw/ichiji/inteldump.user.js).
- navigate to the [ingress intel map](https://www.ingress.com/intel).
- you will see a new toolbox added to the iitc sidebar. once your zoom level is set to 15 (displayed in the plugin) you can start the scraper. the zoom restriction is required as lower zoom levels don't return the full set of data for portals, only their coordinates.
- the scraper will not download any portal data until the current map view has finished loading.
- once map data has loaded and the viewport has been scraped, a green rectangle is drawn over the viewport boundaries on the map. this makes it easier to pan around and capture large areas (due to the zoom restriction) while keeping track of what has already been captured.

## contribution
pull requests and issues are welcome.

## credit
- iitc maxfields exporter - https://github.com/itayo/IITC-Ingress-Maxfields-Exporter
- iitc ingress portal csv export - https://github.com/Zetaphor/IITC-Ingress-Portal-CSV-Export

## disclaimer
i am in no way affiliated with niantic, nintendo, or gamefreak.
