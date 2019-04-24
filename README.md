# wmch-interactive-maps

A configurable backend to generate and show interactive maps on top of Wikidata.

## User manual

User manual in multiple languages is loaded on [i18n_man/index](https://github.com/synapta/wmch-interactive-maps/tree/master/i18n_man/index)

The user manual is available inside the app along the screenshots at the `/wizard/man/index` path.

## Node version

- Supported node version are 10 and 11 by now (for sharp dependency)

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

## Run

`node app.js`

15 Mar 10:46:25 - WMCH Interactive maps listening at http://:::8080

`node app.js --port 9089`

15 Mar 10:46:31 - WMCH Interactive maps listening at http://:::9089


### Run the screenshot server

The screenshot server is used to take a screenshot of the map just before a map is saved to the database.

Port and url are specified on config.json.

`node screenshot.js`

Both the app.js and screenshot.js must be running at the same time.

### Auto-update and keep running

To auto-update and keep running the node servers in development environment on changes, you can use:

`nodemon MYSERVERSCRIPT.js --port MYPORT`

In this case nodemon must be installed globally.

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

