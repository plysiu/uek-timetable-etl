var EventTemp = require('uekplan-models').eventtemp,
  async = require('async');

module.exports = (data, logEntry) => {
  return findOrCreate(data, logEntry);
};
/**
 * @returns {Promise}
 */
var CONFIG = require('./config');
var clean = ()=> {
  return EventTemp.truncate();
  // return Promise.resolve();
};
/**
 * @param events
 * @returns {Promise}
 */
var findOrCreate = (data)=> {
  return new Promise((resolve, reject)=> {
    clean()
      .then(()=> {
        console.log('inserting events to temporary table');
        var q = async.queue((event, callback) => {
          console.log(event);
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
            .then(()=> {
              callback();
            })
            .catch((err)=> {
              callback();
              console.log(err);
              reject(err);
            });
        }, CONFIG.CONCURRENT_DB_CONNECTIONS);
        data.events.forEach((event)=> {
          q.push(event);
        });
        q.drain = ()=> {
          EventTemp
            .count()
            .then((c)=> {
            data.logEntry.eventtempsInserted = c;
            data.logEntry
              .save()
              .then(()=> {
                resolve();
              })
              .catch((err)=> {
                console.log(err);
                reject(err);
              });
          });
        };

      })
      .catch((err)=> {
        console.log(err);
        reject(err);
      });
  });
};
