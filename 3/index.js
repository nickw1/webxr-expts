// Credit: 
// 
// Basic WebXR based on https://github.com/stspanho/aframe-hit-test/ which 
// was in turn based on Klaus Weidner's Spinosaurus example: see
// https://xr-spinosaurus.glitch.me/
//
// Also used Mozilla docs to figure out a few things

import 'aframe';

// This example is an attempt to cast rays downwards from arbitrary objects
// (three cubes). The rationale is to try and apply markerless AR to a 
// geographic AR use case, where geodata (e.g. POIs)  might be downloaded from a
// geodata server and we want to nicely position this content on the ground.
//
// Not fully working yet. Sometimes detects a plane but generally seems to be
// above the cube!
AFRAME.registerComponent('ar-hit-test', {
    init: function() {
        this.makeNull();
        this.objectHitTestSource = [null,null,null];

        // when session ends set everything to null
        this.el.sceneEl.renderer.xr.addEventListener('sessionend', this.makeNull.bind(this));

        // When the session starts...
        this.el.sceneEl.renderer.xr.addEventListener('sessionstart', e=> {
            // Get the XRSession
            this.xrSession = this.el.sceneEl.renderer.xr.getSession();

            // Obtain the viewer reference space and hit test source
            // (hits are obtained from viewer space) 
            this.xrSession.requestReferenceSpace('viewer').then( space => {
                this.viewerSpace = space;
            });

            // Obtain floor space
            console.log('Getting local-floor space...');
            this.xrSession.requestReferenceSpace('local-floor').then( space => {
                this.floorSpace = space;
                console.log('Got local-floor space...');
                // Create three hit test sources for our three cube objects.
                // Each casts a ray in floor space from the cube location,
                // pointing downwards. The hope is that we can detect the floor
                // below the cube, and then position the cube appropriately.
                for(let i=0; i<3; i++) {
                    this.xrSession.requestHitTestSource({
                        space: this.floorSpace, 
                        offsetRay: new XRRay({
                                x:0, y:1, z:-i-1, w:1
                            },{
                                x:0, y:-1, z:0, w:0
                            }
                        )
                    })
                    .then(hitTestSource => {
                        console.log(`GOT OBJECT HIT TEST SOURCE ${i} at z ${-i-1}`);
                        this.objectHitTestSource[i] = hitTestSource;
                    });
                }
            });
        })
    },

    
    tick: function() {
        if(!this.el.sceneEl.is('ar-mode') || !this.viewerSpace) return;
        if(this.xrSession && this.el.sceneEl.frame && this.floorSpace) {
            const frame = this.el.sceneEl.frame;
            // Loop through all our hit test sources defined above...
            for(let i=0; i<3; i++) {
                if(this.objectHitTestSource[i]) {
                    // Try and get hit test results
                    const objectHitTestResults = frame.getHitTestResults(this.objectHitTestSource[i]);
                    if(objectHitTestResults.length > 0) {
                        // If we do...
                        const pose1 = objectHitTestResults[0].getPose(this.floorSpace);
                        console.log(`**** Object hit test results for hit test source ${i}`);
                        console.log(pose1.transform.position);
                        document.getElementById(`box${i}`).setAttribute('position', {
                            x: pose1.transform.position.x,
                            y: pose1.transform.position.y + 0.125, // cube should rest on ground
                            z: pose1.transform.position.z
                        });
                        this.objectHitTestSource[i] = null; // no longer needed, we do one hit test per cube
                    }
                }
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
