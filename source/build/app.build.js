/*code snippets from threejs webgl_gpgpu_birds example
* need to include three.js
* */

var glUtil = (function() {

    var glu = {

        generateTexture: function(data, format, type, width, height) {

            var texture = new THREE.DataTexture(data, width, height, format, type);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;
            texture.flipY = false;

            return texture;

        },

        getRenderTarget: function(width, height, format, type) {

            var renderTarget = new THREE.WebGLRenderTarget(width, height, {
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: format,
                type: type,
                stencilBuffer: false
            });

            return renderTarget;
        }

    }

    return glu;
})();


var glColor = (function(){

    var glc = {

        getColorTextureHSLInterpolated: function(color0, color1, nColors) {

            var nColors = nColors || 128;

            var colorData = new Float32Array(nColors * 4),
                colorTexture;

            for (var i= 0, ii=nColors; i < ii; i++) {
                var frac = i * 1.0 / ii;
                var c = new THREE.Color();
                c.setHSL(color0.h * (1 - frac) + color1.h * frac, color0.s * (1 - frac) + color1.s * frac, color0.l * (1 - frac) + color1.l * frac);

                colorData[i * 4] = c.r;
                colorData[i * 4 + 1] = c.g;
                colorData[i * 4 + 2] = c.b;
                colorData[i * 4 + 3] = 1.0;
            }

            colorTexture = glUtil.generateTexture(colorData, THREE.RGBAFormat, THREE.FloatType, nColors, 1);

            return colorTexture;
        }
    };

    return glc;
})();




/**
 * Modified from three.js controllers writtern by 
 * @author Eberhard Graether / http://egraether.com/
 * @author Patrick Fuller / http://patrick-fuller.com
 */

