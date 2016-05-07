var models = require('uekplan-models');

module.exports = function (events) {
    return updateDatabase(events);
};
function updateDatabase(events) {
    console.log('Inserting events to db');
    return new Promise((resolve, reject)=> {
        var promiseList = [];
        events.forEach((event)=> {
            promiseList.push(models.event.findOrCreate({
                where: {
                    day: event.day,
                    from: event.from,
                    to: event.to,
                    tutorId: event.tutorId,
                    placeId: event.placeId,
                    groupId: event.groupId,
                    type: event.type,
                    note: event.note
                },
                defaults: event
            }));
        });

        Promise.all(promiseList)
            .then((data)=> {
                resolve(data);
            }).catch((err)=> {
            reject(err);
        });
    });
}