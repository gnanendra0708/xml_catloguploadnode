const chokidar = require('chokidar');
const fs = require('fs');
const request = require('request');
const moment = require('moment');
var mv = require('mv');

const fileCopyDelaySeconds = 1; //10.14.33.120
const watchDir = "\\\\10.14.35.170\\Composite_XML_Creation\\Output_Composite_XML\\journal_product_flyer"; //10.14.35.170
const processedDir = "\\\\10.14.35.170\\Composite_XML_Creation\\Output_Composite_XML\\journal_product_flyer_done";
const copyingFileDir = "D:\\99_EasyCatalog_Templates\\SPRINGER_JOURNAL_PRODUCT_FLYER\\composite_xmls";
const errorDir = "./error";

let lastProcessTime;
let authToken;


/////watcher
let watcher;
let errorwatcher;

startWatcher();

function watcherFunction(path) {
    const fileIndex = path.lastIndexOf('\\') + 1;
    const fileFullName = path.substr(fileIndex);
    const filePureName = fileFullName.split('.')[0];
    const fileExtension = fileFullName.split('.')[1];

    if (fileFullName == 'trigger.txt') {} else {
        fs.stat(path, function(err, stat) {
            if (err) {
                // console.log('Error watching file for copy completion. ERR: ' + err.message);
                //console.log('Error file not processed. PATH: ' + path);
            } else {
                //console.log('File copy started...');
                setTimeout(checkFileCopyComplete, fileCopyDelaySeconds * 1000, path, stat, fileFullName, filePureName, fileExtension);
            }
        });
    }
}



// Makes sure that the file added to the directory, but may not have been completely copied yet by the
// Operating System, finishes being copied before it attempts to do anything with the file.
function checkFileCopyComplete(path, prev, fileFullName, filePureName, fileExtension) {
    fs.stat(path, function(err, stat) {

        if (err) {
            //Move file to error folder
            moveToError(fileFullName);
        }
        try {
            if (stat.mtime.getTime() === prev.mtime.getTime()) {
                //console.log('File copy complete => beginning processing');
                //-------------------------------------
                // CALL A FUNCTION TO PROCESS FILE HERE
                //-------------------------------------

                //searchXML(path, fileFullName, filePureName, fileExtension);
                jpffilemove();
            } else {
                setTimeout(checkFileCopyComplete, fileCopyDelaySeconds * 1000, path, stat);
            }
        }catch (e) {
            //Move file to error folder
            moveToError(fileFullName);
        }

    });
}

function jpffilemove(){
  fs.readdir(watchDir,   function(err, files) {
    if (err) throw err;
    for (let index in files) {
      //watcher.emit("process", files[index]);
      const watchFile = watchDir + "\\" + files[index];
      const destinationFile = 'D:\\99_EasyCatalog_Templates\\SPRINGER_JOURNAL_PRODUCT_FLYER\\composite_xmls\\01_XML_in\\'+files[index];
  const processedFile = processedDir + "\\" + files[index].toLowerCase();
  fs.copyFile(watchFile, destinationFile, (err) => {
    if (err) throw err;
    console.log('Xml File was copied to destination successfully!');

    mv(watchFile, processedFile,  function(err) {
        if (err) {
          return console.error('Moving file failed:', err);
        }
        console.log('File moved successfully!'); 
      });
  });
  
 
    }
  });
}

function startWatcher() {

    watcher = chokidar.watch(watchDir, {
        persistent: true,
    });
    errorwatcher = chokidar.watch(errorDir, {
        persistent: true,
    });

    watcher
        .on('ready', function() {
            console.log('Initial scan complete for in-folder. Ready for changes.');
            //login ELVIS and get authToken
            jpffilemove();
        })
        .on('unlink', function(path) {
            // console.log('File: ' + path + ', has been REMOVED');
        })
        .on('error', function(err) {
            // console.log('Chokidar file watcher failed. ERR: ' + err.message);
        })
        .on('add', function(path) {
            // console.log('File', path, 'has been ADDED');
            watcherFunction(path)
        });


    
}

// arr = [1, 2,3]
//check if watcher is idle // setInterval() => {...arr}
var seconds = 10,
    check_idleInterval = seconds * 1000;
setInterval(function() {

     console.log("I am doing my 60 seconds watcher idle check");
    // do your stuff here
    let isAfter;

    if (typeof lastProcessTime !== 'undefined' && lastProcessTime !== null) {
        var time = moment(lastProcessTime);

        var duration = moment.duration(moment().diff(time));
        var sec = duration.asSeconds();

        if (sec >= 10) {
            isAfter = true
        } else {
            isAfter = false
        }
    } else {
        isAfter = true;
    }

    console.log("isAfter: " + isAfter);

    if (isAfter == true) {
        try {
            watcher.close();
            errorwatcher.close();
        } catch (e) {}
        //check if in folder contains file - if yes start watcher
        console.log("# files in folder: " + fs.readdirSync(watchDir).length);
        if (fs.readdirSync(watchDir).length === 0) {

        } else {
            startWatcher();
        }
    }

}, check_idleInterval);