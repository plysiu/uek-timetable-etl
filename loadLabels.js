var models = require('uekplan-models');

module.exports = function (labels) {
    return updateDatabase(labels);
};
function updateDatabase(labels) {
    console.log('Labels:add:start');
    return new Promise((resolve, reject)=> {
        var promiseList = [];
        for (var item in labels) {
            promiseList.push(models.label.findOrCreate({
                where: {timetableId: labels[item].timetableId, key: labels[item].key},
                defaults: labels[item]
            }));
        }
        Promise.all(promiseList)
            .then(()=> {
                console.log('Labels:add:stop');
                resolve(updateParentsId(labels));
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

