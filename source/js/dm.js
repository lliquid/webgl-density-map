

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


