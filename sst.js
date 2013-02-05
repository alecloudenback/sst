// platform
function Platform(name) {
    this.name = name || "";
    this.queue = [];
    this.push = function(person) {
        return this.queue.push(person);
    };
    this.pop = function() {
        return this.queue.pop();
    };
}

// passenger
function Passenger() {
    this.destination = "";
    this.waiting = false;
    this.countDown = 0;
    this.Clock = new Clock();
    this.enter = function(place) {
        if (place instanceof Platform) {
            place.push(this);
        } else if (place instanceof Train) {

        } else {
            // error
        }
    }
}

// Train
function Train(startSeg, headingLeft) {
    stationWaitTime = 5; // the default time to wait at a station, in seconds

    this.speed = 80000; // in meters/hour
    this.headingLeft = headingLeft;
    this.currentSegment = startSeg;
    this.distanceOnTrack = 0;
    this.timeInStation = stationWaitTime; // start with 90 seconds in station
    this.nextSegment = function() {
        if (this.headingLeft) {
            return this.currentSegment.left;
        } else {
            return this.currentSegment.right;
        }
    }
    this.capacity = 500;
    this.tick = function() {
        if (this.currentSegment.kind instanceof Station ) {
        // if in station, continue station procedures
        this.stationProcedures();
        } else {
        // otherwise travel
        this.travel();
        }

    }


    this.stationProcedures = function() {
        console.log("train in ", this.currentSegment, " for ", this.timeInStation, " more ticks before going to", this.nextSegment());
        if (this.timeInStation === 0) {
            this.timeInStation = stationWaitTime;
            this.distanceOnTrack = 0;
            this.travel();
        } else {
            this.timeInStation--;
        }

    }

    this.travel = function() {
        console.log("train on ", this.currentSegment, " traveling to ", this.nextSegment(), " with ", this.currentSegment.kind.length - this.distanceOnTrack, "m to go.");
        if (this.nextSegment().hasTrain) {
                // Don't proceed
            } else if (this.currentSegment.kind instanceof Track) {
                if (((this.currentSegment.kind.length - this.distanceOnTrack) - this.speed / 60 / 60) < 0) {
                    this.currentSegment.trainExit();
                    this.currentSegment = this.nextSegment();
                }
                this.distanceOnTrack +=  this.speed / 60 / 60;
            } else if (this.currentSegment.kind instanceof Station) {
                // leave station
                this.currentSegment = this.nextSegment();
            } else {
                console.log("Error in train routing:", this);
            }

            if (this.nextSegment() instanceof Terminus) {
                // switch directions
                this.headingLeft = !this.headingLeft;
            }
        }

}

// Clock
// An object that govern's a passenger's time at a destination
function Clock(mu, sigma) {
    this.mu = mu || 0;
    this.sigma = sigma || 1;
    this.rnorm = function() {

        // use a Box-Muller transform to generate a random normal
        u1 = Math.random();
        u2 = Math.random();

        stdNorm = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
        return this.mu + this.sigma * stdNorm;
    }
    this.stayLength = function() {
        return this.rnorm();
    }
}

function Route(leftMost, rightMost) {
    //both should be stations
    this.leftMost = leftMost;
    this.rightMost = rightMost;

    // insertAfter(RouteSegment, RouteSegment )
    // Insert a RouteSegment, seg, to the left of the leftmost location
    this.insertAfter = function(seg, newSeg) {
        newSeg.left = seg;
        newSeg.right = seg.right;

        if (seg.right instanceof Terminus) {
            this.rightMost = newSeg;
        } else {
            seg.right.left = newSeg;
        }
    }

    // insertAfter(RouteSegment, RouteSegment )
    // Insert a RouteSegment, seg, to the left of the leftmost location
    this.insertBefore = function(seg, newSeg) {
        newSeg.left = seg.left;
        newSeg.right = seg;

        if (seg.left instanceof Terminus) {
            this.leftMost = newSeg;
            seg.left = newSeg;
        } else {
            seg.left.right = newSeg;
        }
    }

    // insertBeginning(first node)
    // Insert the first item into the Route
    this.insertBeginning = function(newSeg) {
        if (this.leftMost instanceof Terminus || !this.leftMost) {
            this.leftMost = newSeg;
            this.rightMost = newSeg;
            newSeg.left = new Terminus();
            newSeg.right = new Terminus();
        } else {
            this.insertBefore(this.leftMost,newSeg);
        }
    }

    // print route
    this.printRoute = function() {
        // print left to right
        console.log("-------- left to right ----");
        cur = this.leftMost;
        while (!(cur instanceof Terminus) || !cur) {
            console.log(cur.kind);
            cur = cur.right;
        }
        console.log("------- right to left ----");

        // print right to left
        cur = this.rightMost;
        while (!(cur instanceof Terminus) || !cur) {
            console.log(cur.kind);
            cur = cur.left;
        }
    }
}

// Route
// A route is one of: a RouteSegment, a Terminus
function RouteSegment(here, left, right) {
    this.here = here; // The first here should be a platform
    this.hasTrain = false;
    this.left = left || new Terminus(); // set as terminus if not provided
    this.right = right || new Terminus(); // set as terminus if not provided
    this.kind = this.here;


    this.trainEnter = function() {
        this.hasTrain = true;
    }

    this.trainExit = function() {
        this.hasTrain = false;
    }

    this.leftMost = function() {
        if (this.left instanceof Terminus) {
            // if left is terminal, stop
            return this;
        } else {
            return this.left.leftMost();
        }
    }
    this.rightMost = function() {
        if (this.right instanceof Terminus) {
            // if right is terminal, stop
            return this;
        } else {
            return this.right.rightMost();
        }
    }

    this.isTerminus = function() {
        if (this.leftMost() === this || this.rightMost() === this) {
            // station is Terminus
            return true;
        } else {
            return false;
        }
    }
}

// Track
// A track is a distance that the train must travel in between stations
function Track(len) {
    this.length = len;
}

// Station
// A Station is where passengers may board and exit the train
function Station() {
    this.leftPlatform = new Platform();
    this.rightPlatform = new Platform();
}

// Terminus
// A Terminus is a the area past the last station on a side
// Functions as 'null'
function Terminus() {

}

// World
// A place to keep track of all of the objects
function World() {
    this.passengers = [];
    // A World starts with a Station
    this.line = new Route();
    this.trains = [];
    this.tickCount = 0;
    this.tick = function() {
        //tick the world forward
        for (i = this.trains.length - 1 ; i >= 0; i--) {
            this.trains[i].tick();
        }
    }
    this.generatePassengers = function(num) {
        for (i = num; i > 0; i--) {
            this.passengers.push(new Passenger());
        }
    }
    this.generateTrains = function(numleft, numright) {
        for (i = numleft; i > 0; i--) {
            this.trains.push(new Train(this.line.leftMost,false));
        }
    }

    this.bigBang = function() {
        // Begin ticking the world
        for (t = 90; t > 0; t--) {
            this.tick();
            // console.log(t,this);
        }
    }
}

// Run the model

mbta = new World();


// build the route right to left
mbta.line.insertBeginning(new RouteSegment(new Station()));
mbta.line.insertBeginning(new RouteSegment(new Track(1000)));
mbta.line.insertBeginning(new RouteSegment(new Station()));

// generate trains
mbta.generateTrains(1);

// begin simulation
mbta.bigBang();