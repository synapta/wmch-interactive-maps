# wmch-interactive-maps
A configurable backend to generate interactive maps on top of Wikidata.

## Settings

A base configuration file is available on `config.js`.

Local settings like database name and authentication data are available in the git ignored `localconfig.json` in the following formats.

TL;DR: Copy localconfig.example.json to localconfig.json

Create directories:

`mkdir -p screenshots && mkdir -p local`

### url

On localconfig.json, set the url to the production url. It will be used to:
- Get preview
- Expose the path to the user

It will be something like https://interactivemap.wikimedia.swiss/.

### Database

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

## Run the app

`node app.js`

15 Mar 10:46:25 - WMCH Interactive maps listening at http://:::8080

`node app.js --port 9089`

15 Mar 10:46:31 - WMCH Interactive maps listening at http://:::9089


### Urls
- Backend: http://localhost:9089/wizard/
- Frontend: http://localhost:9089/

### Language negotiation

The website will auto-detect the user language based on browser settings.

To force a particular language in the format using the url use the `l` parameter:

- http://localhost:9089/wizard/?l=it
- http://localhost:9089/wizard/?l=it-CH

### Translations

All translations are key-based and hosted in JSON file named after the [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) code under the i18n folder.

Directory structure is.

~~~
i18n
├── wizard
│    ├── en.json
│    └── it.json
└── frontend
    ├── en.json
    └── it.json
~~~

The reference is the **en.json** file.

### Map styles

Map styles is based on sources listed on [Tile servers](https://wiki.openstreetmap.org/wiki/Tile_servers).

### Icon list

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

### External libraries

External libraries are loaded via Wikimedia CDN where availables:
- https://tools.wmflabs.org/cdnjs/

## Run the screenshot server

The screenshot server is used to take a screenshot of the map just before a map is saved to the database.

Port and url are specified on config.json.

`node screenshot.js`

## Auto-update and keep running

To auto-update and keep running the node servers in development environment, you can use:

`nodemon MYSERVERSCRIPT.js --port MYPORT`

## Sticky maps

Maps can be set as sticky altering the sticky column. Greater sticky value will put the item on the top of the map list. Default value for sticky column is 0.

## Maintenance scripts

Regenerate all preview screenshots:

`node maintenance.js -P`

Help for all available commands:

`node maintenance.js --help`
