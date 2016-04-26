var models = require('uekplan-models');

module.exports = function (exceptions) {
    console.log('exceptions:add:start');
    return new Promise((resolve, reject)=> {
        var promiseList = [];

        for (var exception in exceptions) {
            promiseList.push(models.label.findOrCreate({
                where: {key: exceptions[exception].key, type: exceptions[exception.typep]},
                defaults: exceptions[exception]
            }));
        }
        Promise.all(promiseList)
            .then(()=> {
                console.log('exceptions:add:stop');
                resolve(promiseList);
            }).catch((err)=> {
            reject(err);
        });


    });
}

