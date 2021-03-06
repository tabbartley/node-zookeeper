const shell = require('shelljs');
const env = require('./env.js');
const { exec } = require('./helper.js');

function handleSunOS() {
    const uname = shell.exec('uname -v');

    if (uname.match('joyent_.*')) {
        const res = shell.exec(`pkgin list | grep zookeeper-client-${env.zookeeperVersion}`);

        if (res.code !== 0) {
            shell.echo('You must install zookeeper before installing this module. Try:');
            shell.echo(`pkgin install zookeeper-client-${env.zookeeperVersion}`);
        }
    }
}

if (env.isSunOs) {
    handleSunOS();
    return;
}

if (env.isAlreadyBuilt) {
    shell.echo('Zookeeper has already been built');
    shell.exit(0);
    return;
}

shell.config.fatal = true;
shell.config.verbose = true;

shell.cd(`${env.sourceFolder}/src/c`);

if (env.isWindows) {
    exec(`cmake -DWANT_SYNCAPI=OFF -DCMAKE_GENERATOR_PLATFORM=${process.arch} .`);
    exec('cmake --build .');
} else {
    exec('./configure --without-syncapi --disable-shared --with-pic');
    exec('make');
}

shell.cd(env.rootFolder);



