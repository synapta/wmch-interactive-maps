const {migrate, connection, Map, History} = require("./db/modelsB.js");
const localconfig = require('./localconfig');

const CronJob = require('cron').CronJob;
const sequelize = require('sequelize');
const got = require('got');

/**
 * Visit periodically to save history paths on server cache.
 */
const job = new CronJob('0 12 */6 * * *', async function () {
    console.log('start');
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
                published: true,  // do not cache draft maps
                history: true  // do not cache maps with history off
            }
        }
        ],
        group: [
            ['map.id']
        ]
    });
    for (const history of histories) {
        const timestamp = new Date(history.dataValues.maxCreatedAt).getTime();
        const dataUrl = localconfig.internalUrl + '/api/dataid/' + history.map.id;
        await got(dataUrl);
        const timedataUrl = localconfig.internalUrl + '/api/timedata?id=' + history.map.id + '&timestamp=' + timestamp;
        await got(timedataUrl);
    }
});
job.start();
