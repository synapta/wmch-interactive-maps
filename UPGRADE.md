Upgrade from [v2.3.0](https://github.com/synapta/wmch-interactive-maps/tree/v2.3.0):

1. localconfig.json: Copy "database" content to "databaseOldProd"
2. Setup "databaseB" as of [INSTALL.md](INSTALL.md)
3. On `db/` directory launch `nvm exec 11 node copydb.js` command with the suggested flag
4. Content are copied from database to databaseB
5. Regenerate previews as of [INSTALL.md](INSTALL.md)
