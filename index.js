'use strict';

var models = require('uekplan-models'),

    winston = require('winston');

var fs = require('fs');
var jsonfile = require('jsonfile');
var util = require('util');
winston
    .add(winston.transports.File, {filename: './logs.json', level: 'debug'})
    .remove(winston.transports.Console);


models.sequelize.sync().then(function () {

    console.log('Connection to database established.');


    new Promise((resolve, reject)=> {
        if (fs.existsSync('./data.json')) {
            console.log('Cache:read');
            resolve(JSON.parse(fs.readFileSync('./data.json')));
        } else {
            models.label.findAll({order: [['key', 'DESC']]})
                .then((data) => {
                    var labels = {};
                    data.forEach((element)=> {
                        try {
                            labels[element.dataValues.timetableId || element.dataValues.key] = element.dataValues;
                        } catch (err) {
                            console.log(err);
                        }
                    });
                    resolve(require('./transform')(labels));
                })
                .catch((err)=> {
                    reject(err);
                });
        }
    })
        .then((data)=> {
            console.log('Cache:write');
            fs.writeFileSync('./data.json', JSON.stringify(data));
            return data;
        })
        .then((data)=> {
            return require('./transformLabels')(data);
        })
        .then((data)=> {
            return new Promise((resolve, reject)=> {
                return require('./loadLabels')(data.labels)
                    .then((labels)=> {
                        data.labels = labels;
                        resolve(data);
                    })
                    .catch((err)=> {
                        reject(err)
                    });
            });
        })
        .then((data)=> {

            require('./transformEvents')(data)
                .then((events)=> {
                    require('./loadEvents')(events)
                        .then((data)=> {
                            process.exit();

                        }).catch((err)=> {
                        console.log(err);
                        process.exit();
                    });
                })
                .catch((err)=> {
                    console.log(err);
                    process.exit();
                });

        }).catch((err)=> {
        console.log(err);
        process.exit();

    });
})
;


//         titlesBefore = [
//             'prof. dr hab. inż.',
//             'mgr inż. arch krajob',
//             'prof. UEK dr hab.',
//             'prof. dr hab.',
//             'prof. UEK',
//             'dr hab. inż.',
//             'dr hab.',
//             'dr inż.',
//             'mgr inż.',
//             'prof.',
//             'mgr',
//             'dr',
//             'inż.',
//             ''];
//
//