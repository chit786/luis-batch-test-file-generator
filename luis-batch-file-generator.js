const fs = require('fs');
const intentUtteranceGenerator = require("intent-utterance-generator");
const chalk = require("chalk");
const chalkTable = require("chalk-table/src");

const config = require('./modal.json');
const reportDir = "./batch_files";
const dataSetDir = "./data-sets";

let coveredSynonyms = [];

if (!fs.existsSync(dataSetDir)){
    throw new Error("missing data-sets folder, please create one and keep all your files in the folder");
};

function computeEntities(utterance, config) {
    let entities = [];
    let entity = {};

    for(let k = 0; k < config.closedLists.length; k++) {
        for(let e = 0; e < config.closedLists[k].subLists.length; e++) {
            let searchBy = config.closedLists[k].subLists[e].canonicalForm;
            let words = utterance.match(/\b(\w+)\b/g);
            let searchByWords = searchBy.match(/\b(\w+)\b/g);
            let posOfMatchingWord = utterance.indexOf(searchBy);
            if ( posOfMatchingWord > -1 && words.some(w => searchByWords.includes(w))) {
                Object.assign(entity, {
                    "entity": config.closedLists[k].name,
                    "startPos": posOfMatchingWord,
                    "endPos": posOfMatchingWord + searchBy.length - 1
                });
                entities.push(entity);
                entity = {};
                let item = {
                    "entity": config.closedLists[k].name,
                    "word": searchBy
                };
                if (canInsertEntityWord(item)) {
                    coveredSynonyms.push(item);
                };
            } 
            
            for(let p = 0; p < config.closedLists[k].subLists[e].list.length; p++) {
                let pp = config.closedLists[k].subLists[e].list[p];
                let words = utterance.match(/\b(\w+)\b/g);
                let searchByWords = pp.match(/\b(\w+)\b/g);
                let posOfMatchingWord = utterance.indexOf(pp);
                if ( posOfMatchingWord > -1 && words.some(w => searchByWords.includes(w))) {
                    Object.assign(entity, {
                        "entity": config.closedLists[k].name,
                        "startPos": posOfMatchingWord,
                        "endPos": posOfMatchingWord + pp.length - 1
                    });
                    entities.push(entity);
                    entity = {};
                    let item = {
                        "entity": config.closedLists[k].name,
                        "word": pp
                    };
                    if (canInsertEntityWord(item)) {
                        coveredSynonyms.push(item);
                    };
                } 
            }
        }
    }
    return entities;
}

function canInsertEntityWord(entity) {
    for (let i = 0; i < coveredSynonyms.length; i++) {
        if(JSON.stringify(coveredSynonyms[i]) === JSON.stringify(entity)) {
            return false;
        }
    }
    return true;
}

function publishEntitiesCoverage(config, path) {

    let result = config.closedLists.reduce(function(map, obj) {
        map[obj.name] = 0;
        return map;
    }, {});

    let coveredEntities = 0;
    let uncoveredEntities = [];

    fs.readdirSync(path).forEach(file => {
        let input = require(`./${path}/${file}`);

        for(let i = 0 ; i < input.length ; i++) {
            let entities = input[i].entities;
            for(let j = 0 ; j < entities.length ; j++) {
                result[entities[j].entity] = 1;
            }
        }
    });
    console.log(`${chalk.gray("=====================COVERED ENTITIES====================\n\n")}`);
    Object.keys(result).forEach( (key) => {
        if(result[key] == 1) {
            coveredEntities++;
        } else {
            let intent = {
                "title": key
            }
            uncoveredEntities.push(intent);
        }
    });

    console.log(`
    ENTITIES COVERED: ${chalk.green(coveredEntities)}
    ENTITIES NOT COVERED: ${chalk.red(Object.keys(result).length - coveredEntities)}
    PERCENTAGE COVERAGE: ${chalk.cyan((coveredEntities / Object.keys(result).length) * 100)} ${chalk.cyan('%')}
    `);
    
    if (uncoveredEntities.length > 0) {
        console.log(`${chalk.gray("\n\n")}`);
        const options = {
            leftPad: 2,
            columns: [
                { field: "title",     name: chalk.red("NOT COVERED ENTITIES") }
            ]
        };
        const table = chalkTable(options, uncoveredEntities);
        console.log(table);
    }
}

