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
