const util = require('util');
const dbinit = require('./db/init');
const models = require('./db/models');
const localconfig = dbinit.init();
const db = require(util.format('./db/connector/%s', localconfig.database.engine));

const CronJob = require('cron').CronJob;
const sequelize = require('sequelize');
const got = require('got');

const job = new CronJob('0 12 */6 * * *', async function () {
    console.log('hello');
    let dbMeta = new db.Database(localconfig.database);
    const Map = dbMeta.db.define('map', models.Map);
    const History = dbMeta.db.define('history', models.History);
    Map.hasMany(History);
    History.belongsTo(Map);
    const histories = await History.findAll({
        attributes: [
            [sequelize.fn('MAX', sequelize.col('history.createdAt')), 'maxCreatedAt']
        ],
        where: {
            diff: true,
            error: false
        },
        include: [{
            model: Map,
            attributes: ['id'],
            where: {
                published: true
            }
        }
        ],
        group: [
            ['map.id']
        ]
    });
    for (const history of histories) {
        const timestamp = new Date(history.dataValues.maxCreatedAt).getTime();
        const dataUrl = localconfig.internalUrl + '/api/data?id=' + history.map.id;
        await got(dataUrl);
        const timedataUrl = localconfig.internalUrl + '/api/timedata?id=' + history.map.id + '&timestamp=' + timestamp;
        await got(timedataUrl);
    }
});
job.start();