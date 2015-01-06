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