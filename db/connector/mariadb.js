const Sequelize = require('sequelize');
const util = require('util');
/**
 *  Get languages list.
 *  @param {string} name database name (filepath for sqlite)
 *  @return {object}: array of languages (code, name, selected)

function getDb (name) {
    return new Sequelize(util.format('sqlite:%s', name));
}
 **/

class Database {
  constructor(dbconfig) {
    this.name = dbconfig.name;
    this.engine = dbconfig.engine;
    this.username = dbconfig.username;
    this.password = dbconfig.password;
    // values with default
    this.port = dbconfig.port ? dbconfig.port : 3306;
    this.dialectOptions = dbconfig.dialectOptions ? dbconfig.dialectOptions : {"connectTimeout": 1000};
  }

  /**
   *  Attribute
   *  @return {object}: new Sequelize connection to database
   */
  get db() {
      return new Sequelize(this.name, this.username, this.password, {
        dialect: 'mariadb',
        port: this.port,
        dialectOptions: this.dialectOptions // mariadb connector option
      });
  }

  /**
   *   to get an authenticated connection
   *  @return {Promise}: an array [value, error]
   */
  connect() {
    return new Promise((resolve, reject) => {
        let db = this.db;
        try {
            db
              .authenticate()
              .then(() => {
                util.log('Connection to %s has been established successfully with connector %s', this.name, this.engine);
                resolve(["ok", false]);
              })
              .catch(err => {
                console.error('Unable to connect to the database:', err);
                resolve([null, true]);
              });
        }
        catch (e) {
            console.error('Unable to connect to the database:', e);
            resolve([null, true]);
        }
    });
  }
}

exports.Database = Database;
