Command line scripts here.

## Maintenance

Help for all available maintenance commands:

`node maintenance.js --help`

### Regenerate screenshots

If a relevant change to the code will affect all maps in the database, screenshots can be regenerated.

To regenerate all preview screenshots:

`node maintenance.js -P`

### Check history

To test comparison between History of a specified map.id (e.g. 10):

`node maintenance.js -T 10`

### Regenerate history

To regenerate diff between History of a specified map.id (e.g. 10) e.g. when changing diff or json on History database:

`node maintenance.js -D 10`

both diff and json will be changed accordingly to diff between nearest siblings.


### Generate stats from History

After an upgrade or migration, or when you change counters on [units/stats.js](units/stats.js) you can:

- Empty the stats table (e.g. TRUNCATE) if not already empty
- Run `node maintenance.js -H` to populate stat table from history
