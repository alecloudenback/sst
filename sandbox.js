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
    this.headingLeft = headingLeft;
    this.currentSegment = curSeg;
    this.capacity = 500;
    this.tick = function() {

    }
    this.travel = function{
        if (this.currentSegment.left.hasTrain) {
            // Don't proceed
        } else if (this.currentSegment instanceof Track) {
            // continue traveling along the track
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

    this.trainEnter() {
        this.hasTrain = true;
    }

    this.trainExit() {
        this.hasTrain = false;
    }
}

// Track
// A track is a distance that the train must travel in between stations
function Track(len) {
    this.length = len;
}

// Terminus
// A terminus is a where the train switches direction
function Terminus() {

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
}

// Run the model

mbta = new World();
mbta.addToRoute(new Track(1000));
mbta.addToRoute(new Platform());
mtbta.generateTrains(1);
