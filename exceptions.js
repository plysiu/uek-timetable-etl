'use strict';
var Exception = require('uekplan-models').exception;
/**
 * @param exceptions
 * @returns {Promise}
 */
module.exports = (data, logEntry) => {
  return new Promise((resolve, reject) => {
    console.log('inserting exceptions to database');
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
          .then((c) => {
            data.logEntry.exceptionsExtracted = c;
            data.logEntry
              .save().then(() => {
              delete data.exceptions;
              resolve(data);
            });
          });
      })
      .catch((err) => {
        reject(err);
      });

  });
};


