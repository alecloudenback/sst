// platform
function Platform(station, leftBound) {
    this.queue = [];
    this.leftBound = leftBound;
    this.station = station;
    this.tickCount = 0; // keep track to allow time-dependent passenger creation
    this.push = function(person) {
        return this.queue.push(person);
    };
    this.pop = function() {
        return this.queue.pop();
    };

    // make the passengers board the given train
    this.board = function(train) {
        // determine how many passengers can board given train
        cap = train.passengerSpace();

        // pop the fitting number of passengers off of the queue
        boardingPassengers = [];
        while (cap > 0 && this.queue.length > 0) {
            boardingPassengers.push(this.pop());
            cap--;
        }

        // pass the boarding passengers to the train
        train.board(boardingPassengers);

    }

    this.tick = function() {
        // generate passengers to enter the queue
        this.generatePassengers();

        // tick the passengers
        for (i = this.queue.length - 1 ; i >= 0; i--) {
            this.queue[i].tick();
        }
        this.tickCount += 1;
    }

    // return array of wait times in ticks
    this.waitTimes = function() {
        waits = [];
        for (i = this.queue.length - 1 ; i >= 0; i--) {
            waits.push(this.queue[i].waitTime);
        }
        return waits;
    }

    // generatePassengers creates a number of passengers and inserts them into the queue based on the platform's Poisson process
    this.generatePassengers = function() {

        // if this is the last platform in a given direction, don't generate passengers
        if (this.station.routeSeg === this.station.routeSeg.leftMost() && this.leftBound ) {
            // platform is leftmost and is left bound
            return;
        } else if (this.station.routeSeg === this.station.routeSeg.rightMost() && !this.leftBound ) {
            // platform is rightmost and is right bound
            return;

        } else {
            // process governing passener creation
            if (this.tickCount % 3 === 0) {
            this.push(new Passenger());
            }
            return;
        }
    }
}

// Passenger
function Passenger() {

    this.waitTime = 0;
    this.Clock = new Clock();
    this.enter = function(place) {
        if (place instanceof Platform) {
            place.push(this);
        } else if (place instanceof Train) {
            // Decide where to get off next
        } else {
            // error
            console.log("Error in passenger entering place.");
        }
    }

    this.gettingOff = function(Station) {
        // eventually could decide if this is the station they want to get off at
        // for now, return true each time
        return true;
    }

    this.tick = function() {
        this.waitTime += 1;
    }


}

