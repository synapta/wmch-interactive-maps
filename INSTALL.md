## Set up database

A [PostgreSQL](https://www.postgresql.org/) database is required.

Previous versions used MariaDB, please read [UPGRADE.md](UPGRADE.md).

Create a user and a database, here an example on Linux bash, logged on `postgres` user:

```
createuser -Pse USER_NAME_HERE
MY_USER_NAME=user_name_here
MY_DATABASE=database_name_here
createdb --owner=$MY_USER_NAME --encoding=UTF8 $MY_DATABASE
```

Check with `psql -U postgres -c "\l"`

## Deploy
### Deploy keys

Follow [GitHub instructions to use read-only deploy keys](https://docs.github.com/en/developers/overview/managing-deploy-keys#using-multiple-repositories-on-one-server).

Add to ~/.ssh/config:

```
Host github.com-wmch-interactive-maps
   Hostname github.com
   IdentityFile=~/.ssh/path_to_private_key
```
### Clone repository

`git clone git@github.com-wmch-interactive-maps:synapta/wmch-interactive-maps.git`


### Pull from repository

`git pull`

### Push

Push is not available with read-only keys.

## Node version

- Supported node versions: 16

## System dependencies

To run screenshot server, these dependencies are needed (Debian-based):

`sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm-dev`

Updated dependencies [for Debian-based Linux and other OS are here](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#chrome-headless-doesnt-launch-on-unix).

## Files and directories

Create `screenshots` and `local` directories:

`mkdir -p screenshots && mkdir -p local`

Screenshots directory will contains preview files for maps, local directory could contain the sqlite database and other development data.

### Add localconfig.json

***TL;DR: Copy [localconfig.example.json](ocalconfig.example.json) to localconfig.json. Change data as needed.***

Local settings like database name and authentication data are available in the git ignored `localconfig.json` in the following formats.

On localconfig.json, set the url to the production url. It will be used to expose the path to the user, something like https://example.org/.

### config.json

A global base configuration file is available on `config.json`.

It contains available map styles based on sources listed on [Tile servers](https://wiki.openstreetmap.org/wiki/Tile_servers) page on OpenStreetMap.

## Install dependencies

`nvm exec 16 npm ci`

## Go live

On production, use something like [supervisor](http://supervisord.org/) to keep all services up, passing a script like this:

~~~
#!/bin/bash
cd /path/to/my/app;
exec node app.js --port 9030;
~~~

## Troubleshooting

- Issue: Validation error on a Unique Constraint after a migration, e.g. on histories
- Fix with: `ALTER SEQUENCE histories_id_seq RESTART WITH 20` where 20 is the nextval you need, higher than last value for that sequence.
- Issue:  If on your system you have problem on hanging node installing dependencies (reify...), try downgrade npm
- Fix with: `npm i -g npm@6`
