# wmch-interactive-maps

A configurable backend to generate and show interactive maps on top of Wikidata.

Read [installation instructions](INSTALL.md).

## Service 1/3: app

The webservice app exposes the website locally on the specified port using [Express](https://expressjs.com/).

`node app.js`

15 Mar 10:46:25 - WMCH Interactive maps listening at http://:::8080

`node app.js --port 9030`

15 Mar 10:46:31 - WMCH Interactive maps listening at http://:::9030

Enable verbose logging with debug mode:

`DEBUG=1 node app.js --port 9030`

or set DEBUG=1 as environment variable elsewhere (DEBUG=2 for trace, DEBUG=0 or not set for production).

You can set all the environment variables on `.env` file.

## Service 2/3: screenshot

The screenshot server is used to take a screenshot of the map just before a map is saved to the database.

Port and url are specified on config.json.

`node screenshot.js`

Both the app.js and screenshot.js must be running at the same time.

## Service 3/3: cron

The cron service will periodically save the results from Wikidata queries of available maps.

`node cron.js`

 These snapshots will be displayed on a [timeline](http://apps.socib.es/Leaflet.TimeDimension/examples/).

### Change schedule

Change localconfig.json as you need adding these parameters:

- cronTime: when to execute in `seconds minutes hours ...` cron format. E.g. use `*/30` as second cron parameter to run scheduled snapshot every 30 minutes.
- msCronWaitWikidata: milliseconds to wait between each save to History. Used to avoid ban from Wikidata servers.
- historyTimelineLimit: how many History records will be displayed on the timeline? 0 = disable History and show only current result, without time slider.
- historyOnlyDiff: save on database all snapshots, but display snapshots on timeline only if data are changed from the previous snapshot

Examples how to set these values are on `localconfig.example.json`.

## Languages

The website will auto-detect the user language based on browser settings.

To force a particular language in the format using the url use the `l` parameter:

- http://localhost:9030/wizard/?l=it
- http://localhost:9030/wizard/?l=it-CH

You can [contribute](CONTRIBUTE.md) to translate messages in your language.

## Paths

On development or locally, the main paths are:

- Frontend: http://localhost:9030/
- Manage contents: http://localhost:9030/admin/
- Add new map: (backend and user manual): http://localhost:9030/wizard/

If the edit must be limited, `/admin` and `/wizard` paths can be protected via webserver.

## External resources

External libraries are loaded via Wikimedia CDN where availables:

- [https://tools.wmflabs.org/cdnjs/](https://tools.wmflabs.org/cdnjs/)

External fonts are loaded via:

- [https://tools.wmflabs.org/fontcdn/](https://tools.wmflabs.org/fontcdn/)

## Command line utilities

See [SCRIPT.md](SCRIPT.md).

## User manual

User manual in multiple languages is loaded on [i18n_man/index](i18n_man/index)

The user manual is available inside the app along the screenshots at the `/wizard/man/index` path.
