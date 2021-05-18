import webtor from '@webtor/platform-sdk-js';
import 'video.js/dist/video-js.css';
import videojs from 'video.js';
// import hls from 'videojs-contrib-hls';
const parseTorrent = require('parse-torrent');
var v;

var lastSave = -1;

function timeout(ms) {
    new Promise(resolve => setTimeout(resolve, ms));
}

window.wtscript = async function() {
    const links = document.querySelectorAll('a[data-magnet]');
    
    for (const l of links) {
        l.addEventListener('click', function (e) {
            const m = e.target.getAttribute('data-magnet');
            run(m);
            e.preventDefault();
            return false;
        });
    }

    init();
}

async function init() {
    v = videojs("webtor");
    
    console.log('he');

    await timeout(5000);

    let test = document.getElementById("webtor").addEventListener("timeupdate", (t) => {
        console.log('attempting to...');
        if ((t.target.currentTime - (t.target.currentTime % 1)) % 2) {
            if (lastSave != (t.target.currentTime - (t.target.currentTime % 1))) {
                lastSave = (t.target.currentTime - (t.target.currentTime % 1));
    
                console.log('***trying to save time***');
    
                $.ajax({
                    url: '/saveTime',
                    type: 'post',
                    data: {
                        name: document.querySelector('#download').innerText,
                        time: t.target.currentTime
                    },
                    success: function(a) {
                        console.log('saved time!');
                    }
                });
            }
        }
    })
    console.log(test);
    console.log('ha');
}

async function run(magnetUri) {
    const link = document.querySelector('#download');
    link.setAttribute('target', '_blank');
    //link.innerHTML = 'loading...';
    const status = document.querySelector('#status')
    status.innerHTML = '';

    const sdk = webtor({
        apiUrl: /*'http://192.168.68.204:32477'*/ window.webtorIP, // you should change this
    });

    let torrent = parseTorrent(magnetUri);

    try {
        torrent = await sdk.torrent.pull(torrent.infoHash);
    } catch (e) {
        console.log(e);
        torrent = null;
    }

    if (!torrent) {
        torrent = await sdk.magnet.fetchTorrent(magnetUri);
    }

    const expire = 60*60*24;

    await sdk.torrent.push(torrent, expire);

    const seeder = sdk.seeder.get(torrent.infoHash);

    let filePath = null;

    document.getElementById("files").innerHTML="";

    const filesAlpha = torrent.files.sort(function(a, b) {
        var textA = a.name.toUpperCase();
        var textB = b.name.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    console.log(filesAlpha);

    for (const f of filesAlpha) {
        if (sdk.util.getMediaType(f.path) == 'video') {
            filePath = f.path;
            document.getElementById("files").innerHTML=document.getElementById("files").innerHTML+'<a href="#" file-url="' + f.path + '">' + f.name + "</a>"+"<br>";
            const links = document.querySelectorAll('a[file-url]');
            for (const l of links) {
                l.addEventListener('click', function (e) {
                    const m = e.target.getAttribute('file-url');
                    play(m, seeder);
                    e.preventDefault();
                    return false;
                });
            }

        }
    }    

//    const url = await seeder.streamUrl(filePath);
//
//    const v = videojs("webtor");
//    v.src({
//        src: url.toString(),
//    });
//
//    link.setAttribute('href', url.toString());
//    link.innerHTML = filePath;
//
//    // NOTE: stats will become available only after content url access
//    seeder.stats(filePath, (path, data) => {
//        console.log(data);
//        status.innerHTML = 'total: ' + data.total;
//        status.innerHTML += ' completed: ' + data.completed;
//        status.innerHTML += ' peers: ' + data.peers;
//    });
}

async function play(fPath, seeder) {
    const link = document.querySelector('#download');
    const url = await seeder.streamUrl(fPath);
    const status = document.querySelector('#status');

    v.src({
        src: url.toString(),
    });

    link.setAttribute('href', url.toString());
    link.innerHTML = fPath;

    // NOTE: stats will become available only after content url access
    seeder.stats(fPath, (path, data) => {
        console.log(data);
        status.innerHTML = 'total: ' + (data.total >= 1073741824) ? ((data.total / 1073741824).toFixed(0) + 'GB') : ((data.total / 1048576).toFixed(0) + 'MB');
        status.innerHTML += ' completed: ' + (data.completed >= 1073741824) ? ((data.completed / 1073741824).toFixed(0) + 'GB') : ((data.completed / 1048576).toFixed(0) + 'MB');
        status.innerHTML += ' peers: ' + data.peers;
    });

}
