'use strict';
var models = require('uekplan-models');
/**
 * @param exceptions
 * @returns {Promise}
 */
module.exports = (exceptions)=> {
    return new Promise((resolve, reject) => {
        console.log('inserting exceptions to database');
        var promiseList = [];
        for (var exception in exceptions) {
            promiseList.push(models.exception.findOrCreate({
                where: {
                    key: exceptions[exception].key,
                    type: exceptions[exception].type
                },
                defaults: exceptions[exception]
            }));
        }
        Promise.all(promiseList)
            .then(()=> {
                resolve();
            }).catch((err)=> {
            reject(err);
        });
    });
}

