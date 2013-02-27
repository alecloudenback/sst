// platform
function Platform(station, leftBound) {
    this.queue = [];
    this.leftBound = leftBound;
    this.station = station;
    this.tickCount = 0; // keep track to allow time-dependent passenger creation
    this.waitTimes = []; // array of current time spent waiting

    this.lambda = function() {
        return 600;
    }

    this.push = function(person) {
        return this.queue.push(person);
    };


    // make the passengers board the given train
    this.board = function(train) {
        // determine how many passengers can board given train
        cap = train.passengerSpace();

        // take the fitting number of passengers off of the queue
        boardingPassengers = this.queue.slice(0,cap-1);
        this.queue = this.queue.slice(cap, this.queue.length)


        // pass the boarding passengers to the train
        train.board(boardingPassengers);

    }

    this.tick = function() {
        // generate passengers to enter the queue
        this.generatePassengers();

        //reset wait times
        this.waitTimes = [];

        // tick the passengers
        for (i = 0, len = this.queue.length; i < len; i++) {
            this.waitTimes.push(this.tickCount - this.queue[i].creationTime);
        }
        if (len === 0) {
            this.waitTimes.push(0); // return wait of 0 if no passengers
        }
        this.tickCount += 1;
    }

    // generatePassengers creates a number of passengers and inserts them into the queue based on the platform's Poisson process
    this.generatePassengers = function() {
        // if this is the last platform in a given direction, don't generate passengers
        if (this.station.routeSeg === this.station.routeSeg.leftMost().right && this.leftBound ) {
            // platform is leftmost and is left bound
            return;
        } else if (this.station.routeSeg === this.station.routeSeg.rightMost().left && !this.leftBound ) {
            // platform is rightmost and is right bound
            return;

        } else {
            // process governing passener creation
            if (Math.random() < this.lambda() / (60 * 60)) { // assumes hourly lambda
                this.push(new Passenger(this.tickCount));
            }
            return;
        }
    }
}

// Passenger
function Passenger(tick) {

    this.creationTime = tick;
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



}

