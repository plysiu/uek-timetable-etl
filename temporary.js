var EventTemp = require('uekplan-models').eventTemp,
    async = require('async');

module.exports = (events) => {
    return findOrCreate(events);
};
/**
 * @returns {Promise}
 */
var clean = ()=> {
    console.log('cleaning temporary table');
    return EventTemp.truncate();
}
/**
 * @param events
 * @returns {Promise}
 */
var findOrCreate = (events)=> {
    return new Promise((resolve, reject)=> {
        clean()
            .then(()=> {
                console.log('inserting events to temporary table');
                var q = async.queue((event, callback) => {
                    var x = EventTemp.findOrCreate({
                        where: {
                            date: event.date,
                            from: event.from,
                            to: event.to,
                            tutorId: event.tutorId,
                            placeId: event.placeId,
                            groupId: event.groupId,
                            typeId: event.typeId,
                            noteId: event.noteId
                        },
                        defaults: event
                    }).then(()=> {
                        callback();
                    }).catch((err)=> {
                        console.log(err);
                        callback();
                        reject(err);

                    });

                }, 15);

                q.drain = ()=> {
                    resolve();
                };
                events.forEach((event, index)=> {
                    q.push(event);
                });

            })
            .catch((err)=> {
                console.log(err);
                reject(err);
            });
    });
}