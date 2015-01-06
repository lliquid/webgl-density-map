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