THREE.OrthographicZoomAndPanControls = function ( object, domElement ) {

    var _this = this;
    var STATE = { NONE: -1, ZOOM: 1, PAN: 2, TOUCH_ZOOM: 4, TOUCH_PAN: 5 };

    this.object = object;
    this.domElement = ( domElement !== undefined ) ? domElement : document;

    // API

    this.enabled = true;

    this.screen = { width: 0, height: 0, offsetLeft: 0, offsetTop: 0 };

    this.zoomSpeed = 2.4;
    this.panSpeed = 0.3;

    this.noZoom = false;
    this.noPan = false;

    this.zoomFactor = 1;


    // internals

    this.target = new THREE.Vector3();

    var lastPosition = new THREE.Vector3();

    var _state = STATE.NONE,
    _prevState = STATE.NONE,

    _eye = new THREE.Vector3(),

    _zoomStart = new THREE.Vector2(),
    _zoomEnd = new THREE.Vector2(),
    _zoomFactor = 1,

    _touchZoomDistanceStart = 0,
    _touchZoomDistanceEnd = 0,

    _panStart = new THREE.Vector2(),
    _panEnd = new THREE.Vector2();


    var _mousePosition = new THREE.Vector2();

    // for reset

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.up0 = this.object.up.clone();

    this.left0 = this.object.left;
    this.right0 = this.object.right;
    this.top0 = this.object.top;
    this.bottom0 = this.object.bottom;
    this.center0 = new THREE.Vector2((this.left0 + this.right0) / 2.0, (this.top0 + this.bottom0) / 2.0);

    // events

    var changeEvent = { type: 'change' };


    // methods

    this.getMouseOnScreen = function ( clientX, clientY ) {

        return new THREE.Vector2(
            ( clientX - _this.screen.offsetLeft ) / _this.screen.width,
            ( clientY - _this.screen.offsetTop ) / _this.screen.height
        );

    };

    this.zoomCamera = function () {

        var _left = _this.object.left,
            _right = _this.object.right,
            _top = _this.object.top,
            _bottom = _this.object.bottom;

        if ( _state === STATE.TOUCH_ZOOM ) {

            var factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
            _touchZoomDistanceStart = _touchZoomDistanceEnd;
            this.zoomFactor = (_zoomFactor *= factor);

            _this.object.left = _zoomFactor * _this.left0 + ( 1 - _zoomFactor ) *  _this.center0.x;
            _this.object.right = _zoomFactor * _this.right0 + ( 1 - _zoomFactor ) *  _this.center0.x;
            _this.object.top = _zoomFactor * _this.top0 + ( 1 - _zoomFactor ) *  _this.center0.y;
            _this.object.bottom = _zoomFactor * _this.bottom0 + ( 1 - _zoomFactor ) *  _this.center0.y;

        } else {

            var factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;

            if ( factor !== 1.0 && factor > 0.0 ) {

                this.zoomFactor = (_zoomFactor *= factor);

                _this.object.left = _zoomFactor * _this.left0 + ( 1 - _zoomFactor ) *  _this.center0.x;
                _this.object.right = _zoomFactor * _this.right0 + ( 1 - _zoomFactor ) *  _this.center0.x;
                _this.object.top = _zoomFactor * _this.top0 + ( 1 - _zoomFactor ) *  _this.center0.y;
                _this.object.bottom = _zoomFactor * _this.bottom0 + ( 1 - _zoomFactor ) *  _this.center0.y;

                _zoomStart.copy( _zoomEnd );

            }

        }

    };

    this.panCamera = function () {

        var mouseChange = _panEnd.clone().sub( _panStart );

        // mouseChange.multiply(new THREE.Vector2(_this.screen.width, _this.screen.height));

        mouseChange.multiply(new THREE.Vector2(_this.object.right - _this.object.left, _this.object.top - _this.object.bottom));

        _eye.subVectors( _this.object.position, _this.target );            

        var pan = _eye.clone().cross( _this.object.up ).setLength( mouseChange.x );
        pan.add( _this.object.up.clone().setLength(mouseChange.y));

        _this.object.position.add( pan );
        _this.target.add( pan );

        _panStart = _panEnd;

    };

    this.update = function () {

        if ( !_this.noZoom ) {

            _this.zoomCamera();
            _this.object.updateProjectionMatrix();

        }

        if ( !_this.noPan ) {

            _this.panCamera();
            _this.object.lookAt( _this.target );
            _this.object.updateProjectionMatrix();

        }

    };

    this.reset = function () {

        _state = STATE.NONE;
        _prevState = STATE.NONE;

        _this.target.copy( _this.target0 );
        _this.object.position.copy( _this.position0 );
        _this.object.up.copy( _this.up0 );

        _eye.subVectors( _this.object.position, _this.target );

        _this.object.left = _this.left0;
        _this.object.right = _this.right0;
        _this.object.top = _this.top0;
        _this.object.bottom = _this.bottom0;

        _this.object.lookAt( _this.target );

        _this.dispatchEvent( changeEvent );

        lastPosition.copy( _this.object.position );

    };

    // listeners

    function mousedown( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        _mousePosition = _this.getMouseOnScreen( event.clientX, event.clientY);        

        if ( _state === STATE.NONE && !_this.noPan ) {

            _panStart = _panEnd = _mousePosition;

            _state = STATE.PAN;

        }


        _this.domElement.addEventListener( 'mousemove', mousemove, false );
        _this.domElement.addEventListener( 'mouseup', mouseup, false );

    }

    function mousemove( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        _mousePosition = _this.getMouseOnScreen(event.clientX, event.clientY);

        if ( _state === STATE.PAN && !_this.noPan ) {

            _panEnd = _mousePosition;

        }

        _this.update();
        _this.dispatchEvent(changeEvent);

    }

    function mouseup( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        _state = STATE.NONE;

        _mousePosition = _this.getMouseOnScreen(event.clientX, event.clientY);

        _panEnd = _mousePosition;

        _this.update();
        _this.dispatchEvent(changeEvent);        

        _this.domElement.removeEventListener( 'mousemove', mousemove );
        _this.domElement.removeEventListener( 'mouseup', mouseup );

    }

    function mousewheel( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        var delta = 0;

        if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

            delta = event.wheelDelta / 40;

        } else if ( event.detail ) { // Firefox

            delta = - event.detail / 3;

        }

        _mousePosition = _this.getMouseOnScreen(event.clientX, event.clientY);

        _zoomStart.y += delta * 0.01;

        _this.update();
        _this.dispatchEvent(changeEvent);       

    }

    function touchstart( event ) {

        if ( _this.enabled === false ) return;

        switch ( event.touches.length ) {

            case 1:
                _state = STATE.TOUCH_PAN;
                _mousePosition = _this.getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY);                
                _panStart = _panEnd = _mousePosition;
                break;

            case 2:
                _state = STATE.TOUCH_ZOOM;
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );
                _mousePosition = _this.getMouseOnScreen((event.touches[0].pageX + event.touches[1].pageX)/2, (event.touches[0].pageY + event.touches[1].pageY)/2);
                break;

            default:
                _state = STATE.NONE;

        }

    }

    function touchmove( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        switch ( event.touches.length ) {

            case 1:
                _mousePosition = _this.getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY);            
                _panEnd = _mousePosition;
                break;

            case 2:
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                _touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy )
                _mousePosition = _this.getMouseOnScreen((event.touches[0].pageX + event.touches[1].pageX)/2, (event.touches[0].pageY + event.touches[1].pageY)/2);                
                break;                

            default:
                _state = STATE.NONE;

        }

        _this.update();
        _this.dispatchEvent(changeEvent);                

    }

    function touchend( event ) {

        if ( _this.enabled === false ) return;

        switch ( event.touches.length ) {

            case 1:
                _mousePosition = _this.getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY);            
                _panStart = _panEnd = _mousePosition;
                break;

            case 2:
                _touchZoomDistanceStart = _touchZoomDistanceEnd = 0;
                _mousePosition = _this.getMouseOnScreen((event.touches[0].pageX + event.touches[1].pageX)/2, (event.touches[0].pageY + event.touches[1].pageY)/2);
                break;

        }

        _this.update();
        _this.dispatchEvent(changeEvent);        

        _state = STATE.NONE;

    }

    this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );


    this.domElement.addEventListener( 'mousedown', mousedown, false );
    this.domElement.addEventListener( 'mousewheel', mousewheel, false );

    this.domElement.addEventListener( 'touchstart', touchstart, false );
    this.domElement.addEventListener( 'touchend', touchend, false );
    this.domElement.addEventListener( 'touchmove', touchmove, false );



};

