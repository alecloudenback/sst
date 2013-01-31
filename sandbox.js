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
function Train(curSeg, headingLeft) {
    stationWaitTime = 90; // the default time to wait at a station, in seconds

    this.speed = 80000; // in meters/hour
    this.headingLeft = headingLeft;
    this.currentSegment = curSeg;
    this.distanceOnTrack = 0;
    this.timeInStation = stationWaitTime; // start with 90 seconds in station
    this.nextSegment - function() {
        if (this.headingLeft) {
            return this.currentSegment.left;
        } else {
            return this.currentSegment.right;
        }
    }
    this.capacity = 500;
    this.tick = function() {
        if (this.currentSegment instanceof Station ) {
        // if in station, continue station procedures
        this.stationProcedures();
        } else {
        // otherwise travel
        this.travel();
        }

    }


    this.stationProcedures = function() {
        if (this.timeInStation === 0) {
            this.timeInStation = stationWaitTime;
            this.distanceOnTrack = 0;
            this.travel();
        } else {
            this.timeInStation--;
        }

    }

    this.travel = function() {
        console.log("train on ", this.currentSegment, " traveling to ", this.nextSegment);
        if (this.currentSegment.left.hasTrain) {
                // Don't proceed
            } else if (this.currentSegment instanceof Terminus) {
                // switch directions
                this.headingLeft = !this.headingLeft;
            } else if (this.currentSegment instanceof Track) {
                if (this.currentSegment.length - this.speed / 60 / 60 < 0) {
                    this.currentSegment.trainExit();
                    this.currentSegment = this.nextSegment();
                }
                this.distanceOnTrack += this.distanceOnTrack + this.speed / 60 / 60;
            } else if (this.currentSegment instanceof Station) {
                // leave station
                this.currentSegment = this.nextSegment();
            } else {
                console.log("Error in train routing:", this);
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

// Route
// A route is one of: a RouteSegment, a Terminus
function RouteSegment(here, left, right) {
    this.here = here; // The first here should be a platform
    this.hasTrain = false;
    this.left = left;
    this.right = right;

    // insertSegment(RouteSegment)
    // Insert a RouteSegment, seg, to the left of the leftmost location
    this.insertSegment = function(type) {
        oldleft = this.left;
        this.left = new RouteSegment(type,oldleft,this);
    }

    this.trainEnter = function() {
        this.hasTrain = true;
    }

    this.trainExit = function() {
        this.hasTrain = false;
    }

    this.leftMost = function() {
        if (this instanceof Terminus && this.right) {
            // segment is a terminus and has something to right -> is leftmost
            return this;
        } else {
            // segment is not terminus and should look leftward
            return this.left.leftMost();
        }
    }
    this.rightMost = function() {
        if (this instanceof Terminus && this.left) {
            // segment is a terminus and has something to right -> is leftmost
            return this;
        } else {
            // segment is not terminus and should look leftward
            return this.left.rightMost();
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
// A terminus is a where the train switches direction and is a subclass of Station
function Terminus() {
 this.prototype = Station;
}


// World
// A place to keep track of all of the objects
function World() {
    this.passengers = [];
    this.line = new RouteSegment(new Platform(),new Terminus(),new Terminus());
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
    this.generateTrains = function(num) {
        for (i = num; i > 0; i--) {
            this.trains.push(new Train());
        }
    }
    this.addToRoute = function(location) {
        this.line.insertSegment(location);
    }

    this.bigBang = function() {
        // Begin ticking the world
        for (i = 3600; i > 0; i--) {
            this.tick();
        }
    }
}

// Run the model

mbta = new World();
mbta.addToRoute(new Track(1000));
mbta.addToRoute(new Station());
mbta.generateTrains(1);
console.log(mbta.trains);
mbta.bigBang();
