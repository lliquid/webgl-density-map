$(function() {

    var app = {};

    app.config =  {
        width: $('#display0').width(),
        height: 512,
        bandwidth: 6,
        k: 4,
        colors: [ {h: (228 / 360), s: 0.3, l: 0.2}, {h: (60 / 360), s: 1.0, l: 0.9}],
        attentuation: 0.000003
    };

    app.kde = new KDE($('#display0 canvas')[0], app.config);

    $('#bandwidth').change(function() {
        var bandwidth = $('#bandwidth').val() / 4;
        app.kde.clear();
        app.kde.setKernel(bandwidth, 4);
        app.kde.reDraw();
        $('[for=bandwidth] .value').text(bandwidth);
    });

    $('#attentuation').change(function() {
        var attentuation = app.config.attentuation * Math.pow(10, ($('#attentuation').val() - 50) / 25);
        app.kde.clear();
        $('[for=attentuation] .value').text(attentuation.toFixed(8));
        app.kde.setAttentuation(attentuation);
        app.kde.reDraw();
    });    


    //DBLP co-authorship graph
    // d3.json('source/data/graph/dblp_vis_coauthor.json', function(data) {

    //     var nodes = data.nodes,
    //         coords = _.map(nodes, function(n){
    //             return [n.x, n.y];
    //         });

    //     var coords_all = [];
    //     var i = -1;
    //     while(++i < coords.length) {
    //         for (var j =0; j < 1; j ++) {
    //             coords_all.push([coords[i][0] + j / 100, coords[i][1] + j / 100]);
    //         }
    //     }


    //     app.kde.drawData(coords_all, {
    //         d0: [0, 0],
    //         sx: 0.01,
    //         sy: 0.01,
    //         x0: 0,
    //         y0: 0
    //     });

    // });


    // social checkin data
    d3.json('source/data/Gowalla_positions.json', function(data) {

        app.kde.drawData(data, {
            d0: [-60, 40],
            sx: 5,
            sy: 8,
            x0: 0,
            y0: 0
        });

    });


});