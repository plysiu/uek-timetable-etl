var models = require('uekplan-models'),
    fs = require('fs'),
    jsonfile = require('jsonfile'),
    util = require('util');


var neverEndingStory = ()=> {
    return new Promise((resolve, reject)=> {
        require('./extract').downloadAll()
            .then((data)=> {
                return require('./transformLabels')(data);
            })
            .then((data)=> {
                return new Promise((resolve, reject)=> {
                    return require('./labels')
                        .updateLabels(data.labels)
                        .then((labels)=> {

                            delete data.list;
                            delete data.sections;
                            data.labels = labels;
                            resolve(data);
                        }).catch((err)=> {
                            reject(err)
                        });
                });
            })
            .then((data)=> {
                return require('./transformEvents')(data);
            })
            .then((data)=> {
                require('./exceptions')(data.exceptions)
                    .then(()=> {
                        return require('./temporary')(data.events)
                    })
                    .then(()=> {
                        return require('./diff').moveFromTempToEvents();
                    })
                    .then((data)=> {
                        console.log(data);
                        return require('./diff').setUnDeletedInEventsWhenExists();
                    })
                    .then((data)=> {
                        console.log(data);
                        return require('./diff').setDeleteInEventsWhenNotExists();
                    })
                    .then((data)=> {
                        console.log(data);
                        resolve()
                    })
                    .catch((e)=> {
                        console.log(e.message);              // "Hello"
                        console.log(e.name);                 // "TypeError"
                        console.log(e.fileName);             // "someFile.js"
                        console.log(e.lineNumber);           // 10
                        console.log(e.columnNumber);         // 0
                        console.log(e.stack);
                        reject(err);
                    });
            });
    });
};

models.sequelize.sync()
    .then(()=> {
        console.log('START', new Date().toString());
        neverEndingStory()
            .then((data)=> {
                console.log('STOP', new Date().toString());
            }).catch((e)=> {
            console.log(e.message);              // "Hello"
            console.log(e.name);                 // "TypeError"
            console.log(e.fileName);             // "someFile.js"
            console.log(e.lineNumber);           // 10
            console.log(e.columnNumber);         // 0
            console.log(e.stack);
            reject(err);
        });

        setInterval(()=> {
            console.log('START', new Date().toString());

            neverEndingStory()
                .then((data)=> {
                    console.log('STOP',new  Date().toString());

                }).catch((e)=> {
                console.log(e.message);              // "Hello"
                console.log(e.name);                 // "TypeError"
                console.log(e.fileName);             // "someFile.js"
                console.log(e.lineNumber);           // 10
                console.log(e.columnNumber);         // 0
                console.log(e.stack);
                reject(err);
            });
        }, 1000 * 60 * 60 * 6);
    });

//
// models.sequelize.sync().then(()=> {
//     console.log('Establishing connection to database');
//     if (fs.existsSync('./data.json')) {
//         console.log('Reading data from cache');
//         return Promise.resolve(JSON.parse(fs.readFileSync('./data.json')));
//     } else {
//         return require('./extract').downloadAll();
//     }
// })
//     .then((data)=> {
//         console.log('Saving data to cache');
//         fs.writeFileSync('./data.json', JSON.stringify(data));
//         return Promise.resolve(data);
//     })
//     .then((data)=> {
//         return require('./transformLabels')(data);
//     })
//     .then((data)=> {
//         return new Promise((resolve, reject)=> {
//             return require('./labels')
//                 .updateLabels(data.labels)
//                 .then((labels)=> {
//                     delete data.list;
//                     delete data.sections;
//                     data.labels = labels;
//                     resolve(data);
//                 }).catch((err)=> {
//                     reject(err)
//                 });
//         });
//     })
//     .then((data)=> {
//         return require('./transformEvents')(data);
//     }).then((data)=> {
//     require('./exceptions')(data.exceptions)
//         .then(()=> {
//             return require('./temporary')(data.events)
//         })
//         .then(()=> {
//             return require('./diff').moveFromTempToEvents();
//         })
//         .then((data)=> {
//             console.log(data);
//             return require('./diff').setUnDeletedInEventsWhenExists();
//         })
//         .then((data)=> {
//             console.log(data);
//
//             return require('./diff').setDeleteInEventsWhenNotExists();
//         })
//
//         .then((data)=> {
//             console.log(data);
//             process.exit();
//         })
//         .catch((e)=> {
//             console.log(e.message);              // "Hello"
//             console.log(e.name);                 // "TypeError"
//             console.log(e.fileName);             // "someFile.js"
//             console.log(e.lineNumber);           // 10
//             console.log(e.columnNumber);         // 0
//             console.log(e.stack);
//             process.exit();
//         });
// })
//     .catch((e)=> {
//         console.log(e);
//         console.log(e.message);              // "Hello"
//         console.log(e.name);                 // "TypeError"
//         console.log(e.fileName);             // "someFile.js"
//         console.log(e.lineNumber);           // 10
//         console.log(e.columnNumber);         // 0
//         console.log(e.stack);
//         process.exit();
//     });