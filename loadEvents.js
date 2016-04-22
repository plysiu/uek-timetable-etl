var models = require('uekplan-models');

module.exports = function (events) {
    return updateDatabase(events);
};
function updateDatabase(events) {
    console.log('Events:add:start');
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
                console.log('Events:add:stop');
                resolve(data);
            }).catch((err)=> {
            reject(err);
        });
    });

}
function updateParentsId(labels) {
    return new Promise((resolve, reject)=> {
        console.log('Labels:parrentUpdate:start');
        models.label.findAll({where: {$or: [{type: 'F'}, {type: 'B'}, {type: 'C'}]}})
            .then((res)=> {
                var promiseList = [];
                res.forEach((item)=> {
                    promiseList.push(models.label.update({parentId: item.dataValues.id}, {where: {parentText: item.dataValues.key}}));
                });
                Promise.all(promiseList)
                    .then(()=> {
                        console.log('Labels:parrentUpdate:stop');
                        models.label.findAll({order: [['key', 'DESC']]})
                            .then((data)=> {
                                var list = {};
                                data.forEach((element)=> {
                                    try {
                                        list[element.dataValues.timetableId || element.dataValues.key] = element.dataValues;
                                    } catch (err) {
                                        console.log(err);
                                    }
                                });
                                resolve(list);
                            })
                            .catch((err)=> {
                                reject(err);
                            })
                    });
            }).catch((err)=> {
            reject(err);
        })
    })
}

