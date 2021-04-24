require('dotenv').config();

const http = require('http');
const fs = require('fs');
const url = require('url');
const mime = require('mime-types');

async function readChunk(file, start, end) {
	return new Promise(function(myResolve, myReject) {
		var data = '';
		var readStream = fs.createReadStream(file,{ highWaterMark: end - start, encoding: 'utf8', start, end });
		readStream.on('data', function(chunk) {
			data += chunk;
		}).on('end', function() {
			myResolve(data);
		})
	})
}

async function app() {

	var torrentList = JSON.parse(fs.readFileSync('./config/torrentList.json'));

	
	http.createServer(function (req, res) {
		var trurl;
		request = url.parse(req.url, true).query
		
		if (req.url.indexOf('?') != -1) {
			trurl = req.url.slice(0, req.url.indexOf('?'));
		} else {
			trurl = req.url;
		}

        console.log('/' + trurl.slice(trurl.lastIndexOf('/')+1, trurl.length))
		
		switch ('/' + trurl.slice(trurl.lastIndexOf('/')+1, trurl.length)) {
			case '/':
				var index = fs.readFileSync('./public/index.html');
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write(index);
				res.end();
				break;
			case '/torrentList':
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write("Welp... You shouldn't be viewing this page 😅");
				torrentList[decodeURIComponent(request.name)] = decodeURIComponent(request.torrent);
				fs.writeFileSync('./config/torrentList.json', JSON.stringify(torrentList));
				res.end();
				break;
			case '/getTorrentList':
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(JSON.stringify(torrentList));
				res.end();
				break;
			case '/delTorrent':
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write("Welp... You shouldn't be viewing this page 😅");
				delete torrentList[decodeURIComponent(request.name)]
				fs.writeFileSync('./config/torrentList.json', JSON.stringify(torrentList));
				res.end();
				break;
			case '/listDir':
				var dirList = [];
				var resp = '';
				resp += '<html><head><meta charset="UTF-8"></head><body>';
				try{dirList = fs.readdirSync(request.dir)}catch(err){console.log(err); break;}
				resp += `<a href="/listDir?dir=${encodeURIComponent(decodeURIComponent(request.dir.slice(0, decodeURIComponent(request.dir.lastIndexOf('/')))))}">..</a>`;
				resp += `<br>`;
				dirList.forEach((dir) => {
					try {
						fs.readdirSync(decodeURIComponent(request.dir + '/' + dir))
						resp += `<a href="/listDir?dir=${encodeURIComponent(request.dir + '/' + dir)}">${dir}</a>`;
					}
					catch(err){
						let mimeType = mime.lookup(request.dir + '/' + dir);
						if (!mimeType) {
							resp += `<a href="/serveFile?dir=${encodeURIComponent(request.dir + '/' + dir)}">${dir}</a>`;
						} else {
							if (mimeType.slice(0, mimeType.indexOf('/')) == 'video' | mimeType.slice(0, mimeType.indexOf('/')) == 'media') {
								resp += `<a href="/playVideo?dir=${encodeURIComponent(request.dir + '/' + dir)}">${dir}</a>`;
							} else {
								resp += `<a href="/serveFile?dir=${encodeURIComponent(request.dir + '/' + dir)}">${dir}</a>`;
							}
						}
					}
					resp += `<br>`;
				})
				resp += '</body></html>';
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write(resp);
				res.end();
				// testVid = document.createElement('video');
				// console.log(testVid.canPlayType('video/mp4'))
				break;
			// case '/serveFile':
			// 	try{dirList = fs.readdirSync(decodeURIComponent(request.dir)); break;}catch(err){}
			// 	mimeType = mime.lookup(decodeURIComponent(request.dir))
			// 	if (!mimeType || mimeType.slice(0, mimeType.indexOf('/')) == 'text') {
			// 		res.writeHead(200, {'Content-Type': mimeType});
			// 		res.write('<head><meta charset="UTF-8"></head>');
			// 		res.write(`<pre>${fs.readFileSync(decodeURIComponent(request.dir))}</pre>`);
			// 	} else {
			// 		res.writeHead(200, {'Content-Type': mimeType});
			// 		res.write(fs.readFileSync(decodeURIComponent(request.dir)));
			// 	}
			// 	break;
			case '/serveFile':
				try{dirList = fs.readdirSync(decodeURIComponent(request.dir)); break;}catch(err){}
				async function serve() {
					try {
						let fileLength  = fs.statSync(decodeURIComponent(request.dir)).size;
						let contentType = mime.lookup(decodeURIComponent(request.dir));
						
						if(req.headers['range']) {

							// Range request, partialle stream the file
							var parts = req.headers['range'].replace(/bytes=/, "").split("-");
							var partialStart = parts[0];
							var partialEnd = parts[1];
				
							var start = parseInt(partialStart, 10);
							var end = partialEnd ? parseInt(partialEnd, 10) : fileLength - 1;
							var chunkSize = (end - start) + 1;
				
							res.writeHead(206, {
								'Content-Range': 'bytes ' + start + '-' + end + '/' + fileLength,
								'Accept-Ranges': 'bytes',
								'Content-Length': chunkSize,
								'Content-Type': contentType
							});
							var readStream = fs.createReadStream(decodeURIComponent(request.dir), { start, end });
							readStream.on('open', function() {
								readStream.pipe(res)
							})
							readStream.on('error', (err) => {
								res.end(err);
								console.log(err)
							})
						} else {
							mimeType = mime.lookup(decodeURIComponent(request.dir))
							if (!mimeType || mimeType.slice(0, mimeType.indexOf('/')) == 'text') {
								res.writeHead(200, {'Content-Type': mimeType});
								res.write('<head><meta charset="UTF-8"></head>');
								res.write(`<pre>${fs.readFileSync(decodeURIComponent(request.dir))}</pre>`);
							} else {
								res.writeHead(200, {'Content-Type': mimeType});
								res.write(fs.readFileSync(decodeURIComponent(request.dir)));
							}
							res.end();
						}
						
					}
					catch (err) {console.log(err);}
				}
				serve()
				break;
			case '/playVideo':
				try{dirList = fs.readdirSync(decodeURIComponent(request.dir)); break;}catch(err){}
				mimeType = mime.lookup(decodeURIComponent(request.dir))
				if (mimeType.slice(0, mimeType.indexOf('/')) == 'video') {
					res.writeHead(200, {'Content-Type': 'text/html'});
					res.write(`<head><meta charset="UTF-8"><script src="https://cdn.plyr.io/3.6.3/plyr.js"></script><script>const player = new Plyr('video');window.player = player;</script></head>`);
					res.write(`<video src="${'/serveFile?dir=' + encodeURIComponent(request.dir)}" width="800" controls canplay autoplay></video>`);
				}
				res.end();
				break;

            case '/getInfo':
                let tmpObj = {
                    webtorIP: process.env.WEBTOR_IP
                };

                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(JSON.stringify(tmpObj));
                res.end();
                break;
			default:
				try {
					var html = fs.readFileSync(`./public/${trurl.slice(1, trurl.length)}`);
                    res.writeHead(200);
                    res.write(html);
                    res.end();
				}
				catch(err) {
                    var index = fs.readFileSync('./public/index.html');
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(index);
                    res.end();
					break;
				}
				break;
		}
	}).listen(8800);

}

app();
