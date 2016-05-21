'use strict';
var Exception = require('uekplan-models').exception;
/**
 * @param exceptions
 * @returns {Promise}
 */
module.exports = (data) => {
  return new Promise((resolve, reject) => {
    console.log('INFO: Inserting exceptions to database');
    var promiseList = [];
    for (var exception in data.exceptions) {
      promiseList.push(Exception.findOrCreate({
        where: {
          key: data.exceptions[exception].key,
          type: data.exceptions[exception].type
        },
        defaults: data.exceptions[exception]
      }));
    }
    Promise.all(promiseList)
      .then(() => {
        Exception.count()
          .then((count) => {
            data.logEntry.exceptionsExtracted = count;
            data.logEntry
              .save()
              .then(() => {
                console.log('INFO: Inserted exceptions to database');
                delete data.exceptions;
                resolve(data);
              })
              .catch((err)=> {
                console.log('ERROR: Inserting exceptions to database');
                reject(err);
              });
          });
      })
      .catch((err) => {
        console.log('ERROR: Inserting exceptions to database');
        reject(err);
      });
  });
};