function publishCoveredEntityWords() {
    console.log(`${chalk.gray("\n\n")}`);
    console.log(`${chalk.gray("=====================COVERED SYNONYMS====================\n\n")}`);
    const options = {
        leftPad: 2,
        columns: [
            { field: "entity", name: chalk.red("ENTITY NAME") },
            { field: "word", name: chalk.red("WORD/SYNONYM") }
        ]
    };
    coveredSynonyms
        .sort((a, b) => (a.entity > b.entity) ? 1 : (a.entity === b.entity) ? ((a.word > b.word) ? 1 : -1) : -1 );
    const table = chalkTable(options, coveredSynonyms);
    console.log(table);
}

function computeIntentCoverage(config) {

    let result = config.intents.reduce(function(map, obj) {
        map[obj.name] = 0;
        return map;
    }, {});

    let coveredIntents = 0;
    let uncoveredintents = [];

    fs.readdirSync(dataSetDir).forEach(file => {
        let intent_utterances_input = require(`./${dataSetDir}/${file}`);
        let utterances = intentUtteranceGenerator(intent_utterances_input).toString().split("\n");

        let filtered = utterances.filter(function (el) {
            return el != '';
        });

        for(let i = 0 ; i < filtered.length ; i++) {
            let intent = filtered[i].substr(0, filtered[i].indexOf(" "));
            if(intent in result) {
                result[intent] = 1;
            }
        }

    });

    Object.keys(result).forEach( (key) => {
        if(result[key] == 1) {
            coveredIntents++;
        } else {
            let intent = {
                "title": key
            }
            uncoveredintents.push(intent);
        }
    });

    console.log(`
    INTENTS COVERED: ${chalk.green(coveredIntents)}
    INTENTS NOT COVERED: ${chalk.red(Object.keys(result).length - coveredIntents)}
    PERCENTAGE COVERAGE: ${chalk.cyan((coveredIntents / Object.keys(result).length) * 100)} ${chalk.cyan('%')}
    `);
    console.log(`${chalk.gray("========================NOT COVERED INTENTS=========================\n\n")}`);
    
    const options = {
        leftPad: 2,
        columns: [
            { field: "title",     name: chalk.red("NOT COVERED INTENTS") }
        ]
    };
    const table = chalkTable(options, uncoveredintents);
    console.log(table);
}

let dt = new Date();
dt = `${
    (dt.getMonth()+1).toString().padStart(2, '0')}_${
    dt.getDate().toString().padStart(2, '0')}_${
    dt.getFullYear().toString().padStart(4, '0')}_${
    dt.getHours().toString().padStart(2, '0')}_${
    dt.getMinutes().toString().padStart(2, '0')}_${
    dt.getSeconds().toString().padStart(2, '0')}`;

fs.readdirSync(dataSetDir).forEach(file => {
    let intent_utterances_input = require(`./${dataSetDir}/${file}`);
    let output = [];
    let utterances = intentUtteranceGenerator(intent_utterances_input).toString().split("\n");

    let filtered = utterances.filter(function (el) {
        return el != '';
    });

    if(filtered.length > 1000 ) {
        throw new Error("LUIS do not allow more then 1000 utterances in one file");
    }

    for (let i = 0 ; i < filtered.length; i++) {
        let testUtt = {
            "text": filtered[i].substr(filtered[i].indexOf(" ") + 1),
            "intent": filtered[i].substr(0, filtered[i].indexOf(" ")),
            "entities": computeEntities(filtered[i].substr(filtered[i].indexOf(" ") + 1), config)
        };
        if (!fs.existsSync(`${reportDir}_${dt}`)){
            fs.mkdirSync(`${reportDir}_${dt}`);
        };
        output.push(testUtt);
    }

    fs.writeFileSync(`./${reportDir}_${dt}/${file}`, JSON.stringify(output, null, 2));
});

computeIntentCoverage(config);

publishEntitiesCoverage(config, `${reportDir}_${dt}`);

publishCoveredEntityWords();