THREE.OrthographicZoomAndPanControls.prototype = Object.create( THREE.EventDispatcher.prototype );

var kde_shaders = {

    vertex_shader_through:
        'void main(void) {' +
        '   gl_Position = vec4(position, 1.0);' +
        '}',

    vertex_shader_points:
        'void main(void) {' +
        '   gl_PointSize = 1.0;' +
        '   gl_Position = vec4(position.xy, 0.0, 1.0);' +
        '}',

    fragment_shader_color_mapping:
        'uniform vec2 resolution;' +
        'uniform sampler2D textureDensity;' +
        'uniform sampler2D textureColor;' +
        'void main(void) {' +
        '   float dx = 1.0 / resolution.x;' +
        '   float dy = 1.0 / resolution.y;' +
        '   vec2 uv = gl_FragCoord.xy / resolution.xy;' +
        '   vec2 uvColor = vec2(texture2D(textureDensity, uv).a * 5000.0, 0.5);' +
        '   uvColor.s = floor(uvColor.s * 10.0) / 10.0;' +
        '   gl_FragColor = texture2D(textureColor, uvColor);' +
        '}',

    fragment_shader_vconvolution:
        'uniform vec2 resolution;' +
        'uniform sampler2D textureDensity;' +
        'uniform sampler2D textureKernel;' +
        'const float ungrid = uNGrid;' +
        'void main(void) {' +
        '   vec2 uv = gl_FragCoord.xy / resolution.xy;' +
        '   float step = 1.0 / resolution.y;' +
        '   uv.t -= step * (uNGrid - 1.0) / 2.0;' +
        '   vec2 uvKernel = vec2(0.0, 0.5);' +
        '   float stepKernel = 1.0 / uNGrid;' +
        '   uvKernel.s += stepKernel / 2.0;' +
        '   float sum = 0.0;' +
        '   for (float i = 0.0; i < ungrid; i+=1.0) {' +
            '   sum += texture2D(textureDensity, uv).a * texture2D(textureKernel, uvKernel).a;' +
            '   uv.t += step;' +
            '   uvKernel.s += stepKernel;' +
            '}' +
        '   gl_FragColor = vec4(vec3(1.0), sum);' +
        '}',

    fragment_shader_hconvolution:
        'uniform vec2 resolution;' +
        'uniform sampler2D textureDensity;' +
        'uniform sampler2D textureKernel;' +
        'const float ungrid = uNGrid;' +
        'void main(void) {' +
        '   vec2 uv = gl_FragCoord.xy / resolution.xy;' +
        '   float step = 1.0 / resolution.x;' +
        '   uv.s -= step * (uNGrid - 1.0) / 2.0;' +
        '   vec2 uvKernel = vec2(0.0, 0.5);' +
        '   float stepKernel = 1.0 / uNGrid;' +
        '   uvKernel.s += stepKernel / 2.0;' +
        '   float sum = 0.0;' +
        '   for (float i = 0.0; i < ungrid; i+=1.0) {' +
            '   sum += texture2D(textureDensity, uv).a * texture2D(textureKernel, uvKernel).a;' +
            '   uv.s += step;' +
            '   uvKernel.s += stepKernel;' +
            '}' +
        '   gl_FragColor = vec4(vec3(1.0), sum);' +
        '}'


};