// Train
function Train(startSeg, leftBound) {

    this.passengers = []; // an array to hold the passengers on the train

    this.pauseTicks = 0; // the default time to wait at a location, in ticks
    this.speed = 60000; // in meters/hour
    this.capacity = 500;

    this.leftBound = leftBound;
    this.currentSegment = startSeg;
    this.boarded = false;
    this.ready = true;
    this.distanceOnTrack = 0;
    this.currentProcedure = null;


    this.nextSegment = function() {
        if (this.leftBound) {
            return this.currentSegment.left;
        } else {
            return this.currentSegment.right;
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

        //make train wait based on number of passengers getting off
        this.pauseTicks += .0002 * exitingPassengers.length^2;

        return exitingPassengers;
    }

    // take the passengers getting on and decide how long it will take to board them
    this.board = function(pass) {
        this.pauseTicks += .0003 * pass.length^2 + 20 ; // chosen to have a baseline of 20 seconds for stop, with a max of ~1.5 minutes if 500 passengers getting on

        this.passengers = this.passengers.concat(pass); // add the boarding passengers to list of those already onboard
    }


    this.stationProcedures = function() {
        if (!this.boarded) {
            // initiate unload/unload procedure
            this.currentSegment.here.arrive(this); // station will tell train how long to wait

            // console.log("train heading", direction, " with ", this.passengers.length, " passengers");
            this.boarded = true;
        }
        console.log("waiting for ", this.pauseTicks)
        if (this.pauseTicks < 1) {
            // time for the train to leave the station
            this.distanceOnTrack = 0;
            this.boarded = false;
            this.ready = true;

        } else {
            this.pauseTicks--;
        }
    }



    this.terminusProcedures = function() {

        this.leftBound = !this.leftBound;

        this.ready = true;

    }

    this.trackProcedures = function() {
        if ((this.currentSegment.kind.length - this.distanceOnTrack) - this.speed / 60 / 60 <= 0) {
            // train ready to proceed
            this.ready = true;
        }
        // add this speed so that it can partially travel on next track segment
        this.distanceOnTrack += this.speed / 60 / 60;
    }



    this.makeNotReady = function() {
        this.ready = false;
    }

    this.tick = function() {
        console.log(this);
        if (this.ready) {
            //travel
            this.travel();
        } else {
            // continue process until ready
            this.currentProcedure();
        }

    }

    this.travel = function() {
        nextSeg = this.nextSegment();
        headingLeft = this.leftBound;

        if (nextSeg.safeToProceed(headingLeft)) {
            //  proceed
            this.currentSegment.trainExit(this);
            this.currentSegment = nextSeg;
            this.currentSegment.trainEnter(this);
        } else {
            // don't proceed

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

        if (!seg.left) { // is left null?
            this.leftMost = newSeg;
            seg.left = newSeg;
        } else {
            seg.left.right = newSeg;
        }
    }

    // insertBeginning(first node)
    // Insert the first item into the Route
    this.insertBeginning = function(newSeg) {
        if (!this.leftMost) { // is leftmost null?
            this.leftMost = newSeg;
            this.rightMost = newSeg;
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
        while (cur) {
            cur.tick();
            cur = cur.right;
        }
    }
}

// Route
// A route is one of: a RouteSegment, a Terminus
function RouteSegment(here, left, right) {
    this.here = here; // The first here should be a terminus
    this.left = left;
    this.right = right;
    this.kind = this.here;
    here.addParentSegment(this);

    this.trainEnter = function(train) {
        this.kind.trainEnter(train);
    }

    this.trainExit = function(train) {
        this.kind.trainExit(train);
    }

    this.safeToProceed = function(left) {
        if (left) {
            return !this.kind.hasLeftBoundTrain;
        } else {
            return !this.kind.hasRightBoundTrain;
        }
    }

    // What is the distance from the left up to and including seg
    this.distanceFromLeft = function(seg) {
        distance = 0;
        cur = this.leftMost();
        while (cur !== seg) {
            if (cur.here.length) {
                distance += cur.here.length;
            }
            cur = cur.right;
        }
        return distance;
    }

    // return the leftMost station
    this.leftMost = function() {
        if (!this.left) {
            // if left is null, this is terminus, so return one right
            return this;
        } else {
            return this.left.leftMost();
        }
    }

    // return the rightMost station
    this.rightMost = function() {
        if (!this.right) {
            // if right is null, this is terminus, so return one left
            return this;
        } else {
            return this.right.rightMost();
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
    this.hasLeftBoundTrain = false;
    this.hasRightBoundTrain = false;

    this.trainEnter = function(train) {
        if (train.leftBound) {
            this.hasLeftBoundTrain = true;
        } else {
            this.hasRightBoundTrain = true;
        }
        train.distanceOnTrack += train.speed / 60 / 60; // give train boost equal to one tick to make up for losing turn on travel
        train.ready = false;
        train.currentProcedure = train.trackProcedures;
    }

    this.trainExit = function(train) {
        train.distanceOnTrack -= this.length; // reset distance traveled on segment
        if (train.leftBound) {
            this.hasLeftBoundTrain = false;
        } else {
            this.hasRightBoundTrain = false;
        }
    }

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
    this.hasLeftBoundTrain = false;
    this.hasRightBoundTrain = false;
    this.leftBoundPlatform = new Platform(this, true);
    this.rightBoundPlatform = new Platform(this, false);

    this.trainEnter = function(train) {
        if (train.leftBound) {
            this.hasLeftBoundTrain = true;
        } else {
            this.hasRightBoundTrain = true;
        }
        train.ready = false;
        train.currentProcedure = train.stationProcedures;
    }

    this.trainExit = function(train) {
        if (train.leftBound) {
            this.hasLeftBoundTrain = false;
        } else {
            this.hasRightBoundTrain = false;
        }
    }

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
        // console.log("Left-bound platform has ", this.leftBoundPlatform.queue.length, " passengers waiting. Average wait time is ", meanArray(this.leftBoundPlatform.waitTimes()));

    } else {
        // console.log("Right-bound platform has ", this.rightBoundPlatform.queue.length, " passengers waiting. Average wait time is ", meanArray(this.rightBoundPlatform.waitTimes()));
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
    this.hasLeftBoundTrain = false;
    this.hasRightBoundTrain = false;
    this.trainEnter = function(train) {
        if (train.leftBound) {
            this.hasLeftBoundTrain = true;
        } else {
            this.hasRightBoundTrain = true;
        }

        train.ready = false;
        train.currentProcedure = train.terminusProcedures;
    }

    this.trainExit = function(train) {
        if (train.leftBound) {
            this.hasLeftBoundTrain = false;
        } else {
            this.hasRightBoundTrain = false;
        }
    }
    this.safeToProceed = function() {
        return true; // assume that the end of the line can handle multiple trains
    }

    this.addParentSegment = function(seg) {
        this.routeSeg = seg;
    }
    this.tick = function() {
        return;
    }
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
    // A World starts with a Station
    this.line = new Route();
    this.trains = [];
    this.tickCount = 0;
    this.tick = function() {
        //tick the world forward
        this.tickCount += 1;
        // tick the stations
        this.line.tick();

        // tick the trains
        for (i = this.trains.length - 1 ; i >= 0; i--) {
            this.trains[i].tick();
        }



    }

    //wrapper for convienent distance calcs
    this.distanceFromLeft = function(seg) {
        return this.line.rightMost.distanceFromLeft(seg);
    }

    // return array of where trains are located
    this.trainLocations = function() {
        i = this.trains.length -1;
        dist = [];
        // go through each train
        while (i >= 0) {
            train = this.trains[i];
            console.log("train location", train.currentSegment)
            if (train.leftBound) {
                //train is heading left, so subtract distance traveled on segment
                console.log("left", this.distanceFromLeft(train.currentSegment.right), train.distanceOnTrack)
                dist.push(this.distanceFromLeft(train.currentSegment.right) - train.distanceOnTrack);
            } else {
                // train is heading right, so subtract distance left to go
                console.log("right", this.distanceFromLeft(train.currentSegment),train.distanceOnTrack);
                dist.push(this.distanceFromLeft(train.currentSegment) + train.distanceOnTrack);
            }

            // go to next train
            i--
        }
        return dist;
    }
    this.generateTrains = function(numleft, numright) {
        for (i = numleft; i > 0; i--) {
            this.trains.push(new Train(this.line.leftMost,false));
        }
    }

}


// Run the model
getSimulationData = function(hours,seed){

    // if seed exists, use it, else just store the generated seed
    if (seed) {
        randomSeed = Math.seedrandom(seed);
    } else {
        randomSeed = Math.seedrandom();
    }
    sst = new World();


    // build the route right to left
    sst.line.insertBeginning(new RouteSegment(new Terminus()));
    sst.line.insertBeginning(new RouteSegment(new Station()));
    sst.line.insertBeginning(new RouteSegment(new Track(400)));
    sst.line.insertBeginning(new RouteSegment(new Track(400)));
    sst.line.insertBeginning(new RouteSegment(new Track(400)));
    sst.line.insertBeginning(new RouteSegment(new Station()));
    sst.line.insertBeginning(new RouteSegment(new Terminus()));

    // generate trains
    sst.generateTrains(1);

    // Begin ticking the world
    totalTicks = hours * 60 * 60;

    // set up data container
    data = {
        directions: {
            leftBound : {
                waitTimes : [],
                queueLength : [],
            },
            rightBound : {
                waitTimes : [],
                queueLength : [],
            },
        },
        trains: [],
        seed : randomSeed,
    }

    for (t = 0; t < totalTicks ; t++) {

        //tick the world forward
        sst.tick();

        // collect data
        ////////////////////////////
        lb = sst.line.rightMost.left.here.leftBoundPlatform;
        lbData = data.directions.leftBound;
        lbData.waitTimes.push(sumArray(lb.waitTimes));
        lbData.queueLength.push(lb.queue.length);

        rb = sst.line.leftMost.right.here.rightBoundPlatform;
        rbData = data.directions.rightBound;
        rbData.waitTimes.push(sumArray(rb.waitTimes));
        rbData.queueLength.push(rb.queue.length);

        data.trains.locations.push(sst.trainLocations());
        console.log("tick", t, sst.trains[0].currentSegment, data.trains.locations[t])

        // Time dependent behaviors
        /////////////////////////////

        // after 90 ticks, add another train
        if (t === 45) {
            sst.generateTrains(1);
        }

        // Print world to console for debugging purposes
        // if (sst.tickCount > 58360 && sst.tickCount < 58375) {
        //     peek = sst.line.rightMost.here.leftBoundPlatform;
        //     console.log(sst.tickCount, peek, peek.waitTimes, meanArray(peek.waitTimes));
        // }


    }

    return data;

};