// Train
function Train(startSeg, leftBound) {

    this.passengers = []; // an array to hold the passengers on the train

    stationWaitTime = 5; // the default time to wait at a station, in seconds
    this.speed = 80000; // in meters/hour
    this.capacity = 500;

    this.leftBound = leftBound;
    this.currentSegment = startSeg;
    this.boarded = false;
    this.distanceOnTrack = 0;
    this.timeInStation = stationWaitTime; // how long the train should stay in station, seperate so as to not over-write original setting


    this.nextSegment = function() {
        if (this.leftBound) {
            return this.currentSegment.left;
        } else {
            return this.currentSegment.right;
        }
    }
    this.tick = function() {
        if (this.currentSegment.kind instanceof Station ) {
            // if in station, continue station procedures
            this.stationProcedures();
        } else {
            // otherwise travel
            this.travel();
        }

    }

    // return how many more passengers can fit
    this.passengerSpace = function() {
        return this.capacity - this.passengers.length;
    }


    // return array of the passengers that are getting off
    this.disembark = function(station) {
        exitingPassengers = [];
        remainingPassengers = [];

        // put passengers in their appropriate place
        for (i = this.passengers.length - 1; i >= 0; i--) {
            if (this.passengers[i].gettingOff(station)) {
                exitingPassengers.push(this.passengers[i]);
            } else {
                remainingPassengers.push(this.passengers[i]);
            }
        }

        // set those still on the train as the remaining passengers
        this.passengers = remainingPassengers;
        return exitingPassengers;
    }

    // take the passengers getting on and decide how long it will take to board them
    this.board = function(pass) {
        delayTime = .0003 * pass.length^2 + 20 ; // chosen to have a baseline of 20 seconds for stop, with a max of ~1.5 minutes if 500 passengers getting on

        stationWaitTime += delayTime;

        this.passengers = this.passengers.concat(pass); // add the boarding passengers to list of those already onboard
    }


    this.stationProcedures = function() {
        if (!this.boarded) {
            // initiate unload/unload procedure
            this.currentSegment.here.arrive(this);

            if (this.leftBound) {
            direction = "left";
            } else {
                direction = "right";
            }
            console.log("train heading", direction, " with ", this.passengers.length, " passengers");
            this.boarded = true;
        }

        if (this.timeInStation < 1) {
            // time for the train to leave the station
            this.timeInStation = stationWaitTime;
            this.distanceOnTrack = 0;
            this.boarded = false;
            this.travel();

        } else {
            this.timeInStation--;
        }

    }

    this.travel = function() {
        // console.log("train on ", this.currentSegment, " traveling to ", this.nextSegment(), " with ", this.currentSegment.kind.length - this.distanceOnTrack, "m to go.");
        headingLeft = this.leftBound;
        if (this.nextSegment().hasTrain(headingLeft)) {
                // Don't proceed
            } else if (this.currentSegment.kind instanceof Track) {
                if (((this.currentSegment.kind.length - this.distanceOnTrack) - this.speed / 60 / 60) < 0) {
                    this.currentSegment.trainExit(headingLeft);
                    this.currentSegment = this.nextSegment();
                }
                this.distanceOnTrack +=  this.speed / 60 / 60;
            } else if (this.currentSegment.kind instanceof Station) {
                // leave station
                this.currentSegment = this.nextSegment();
                this.currentSegment.trainEnter(headingLeft);
            } else {
                console.log("Error in train routing:", this);
            }

            if (this.nextSegment() instanceof Terminus) {
                // switch directions
                this.leftBound = !this.leftBound;
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

    // tick the route forward in time
    this.tick = function() {
        cur = this.leftMost;
        while (!(cur instanceof Terminus) || !cur) {
            cur.tick();
            cur = cur.right;
        }
    }
}

// Route
// A route is one of: a RouteSegment, a Terminus
function RouteSegment(here, left, right) {
    this.here = here; // The first here should be a platform
    this.hasLeftBoundTrain = false;
    this.hasRightBoundTrain = false;
    this.left = left || new Terminus(); // set as terminus if not provided
    this.right = right || new Terminus(); // set as terminus if not provided
    this.kind = this.here;
    here.addParentSegment(this);

    this.trainEnter = function(left) {
        if (left) {
        this.hasLeftBoundTrain = true;
        } else {
            this.hasRightBoundTrain = true;
        }
    }

    this.trainExit = function(left) {
        if (left) {
        this.hasLeftBoundTrain = false;
        } else {
            this.hasRightBoundTrain = false;
        }
    }

    this.hasTrain = function(left) {
        if (left) {
            return this.hasLeftBoundTrain;
        } else {
            return this.hasRightBoundTrain;
        }
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

    // pass the tick onto this node's location
    this.tick = function() {
        this.here.tick();
    }
}

// Track
// A track is a distance that the train must travel in between stations
function Track(len) {
    this.length = len;

    this.tick = function() {
        // do nothing
    }

    this.addParentSegment = function(seg) {
        this.routeSeg = seg;
    }

}

// Station
// A Station is where passengers may board and exit the train
function Station() {
    this.leftBoundPlatform = new Platform(this, true);
    this.rightBoundPlatform = new Platform(this, false);

    // arrive takes a train and initiates procedures to make passengers get off and board the train
    this.arrive = function(train) {

        // disembark passengers off train
        ////////////////

        passengers = train.disembark(this); // An array of the passengers exiting



        // make passengers waiting on platform board train
        /////////////


        if (train.leftBound) {
            // board passengers on leftBound Platform
            this.leftBoundPlatform.board(train);
        } else {
            // //board passengers on rightBound Platform
            this.rightBoundPlatform.board(train);
        }
    }

    this.tick = function() {

        // tick each platform
        this.leftBoundPlatform.tick();
        this.rightBoundPlatform.tick();

        //display queue info
        if (this.leftBoundPlatform.queue.length > 0) {
        console.log("Left-bound platform has ", this.leftBoundPlatform.queue.length, " passengers waiting. Average wait time is ", meanArray(this.leftBoundPlatform.waitTimes()));

        } else {
        console.log("Right-bound platform has ", this.rightBoundPlatform.queue.length, " passengers waiting. Average wait time is ", meanArray(this.rightBoundPlatform.waitTimes()));
        }
    }

    this.addParentSegment = function(seg) {
        this.routeSeg = seg;
    }

}

// Terminus
// A Terminus is a the area past the last station on a side
// Functions as 'null'
function Terminus() {

}

// Useful functions
function sumArray(arr) {
    sum = 0;
    for (var i = 0, len = arr.length; i < len; i++) {
        sum += arr[i];
    }

    return sum;
}

function meanArray(arr) {
    sum = sumArray(arr);
    return sum/arr.length;
}

function progress(percent)
{
     $("#progressbar").progressbar({value: Math.round((percent*100))});
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

        // tick the stations
        this.line.tick();

        // tick the trains
        for (i = this.trains.length - 1 ; i >= 0; i--) {
            this.trains[i].tick();
        }



    }
    this.generatePassengers = function(num) {

        //create passengers
        for (i = num; i > 0; i--) {
            this.passengers.push(new Passenger());
        }

        // assign passengers to  a platform

        for (i = this.passengers.length -   1; i >= 0; i--) {

        }
    }
    this.generateTrains = function(numleft, numright) {
        for (i = numleft; i > 0; i--) {
            this.trains.push(new Train(this.line.leftMost,false));
        }
    }

}

// Run the model
$(document).ready(function(){


    sst = new World();


    // build the route right to left
    sst.line.insertBeginning(new RouteSegment(new Station()));
    sst.line.insertBeginning(new RouteSegment(new Track(1000)));
    sst.line.insertBeginning(new RouteSegment(new Station()));

    // generate trains
    sst.generateTrains(1);

    // Begin ticking the world
    totalTicks = 20 * 60 * 60;

    for (t = 0; t <= totalTicks ; t++) {


        //tick the world forward
        sst.tick();

        // Time dependent behaviors
        /////////////////////////////

        // after 90 ticks, add another train
        if (t === 45) {
            console.log("adding second train");
            sst.generateTrains(1);
        }

    }
});

