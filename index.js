'use strict';
var models = require('uekplan-models');
var fs = require('fs');
var jsonfile = require('jsonfile');
var util = require('util');


models.sequelize.sync()
    .then(()=> {
        console.log('Connection to database established.');
        return require('./extract').downloadAll();
    })
    .then((data)=> {
        return require('./transformLabels')(data);
    })
    .then((data)=> {
        return new Promise((resolve, reject)=> {
            return require('./labels')
                .updateLabels(data.labels)
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
        return require('./transformEvents')(data);
    })
    .then((data)=> {
        require('./uploadExceptions')(data.exceptions)

            .then(()=> {
                return require('./loadEvents')(data.events)
            })
            .then(()=> {
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