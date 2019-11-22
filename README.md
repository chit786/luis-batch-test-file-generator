# Nodejs tool to generate batch test files (in json format) for Microsoft LUIS

https://docs.microsoft.com/en-us/azure/cognitive-services/luis/luis-concept-batch-test

This tool can help you automatically create [batch testing](https://docs.microsoft.com/en-us/azure/cognitive-services/luis/luis-concept-batch-test) format files with no pain in identifying the start and end positions of the entities as well as idenfying the entities in your utterance. 

## Works on Mac OS / Windows OS

## Prerequisite

- Install Nodejs library by downloading latest version of NodeJS from https://nodejs.org/en/
- check if node and npm is installed perfectly by running command `node -v` and `npm -v`. Both of these commands should return - version number which confirms that the installation is successful
- Export your modal from LUIS in JSON format against which you want to run your batch test (this option is available under Manage > Versions > Select version > Export > Export as JSON)

## Steps

- Rename the JSON file of the exported modal to `modal.json` and place in the root of this project's folder
- create a folder named `data-sets` 
- create a JSON file with mappings containing intent vs utterances as described here : https://github.com/miguelmota/intent-utterance-generator , example file content:
  
  *sample-intent-vs-utterance.json*
  ```
  {
    StartNewGameIntent: [
      '(start|begin|launch) new game',
      'start over'
    ],
    HighScoreIntent: 'What are the (top|high) scores'
  };
  ```
- You can create as many files as possible and put them under `data-sets` folder created before
- open terminal / powershell > navigate the this folder
- run `npm install`, this will download dependent libraries `intent-utterance-generator` and `chalk-table`
- run command `node ./luis-batch-file-generator.js` 
- Thats it! and you will have the `tedious` job of creation of the LUIS batch file done for you! You will find them in the folder named `batch_files_xx_xx_xx`
- Addition to that you will see following types of test coverages on your terminal: 

     >  INTENTS COVERAGE  
     >  NOT COVERED INTENTS LIST
     >  COVERED ENTITIES
     >  Entities Coverage
     >  Synonyms Covered
