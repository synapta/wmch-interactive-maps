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

const query = function (params) {
    let values = '';
    for (let i = 0; i < params.length; i++) {
        values += `( '${params[i].join("',\n '")}' ),`
    }
    values = values.substring(0, values.length - 1);
    values = values.replace(/'null'/g, "null");
    values = values.replace(/\\/g, "");
    return `INSERT INTO data (map_id,
                            name,
                            wikidata,
                            commons,
                            website,
                            image,
                            link_en,
                            link_de,
                            link_fr,
                            link_it,
                            link_tot_count,
                            lat,
                            lon,
                            id_history)
            VALUES ${values}`
}

const seed = `
select *
from histories h
where diff = 1
and not exists (
	select 1
	from data
	where id_history = h.id
)
limit 1
`

pool.getConnection()
    .then(conn => {
        main(conn);
    }).catch(err => {
        console.log(err);
        process.exit(1);
    });


main = function (conn) {
  conn.query(seed)
    .then((rows) => {
      let allParams = [];
      for (let i = 0; i < rows.length; i++) {
          let json = JSON.parse(rows[i].json);
          for (let j = 0; j < json.data.length; j++) {
              let queryParam = [];
              queryParam.push(rows[i].mapId);
              queryParam.push(json.data[j].properties.name);
              queryParam.push(json.data[j].properties.wikidata);
              queryParam.push(json.data[j].properties.commons || 'null');
              queryParam.push(json.data[j].properties.website || 'null');
              queryParam.push(json.data[j].properties.image || 'null');
              queryParam.push(json.data[j].properties.lang[json.data[j].properties.lang.findIndex(element => element.includes("https://en.wikipedia.org/wiki/"))] || 'null');
              queryParam.push(json.data[j].properties.lang[json.data[j].properties.lang.findIndex(element => element.includes("https://fr.wikipedia.org/wiki/"))] || 'null');
              queryParam.push(json.data[j].properties.lang[json.data[j].properties.lang.findIndex(element => element.includes("https://de.wikipedia.org/wiki/"))] || 'null');
              queryParam.push(json.data[j].properties.lang[json.data[j].properties.lang.findIndex(element => element.includes("https://it.wikipedia.org/wiki/"))] || 'null');
              queryParam.push(json.data[j].properties.lang.length);
              queryParam.push(json.data[j].geometry.coordinates[1]);
              queryParam.push(json.data[j].geometry.coordinates[0]);
              queryParam.push(rows[i].id);

              for (let k = 0; k < queryParam.length; k++) {
                  if (typeof queryParam[k] === 'string')
                      queryParam[k] = queryParam[k].replace(/'/g, "''");
              }

              allParams.push(queryParam);
          }
      }
      //console.log(query(allParams))
      return conn.query(query(allParams));
    })
    .then((res) => {
      console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
      main(conn)
      //conn.end();
      //pool.end();
    })
    .catch(err => {
      //handle error
      console.log(err);
      conn.end();
      pool.end();
    })
}
