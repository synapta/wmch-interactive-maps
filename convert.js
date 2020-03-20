const dbinit = require('./db/init');
const localconfig = dbinit.init();

const mariadb = require('mariadb');
const pool = mariadb.createPool({
     host: 'localhost',
     database: localconfig.database.name,
     user: localconfig.database.username,
     port: localconfig.database.port,
     password: localconfig.database.password,
     connectionLimit: 5
});

pool.getConnection()
    .then(conn => {

      conn.query("select * from histories h where mapId = 1 and diff = 1 limit 1")
        .then((rows) => {
          for (let i = 0; i < rows.length; i++) {
              let json = JSON.parse(rows[i].json);
              for (let j = 0; j < json.data.length; j++) {
                  console.log (rows[i].createdAt,
                               rows[i].mapId,
                               json.data[j].properties.name,
                               json.data[j].properties.wikidata,
                               json.data[j].properties.commons,
                               json.data[j].properties.website,
                               json.data[j].properties.image,
                               json.data[j].properties.lang[json.data[j].properties.lang.findIndex(element => element.includes("https://commons.wikimedia.org/wiki/Category"))],
                               json.data[j].properties.lang[json.data[j].properties.lang.findIndex(element => element.includes("https://en.wikipedia.org/wiki/"))],
                               json.data[j].properties.lang[json.data[j].properties.lang.findIndex(element => element.includes("https://de.wikipedia.org/wiki/"))],
                               json.data[j].properties.lang[json.data[j].properties.lang.findIndex(element => element.includes("https://fr.wikipedia.org/wiki/"))],
                               json.data[j].properties.lang[json.data[j].properties.lang.findIndex(element => element.includes("https://it.wikipedia.org/wiki/"))],
                               json.data[j].properties.lang.length,
                               json.data[j].geometry.coordinates[1],
                               json.data[j].geometry.coordinates[0],
                               rows[i].id
                              )
              }
          }
          //return conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
        })
        .then((res) => {
          console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
          conn.end();
        })
        .catch(err => {
          //handle error
          console.log(err);
          conn.end();
        })

    }).catch(err => {
      //not connected
    });
