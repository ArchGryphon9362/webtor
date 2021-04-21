//windor.webtor = window.webtor || [];
//window.webtor.push({
//	id: 'player',
//	baseUrl: 'hslamp.duckdns.org:31361',
//});
var torrentList;

$.ajax({
    url: '/getInfo',
    type: 'get',
    success: function(result) {
        window.webtorIP = result.webtorIP;
    }
});

function SubForm (){
    $.ajax({
        url: '/torrentList',
        type: 'get',
        data: $('#torrentList').serialize(),
        success: function(){
            $('#tList')[0].innerHTML = ''
            $.ajax({
                url: 'getTorrentList',
                type: 'get',
                success: function(result) {
                    torrentList = JSON.parse(result);

                    for(var k in torrentList) {
                        $('#tList')[0].innerHTML += "<p></p>"
                        $('#tList')[0].innerHTML += `<a href="#" data-magnet=${torrentList[k]}>${k}</a>`
                        $('#tList')[0].innerHTML += `<button onclick="delTorrent('${k}')">X</button>`
                    }
                    $('#torrentList')[0].reset()
                }
            })
        }
    });
}
function delTorrent(name){
    $.ajax({
        url: '/delTorrent',
        type: 'get',
        data: `name=${encodeURIComponent(name)}`,
        success: function(){
            $('#tList')[0].innerHTML = ''
            $.ajax({
                url: 'getTorrentList',
                type: 'get',
                success: function(result) {
                    torrentList = JSON.parse(result);

                    for(var k in torrentList) {
                        $('#tList')[0].innerHTML += "<p></p>"
                        $('#tList')[0].innerHTML += `<a href="#" data-magnet=${torrentList[k]}>${k}</a>`
                        $('#tList')[0].innerHTML += `<button onclick="delTorrent('${k}')">X</button>`
                    }
                }
            })
        }
    });
}

function playTorrent(name) {
    torrentId = torrentList[name];
    console.log(torrentId)
    window.webtor.push({id: 'player', baseUrl: window.webtorIP, magnet: torrentId})
}
$.ajax({
    url: 'getTorrentList',
    type: 'get',
    success: function(result) {
        torrentList = JSON.parse(result);

        for(var k in torrentList) {
            $('#tList')[0].innerHTML += "<p></p>"
            $('#tList')[0].innerHTML += `<a href="#" data-magnet=${torrentList[k]}>${k}</a>`
            $('#tList')[0].innerHTML += `<button onclick="delTorrent('${k}')">X</button>`
        }
    }
})

