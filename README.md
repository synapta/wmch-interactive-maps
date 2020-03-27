# wmch-interactive-maps

A configurable backend to generate and show interactive maps on top of Wikidata.

## User manual

User manual in multiple languages is loaded on [i18n_man/index](https://github.com/synapta/wmch-interactive-maps/tree/master/i18n_man/index)

The user manual is available inside the app along the screenshots at the `/wizard/man/index` path.

## Node version

- Supported node version are 10 and 11 by now (for sharp dependency)

## System dependencies

To run screenshot server, these dependencies are needed (Debian-based):

`sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget`

Updated dependencies [for Debian-based Linux and other OS are here](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#chrome-headless-doesnt-launch-on-unix).

## Installation

Create `screenshots` and `local` directories:

`mkdir -p screenshots && mkdir -p local`

Screenshots directory will contains preview files for maps, local directory could contain the sqlite database and other development data.

### Add localconfig.json

***TL;DR: Copy localconfig.example.json to localconfig.json. Change data as needed.***

Local settings like database name and authentication data are available in the git ignored `localconfig.json` in the following formats.

On localconfig.json, set the url to the production url. It will be used to expose the path to the user, something like https://example.org/.

### config.js

A global base configuration file is available on `config.js`.

It contains available map styles based on sources listed on [Tile servers](https://wiki.openstreetmap.org/wiki/Tile_servers) page on OpenStreetMap.

### Set up database

Data can be saved by two different connectors, SQLite and MariaDB.

For multi-user installation, MariaDB is suggsted. SQLite is used primary for development.

#### SQLite
~~~
{
  "database": {
    "engine": "sqlite",
    "name": "local/testing.db"
  }
}
~~~

#### MariaDB

Create database and grant privileges like this:

~~~
CREATE DATABASE interactivemaps;
GRANT ALL PRIVILEGES ON interactivemaps.* TO mapuser@localhost IDENTIFIED BY "***PASSWORD_HERE***";
~~~

Add to localconfig.json:
~~~
{
  "database": {
    "engine": "mariadb",
    "name": "interactivemap",
    "username": "mapuser",
    "password": "***PASSWORD_HERE***",
    "port": 3306,
    "dialectOptions": {"connectTimeout": 1000}
  }
}

~~~

Port and dialectOptions can be omitted, getting the default values above.

[Reference for MariaDB](http://docs.sequelizejs.com/manual/usage.html#mariadb)

## Run a local tileserver

Run a tileserver in order to serve tiles to KeplerGL map.
We suggest to run [TileServerGL](https://github.com/maptiler/tileserver-gl) via Docker.

First download Switzerland **OpenStreetMap vector tiles** from [OpenMapTiles](https://openmaptiles.com/downloads/europe/switzerland/).

Then, from the directory with the downloaded tiles (`.mbtiles`) run:

`docker run --rm -it -v $(pwd):/data -p 9000:80 klokantech/tileserver-gl`

> IMPORTANT: run on port `9000`


More info [here](https://openmaptiles.org/docs/host/tileserver-gl/)

## Build the frontend
To build React-based components of the project (such as Kepler.gl) we use [Webpack](https://webpack.js.org/)
as module bundler and [Babel](https://babeljs.io/) as JavaScript transpiler to
ensure compatibility with older browsers.

`npm run build`


## Run the webservice

The webservice app exposes the website locally on the specified port using [Express](https://expressjs.com/).

`node app.js` or `npm start`

15 Mar 10:46:25 - WMCH Interactive maps listening at http://:::8080

`node app.js --port 9089` or `npm start -- --port=9089`

15 Mar 10:46:31 - WMCH Interactive maps listening at http://:::9089


### Run the screenshot server

The screenshot server is used to take a screenshot of the map just before a map is saved to the database.

Port and url are specified on config.json.

`node screenshot.js`

Both the app.js and screenshot.js must be running at the same time.

### Run the cron service

The cron service will periodically save the results from Wikidata queries of available maps.

`node cron.js`

 These snapshots will be displayed on a [timeline](http://apps.socib.es/Leaflet.TimeDimension/examples/).

#### Change schedule

Change localconfig.json as you need adding these parameters:

- cronTime: when to execute in `seconds minutes hours ...` cron format. E.g. use `*/30` as second cron parameter to run scheduled snapshot every 30 minutes.
- msCronWaitWikidata: milliseconds to wait between each save to History. Used to avoid ban from Wikidata servers.
- historyTimelineLimit: how many History records will be displayed on the timeline? 0 = disable History and show only current result, without time slider.
- historyOnlyDiff: save on database all snapshots, but display snapshots on timeline only if data are changed from the previous snapshot

Examples how to set these values are on `localconfig.example.json`.

### Auto-update and keep running

To auto-update and keep running the node servers in development environment on changes, you can use:

`nodemon MYSERVERSCRIPT.js --port MYPORT`

In this case nodemon must be installed globally.

On production, use something like [supervisor](http://supervisord.org/) with a script like this:

~~~
#!/bin/bash
cd /path/to/my/app;
exec node app.js --port 9089;
~~~

## Languages

The app supports multiple languages.

### Language negotiation

The website will auto-detect the user language based on browser settings.

To force a particular language in the format using the url use the `l` parameter:

- http://localhost:9089/wizard/?l=it
- http://localhost:9089/wizard/?l=it-CH

A dropdown to change language is provided on both backend and frontend.

### Translations

All translations are key-based and hosted in JSON file named after the [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) code under the i18n folder.

Directory structure is associated with the respective section.

~~~
i18n
|-- admin
|   |-- en.json
|   `-- it.json
|-- frontend
|   |-- en.json
|   `-- it.json
|-- manual
|   |-- en.json
|   `-- it.json
`-- wizard
    |-- en.json
    `-- it.json

~~~

To add a new translation:

1. Add a new ISO 639-1 file to each directory inside `i18n` copying a file like `en.json` and changing the keys.
2. Edit `config.json` and add a new language code, e.g. `{"code": "ja", "name": "日本語"}`

## Paths

On development or locally, the main paths are:

- Backend: http://localhost:9089/admin/
- Wizard (backend and user manual): http://localhost:9089/wizard/
- Frontend: http://localhost:9089/

If the edit must be limited, `/admin` and `/wizard` paths can be protected via webserver.

## External resources

External libraries are loaded via Wikimedia CDN where availables:

- [https://tools.wmflabs.org/cdnjs/](https://tools.wmflabs.org/cdnjs/)

External fonts are loaded via:

- [https://tools.wmflabs.org/fontcdn/](https://tools.wmflabs.org/fontcdn/)

## Special commands

### Maintenance scripts

If a relevant change to the code will affect all maps in the database, screenshots can be regenerated.

To regenerate all preview screenshots:

`node maintenance.js -P`

To test comparison between History of a specified map.id (e.g. 10):

`node maintenance.js -T 10`

To regenerate diff between History of a specified map.id (e.g. 10) e.g. when changing diff or json on History database:

`node maintenance.js -D 10`

both diff and json will be changed accordingly to diff between nearest siblings.

Help for all available commands:

`node maintenance.js --help`

### Generate a new icon list

Icon list can be selected between [those available on Semantic UI](https://semantic-ui.com/elements/icon.html) and saved on /public/js/icons.json.

However, list of icons can be generated visiting the Icon section of Semantic UI and using this code on browser console:

~~~
var src = jQuery(".main").find(".icon");
var myt = [];
jQuery.each(src, function (icoindex) {
    myt.push(jQuery(this).attr("class").replace(' icon', ''));
});
var uniquet = Array.from(new Set(myt.sort()));
var myels = [];
for (u of uniquet) {
  myels.push({
    title: u + '<i class="' + u + ' icon"></i>'
  });
}
JSON.stringify(myels, null, ' ');
~~~

Then expand and copy object to get a JSON array.

Semantic UI Icons are available on wizard searching by class name.

These steps are useful when the Semantic UI version is changed.
