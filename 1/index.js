// Credit: 
// 
// based on https://github.com/stspanho/aframe-hit-test/ but simplified
// this was in turn based on Klaus Weidner's Spinosaurus example: see
// https://xr-spinosaurus.glitch.me/
//
// Also used Mozilla docs to figure out a few things

import 'aframe';

AFRAME.registerComponent('ar-hit-test', {
    init: function() {
        this.makeNull();

        // when session ends set everything to null
        this.el.sceneEl.renderer.xr.addEventListener('sessionend', this.makeNull.bind(this));

        // When the session starts...
        this.el.sceneEl.renderer.xr.addEventListener('sessionstart', e=> {
            // Get the XRSession
            let xrSession = this.el.sceneEl.renderer.xr.getSession();

            // When a user selects something (a detected plane) the select
            // event will fire
            xrSession.addEventListener('select', xrInputSourceEvent => {
                console.log(`selected...`);

                // Get the current frame
                const frame = xrInputSourceEvent.frame;

                // Get the hit test results. This needs an XRHitTestSource, 
                // which is initialised below
                const hitTestResults = frame.getHitTestResults(this.xrHitTestSource);
                console.log(`hit test results length: ${hitTestResults.length}`);

                // We need coordinates relative to a given space
                // The floor space is relative to our mapped world (-z will
                // be in front of the camera at the point the world started
                // being mapped)  while the viewer space is relative to our 
                // current view of it. We want to place the dino in floor
                // (world) space.
                // Note the dino will be placed on the plane nearest to the
                // CENTRE of the screen as this is where the ray is projected
                // from.
                const space = this.floorSpace;

                // Make sure there are hit test results and the space has been
                // intiialised
                if(hitTestResults.length > 0 && space) {
                    console.log('have hit(s) and a floor space');

                    // get the pose of the hit (position and orientation
                    // relative to a given space)
                    const pose = hitTestResults[0].getPose(space);
                    let pos = pose.transform.position;
                    console.log('POSITION from pose (floor space...):');
                    console.log(pos);


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
                }
            });

            // Obtain the viewer reference space and hit test source
            // (hits are obtained from viewer space) 
            xrSession.requestReferenceSpace('viewer').then( space => {
                console.log('GOT VIEWER SPACE...');
                this.viewerSpace = space;
                xrSession.requestHitTestSource({space: this.viewerSpace})
                    .then(hitTestSource => {
                        console.log('GOT HIT TEST SOURCE...');
                        this.xrHitTestSource = hitTestSource;
                    });
            });

            // Obtain floor space
            xrSession.requestReferenceSpace('local-floor').then( space => {
                this.floorSpace = space;
            });
        })
    },

                        
    makeNull: function() {
        this.xrHitTestSource = null;
        this.viewerSpace = null;
        this.floorSpace = null;
    }
});
