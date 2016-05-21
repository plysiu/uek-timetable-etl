var EventTemp = require('uekplan-models').event_temp;
var async = require('async');
var CONFIG = require('./config');

module.exports = (data, logEntry) => {
  return findOrCreate(data, logEntry);
};

/**
 * @returns {Promise}
 */
var clean = () => {
  return EventTemp.truncate();
  // return Promise.resolve();
};
/**
 * @param events
 * @returns {Promise}
 */
var findOrCreate = (data) => {
  console.log('INFO: Inserting events to temporary table');
  return new Promise((resolve, reject) => {
    clean()
      .then(() => {
        var q = async.queue((event, callback) => {
          EventTemp.findOrCreate({
            where: {
              date: event.date,
              from: event.from,
              to: event.to,
              tutorId: event.tutorId,
              placeId: event.placeId,
              groupId: event.groupId,
              typeId: event.typeId,
              noteId: event.noteId,
              blocks: event.blocks
            },
            defaults: event
          })
            .spread(() => {
              callback();
            })
            .catch((err) => {
              callback();
              console.log('ERROR: Inserting events to temporary table');
              reject(err);
            });
        }, CONFIG.CONCURRENT_DB_CONNECTIONS);
        data.events.forEach((event) => {
          q.push(event);
        });
        q.drain = () => {
          EventTemp
            .count()
            .then((count) => {
              data.logEntry.eventtempsInserted = count;
              data.logEntry
                .save()
                .then(() => {
                  console.log('INFO: Inserted events to temporary table');
                  resolve(data);
                })
                .catch((err) => {
                  console.log('ERROR: Inserting events to temporary table');
                  reject(err);
                });
            });
        };
      })
      .catch((err) => {
        console.log('INFO: Inserting events to temporary table');
        reject(err);
      });
  });
};

