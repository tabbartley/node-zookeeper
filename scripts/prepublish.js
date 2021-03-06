const fs = require('fs');
const http = require('http');
const shell = require('shelljs');
const decompress = require('decompress');
const decompressTargz = require('decompress-targz');
const env = require('./env.js');
const { exec } = require('./helper.js');

function writeFile(url, destination, resolve, reject) {
    const file = fs.createWriteStream(destination);

    const req = http.get(url, (res) => {
        res.pipe(file);
    });

    req.on('error', (e) => {
        file.unlink(destination);
        reject(e);
    });

    file.on('error', () => {
        file.unlink(destination);
        reject(new Error('File error'));
    });

    file.on('finish', resolve);
}

function download(url, destination) {
    if (fs.existsSync(destination)) {
        shell.echo(`${destination} already exists. Skipping download.`);

        return Promise.resolve();
    }

    const executor = writeFile.bind(null, url, destination);
    return new Promise(executor);
}

function validateFile(fileName) {
    let res;

    if (env.isWindows) {
        const output = exec(`certutil -hashfile ${fileName} SHA1`).split('\r\n');

        // `certutil` returns 2byte separated string (e.g. "a9 89 b5 27 f3 f9 90 d4 71 e6 d4 7e e4 10 e5 7d 8b e7 62 0b")
        const sha1 = output[1].replace(/ /g, "");

        res = `${sha1}  ${fileName}`;
    } else {
        res = exec(`shasum -a 1 ${fileName}`).trim();
    }

    if (res !== env.sha1sum) {
        throw new Error(`Wrong sha1 for ${fileName}! Expected "${env.sha1sum}", got "${res}".`);
    }
}

function clearPath() {
    if (!shell.test('-d', env.sourceFolder)) {
        return;
    }

    shell.rm('-rf', env.sourceFolder);
}

function moveFolder() {
    if (env.isWindows) {
        shell.cp('-r', env.downloadedFolderName, env.sourceFolder);
        shell.rm('-rf', env.downloadedFolderName);
        return;
    }

    shell.mv(env.downloadedFolderName, env.sourceFolder);
}

function applyPatches() {
    if (env.isWindows) {
        const destination = `${env.sourceFolder}/src/c/src`;

        shell.sed('-i', '#include "zookeeper_log.h"', '#include "zookeeper_log.h"\n#include "winport.h"\n', `${destination}/zk_log.c`);
        shell.sed('-i', '#include "zookeeper.h"', '#include "winport.h"\n#include "zookeeper.h"\n', `${destination}/zk_adaptor.h`);
        shell.sed('-i', '#include "zk_adaptor.h"', '#include "zk_adaptor.h"\n#include "winport.h"\n', `${destination}/zookeeper.c`);

        return;
    }

    exec(`patch -p0 < ${env.rootFolder}/patches/ZOOKEEPER-642.patch`);
}

if (env.isAlreadyBuilt) {
    shell.echo('Zookeeper has already been built');
    shell.exit(0);
    return;
}

shell.config.fatal = true;
shell.config.verbose = true;

shell.cd(env.workFolder);

download(env.downloadUrl, env.downloadedFileName)
    .then(() => {
        validateFile(env.downloadedFileName);

        clearPath();

        decompress(env.downloadedFileName, './', {
            plugins: [
                decompressTargz()
            ]
        }).then(() => {
            moveFolder();
            applyPatches();
        }).catch((e) => {
            shell.echo(`Error: ${e.message}`);
            shell.exit(1);
        });

    })
    .catch((e) => {
        shell.echo(`Unable to download zookeeper library. Error: ${e.message}`);
        shell.exit(1);
    });