var KDE = function(c, config) {

    var w = config.width,
        h = config.height,
        bandwidth = config.bandwidth,
        k = config.k,
        colors = config.colors,
        canvas = null,
        camera = null,
        cameraRTT =null,
        renderer = null,
        controller = null,
        attentuation = config.attentuation,
        shaders = kde_shaders,
        vConvolutionShaderMaterial = null,
        hConvolutionShaderMaterial = null,
        colorTexture = null,
        scalarColorMappingShaderMaterial = null,
        rectMesh = null,
        rectScene = null,
        rt0 = null,
        rt1 = null,
        sceneMaterial = null,
        data = null, //data store
        o = null,
        dataScene = null; //data transform


    //initialize camera for points
    camera = new THREE.OrthographicCamera(-w/2, w/2, h/2, -h/2, -1000, 1000);
    camera.position = new THREE.Vector3(0, 0, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    //initialize pan and zoom controller
    controller = new THREE.OrthographicZoomAndPanControls(camera, c);

    //initialize camera for rendering to texture
    cameraRTT = new THREE.OrthographicCamera(0, w, h, 0, -100, 100);
    cameraRTT.position = new THREE.Vector3(0, 0, 100);
    cameraRTT.lookAt(new THREE.Vector3(0, 0, 0));

    //initialize renderer
    renderer = new THREE.WebGLRenderer({alpha: true, canvas: c, preserveDrawingBuffer: true});
    renderer.autoClearColor = false;
    renderer.setViewport(0, 0, w, h);

    var setCanvas = function(c) {
        canvas = c;
        canvas.style.width = w / window.devicePixelRatio;
        canvas.style.height = h / window.devicePixelRatio;
        controller.screen.width = w;
        controller.screen.height = h;        
        controller.screen.offsetLeft = canvas.getBoundingClientRect().left;
        controller.screen.offsetTop = canvas.getBoundingClientRect().top;
        canvas.width = w;
        canvas.height = h;
        renderer.domElement = c;
    }

    var setKernel = function(b, k) {

        var n = Math.floor(b * k * 2),
            d = new Float32Array(n * 1);

        var sum = 0.0,
            i = -1,
            ii = d.length;

        while(++i < d.length) {
            d[i] = Math.exp(-Math.pow(i - (ii - 1) / 2, 2) / Math.pow(b, 2) / 2);
            sum += d[i];
        }

        i = -1;
        while(++i < ii) {
            d[i] /= sum;
        }

        kernelTexture = glUtil.generateTexture(d, THREE.AlphaFormat, THREE.FloatType, n, 1);
        kernelTextureWidth = n;

        vConvolutionShaderMaterial.defines.uNGrid = hConvolutionShaderMaterial.defines.uNGrid = n.toFixed(2);

        vConvolutionShaderMaterial.uniforms.textureKernel.value = hConvolutionShaderMaterial.uniforms.textureKernel.value = kernelTexture;

        vConvolutionShaderMaterial.needsUpdate = hConvolutionShaderMaterial.needsUpdate = true;

    };

    var setAttentuation = function(a) {
        attentuation = a;
        sceneMaterial.opacity = attentuation / Math.pow(controller.zoomFactor , 1.5);
        sceneMaterial.needsUpdate = true;
    };


    vConvolutionShaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            resolution: {
                type: "v2",
                value: new THREE.Vector2(w, h)
            },
            textureDensity: {
                type: "t",
                value: null
            },
            textureKernel: {
                type: "t",
                value: null
            }
        },
        defines: {
            uNGrid: 0
        },
        vertexShader: shaders.vertex_shader_through,
        fragmentShader: shaders.fragment_shader_vconvolution,
        transparent: true
    });

    
    hConvolutionShaderMaterial = vConvolutionShaderMaterial.clone();
    hConvolutionShaderMaterial.fragmentShader = shaders.fragment_shader_hconvolution;

    colorTexture = glColor.getColorTextureHSLInterpolated(colors[0],colors[1]);

    scalarColorMappingShaderMaterial = hConvolutionShaderMaterial.clone();
    scalarColorMappingShaderMaterial.uniforms.textureColor =  {type: "t", value: colorTexture};
    scalarColorMappingShaderMaterial.fragmentShader = shaders.fragment_shader_color_mapping;


    //rectangular area for drawing densitymap
    rectMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xFFFFFF}));
    rectScene = new THREE.Scene();
    rectScene.add(rectMesh);

    //render targets
    rt0 = glUtil.getRenderTarget(w, h, THREE.RGBAFormat, THREE.FloatType);
    rt1 = rt0.clone();

    //render material attributes
    sceneMaterial =  new THREE.ParticleBasicMaterial({
        color: 0xFFFFFF,
        size: 1,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        sizeAttenuation: false,
        opacity: attentuation,
        transparent: true
    });


    var renderAccumulate = function(scene, output) {
        renderer.render(scene, camera, output, true);
    };

    var renderVConvolution = function(input, output) {
        rectMesh.material = vConvolutionShaderMaterial;
        vConvolutionShaderMaterial.uniforms.textureDensity.value = input;
        renderer.render(rectScene, cameraRTT, output, true);
    };

    var renderHConvolution = function(input, output) {
        rectMesh.material = hConvolutionShaderMaterial;
        hConvolutionShaderMaterial.uniforms.textureDensity.value = input;
        renderer.render(rectScene, cameraRTT, output, true);
    };

    var renderColorMap = function(input, output) {
        rectMesh.material = scalarColorMappingShaderMaterial;
        scalarColorMappingShaderMaterial.uniforms.textureDensity.value = input;
        renderer.render(rectScene, cameraRTT, output, true);
    };


    var render = function(scene) {

        renderer.clear(true, true, true);

        renderAccumulate(scene, rt0);

        renderVConvolution(rt0, rt1);
        renderer.clearTarget(rt0, true, true, true);

        renderHConvolution(rt1, rt0);
        renderer.clearTarget(rt1, true, true, true);

        renderColorMap(rt0, null); //direct render to screen
        
    };


    var clear = function() {
        renderer.clear(true, true, true);
        renderer.clearTarget(rt1, true, true, true);
        renderer.clearTarget(rt0, true, true, true);
    };

    
    this.setCanvas = setCanvas;
    this.setKernel = setKernel;
    this.setAttentuation = setAttentuation;

    this.render = render;
    this.clear = clear;

    var drawData = function(_data, _o) {

        data = _data;
        o = _o;

        var pts = new THREE.Geometry();

        var i = -1;
        while(++i < data.length) 
        {
            var pX = (data[i][0] - o.d0[0]) * o.sx + o.x0,
                pY = (data[i][1] - o.d0[1]) * o.sy + o.y0,
                pZ = 0,
                pt = new THREE.Vector3(pX, pY, pZ);

            pts.vertices.push(pt);
        }

        var ptkSys = new THREE.ParticleSystem(pts, sceneMaterial);

        dataScene = new THREE.Scene();
        dataScene.add(ptkSys);

        render(dataScene);
    }

    //redrow figure without updating the scene
    var reDraw = function(){
        clear();
        render(dataScene);
    }

    this.drawData = drawData;
    this.reDraw = reDraw;

    controller.addEventListener('change', function() {
        sceneMaterial.opacity = attentuation / Math.pow(controller.zoomFactor , 1.5);
        sceneMaterial.needsUpdate = true;
        reDraw();
    });

    setCanvas(c);
    setKernel(bandwidth, k);

};



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