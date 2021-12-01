// Credit: 
// 
// based on https://github.com/stspanho/aframe-hit-test/ but simplified
// this was in turn based on Klaus Weidner's Spinosaurus example: see
// https://xr-spinosaurus.glitch.me/
//
// Also used Mozilla docs to figure out a few things

import 'aframe';
//
AFRAME.registerComponent('ar-hit-test', {
    init: function() {
        this.makeNull();

        // when session ends set everything to null
        this.el.sceneEl.renderer.xr.addEventListener('sessionend', this.makeNull.bind(this));

        // When the session starts...
        this.el.sceneEl.renderer.xr.addEventListener('sessionstart', e=> {
            // Get the XRSession
            this.xrSession = this.el.sceneEl.renderer.xr.getSession();

            // When a user selects something (a detected plane) the select
            // event will fire
            this.xrSession.addEventListener('select', xrInputSourceEvent => {
                const pos = this.el.getAttribute('position');
            
                // Set dino to this position
                document.getElementById('dino').setAttribute('position' , {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z
                    });

                // Shine light on dino
                document.getElementById('light').setAttribute('position',{
                    x: pos.x-2,
                    y: pos.y+4,
                    z: pos.z+2
                });
            });

            // Obtain the viewer reference space and hit test source
            // (hits are obtained from viewer space) 
            this.xrSession.requestReferenceSpace('viewer').then( space => {
                console.log('GOT VIEWER SPACE...');
                this.viewerSpace = space;
                this.xrSession.requestHitTestSource({space: this.viewerSpace})
                    .then(hitTestSource => {
                        console.log('GOT HIT TEST SOURCE...');
                        this.xrHitTestSource = hitTestSource;
                    });
            });

            // Obtain floor space
            this.xrSession.requestReferenceSpace('local-floor').then( space => {
                this.floorSpace = space;
            });
        })
    },

    
    tick: function() {
        if(!this.el.sceneEl.is('ar-mode') || !this.viewerSpace) return;
        if(this.xrSession && this.el.sceneEl.frame && this.floorSpace && this.xrHitTestSource) {
            const frame = this.el.sceneEl.frame;
            // Get hit test results from a ray projected from the centre of the screen
            const hitTestResults = frame.getHitTestResults(this.xrHitTestSource);
            console.log(`Hit test results length ${hitTestResults.length}`);

            // If we have any...
            if(hitTestResults.length > 0) {
                // Get pose and position, as the first example
                const pose = hitTestResults[0].getPose(this.floorSpace);
                
                const position = {
                    x: pose.transform.position.x,
                    y: pose.transform.position.y,
                    z: pose.transform.position.z
                };
            
    
                // Set the reticle's position to the hit position
                this.el.setAttribute('position', position);
                console.log('using quaternion...');
                this.el.object3D.quaternion.copy(pose.transform.orientation); // https://ada.is/basketball-demo/ar-components.js
                // this.el.object3D.matrix.copy(pose.transform.matrix);
                // this.el.object3D.matrixAutoUpdate = false;
            }
        }
    },
                        
    makeNull: function() {
        this.xrHitTestSource = null;
        this.viewerSpace = null;
        this.floorSpace = null;
        this.xrSession = null;
    }
});
