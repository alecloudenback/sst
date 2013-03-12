// platform
function Platform(station, leftBound) {
    this.queue = [];
    this.leftBound = leftBound;
    this.station = station;
    this.tickCount = 0; // keep track to allow time-dependent passenger creation
    this.waitTimes = []; // array of current time spent waiting
    this.shouldGeneratePassengers = true; // default to loading passengers


    this.lambda = function() {
        return 2000;
    }

    this.push = function(person) {
        return this.queue.push(person);
    };


    // make the passengers board the given train
    this.board = function(train) {
        // determine how many passengers can board given train
        cap = train.passengerSpace();

        // take the fitting number of passengers off of the queue and waitTimes
        boardingPassengers = this.queue.slice(0,cap-1);
        this.queue = this.queue.slice(cap, this.queue.length);
        this.waitTimes = this.waitTimes.slice(cap, this.waitTimes.length);



        // pass the boarding passengers to the train
        train.board(boardingPassengers);

    }

    this.tick = function() {
        // generate passengers to enter the queue
        newPass = this.generatePassengers();



        // tick the passengers
        this.setWaitTimes();

        this.tickCount += 1;
    }

    this.setWaitTimes = function(newPass) {
        wt = this.waitTimes
        for (i = 0, len = this.waitTimes.length; i < len; i++) {
            wt[i] += 1;
        }
        // add new data point if new passenger was generated
        if (newPass) {
            wt.push(0);
        }
    }

    // generatePassengers creates a number of passengers and inserts them into the queue based on the platform's Poisson process
    this.generatePassengers = function() {
        // if this is the last platform in a given direction, don't generate passengers
        if (this.shouldGeneratePassengers ) {
            // process governing passener creation
            if (Math.random() < this.lambda() / (60 * 60)) { // assumes hourly lambda
                this.push(new Passenger(this.tickCount));
                return true
            }

            // Deterministic passenger creation
            // if (this.tickCount % 2 === 0){
            //     this.push(new Passenger(this.tickCount));
            // }
            return false;
        }
    }
}

// Passenger
function Passenger(tick) {

    this.creationTime = tick;
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
function Train(id,startSeg, leftBound, pauseTicks) {
    this.id = id;
    this.passengers = []; // an array to hold the passengers on the train

    this.pauseTicks = pauseTicks || 0; // the default time to wait at a location, in ticks
    this.speed = 45000; // in meters/hour
    this.capacity = 500;

    this.leftBound = leftBound;
    this.currentSegment = startSeg;
    this.boarded = false;
    this.ready = false;
    this.distanceOnTrack = 0;


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
        this.pauseTicks += ( exitingPassengers.length + 100) / 10; // chosen to have a baseline of 10 seconds for stop, with a max of 60 seconds if 500 passengers getting off

        return exitingPassengers;
    }

    // take the passengers getting on and decide how long it will take to board them
    this.board = function(pass) {
        this.pauseTicks += (4 * pass.length + 250) / 25 ; // chosen to have a baseline of 10 seconds for stop, with a max of ~1.5 minutes if 500 passengers getting on
        this.passengers = this.passengers.concat(pass); // add the boarding passengers to list of those already onboard
    }


    this.stationProcedures = function() {
        if (!this.boarded) {
            // initiate unload/unload procedure
            this.currentSegment.here.arrive(this); // station will tell train how long to wait

            // console.log("train heading", direction, " with ", this.passengers.length, " passengers");
            this.boarded = true;
        }
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

        if (this.pauseTicks < 1) {
            // time for the train to leave the station
            this.leftBound = !this.leftBound;
            this.distanceOnTrack = 0;
            this.boarded = false;
            this.ready = true;
        } else {
            this.pauseTicks--;
        }

    }
    this.currentProcedure = this.terminusProcedures; // trains start at terminus

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

function Route(leftMost, rightMost) {
    //both should be terminus
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
        return this.kind.safeToProceed(left); // ask what's here
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
    this.safeToProceed = function(left) {
        if (left) {
                return !this.hasLeftBoundTrain;
        } else {
                return !this.hasRightBoundTrain;
        }
    }

}

// Station
// A Station is where passengers may board and exit the train
function Station(id) {
    this.id = id;
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

    }

    this.safeToProceed = function(left) {
        if (left) {
                return !this.hasLeftBoundTrain;
        } else {
                return !this.hasRightBoundTrain;
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
        train.pauseTicks = 120; // wait two minutes before turning around
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
        for (trainNum = this.trains.length - 1 ; trainNum >= 0; trainNum--) {
            this.trains[trainNum].tick();
        }



    }

    //wrapper for convienent distance calcs
    this.distanceFromLeft = function(seg) {
        return this.line.rightMost.distanceFromLeft(seg);
    }

    // return how far from the left the train is
    this.trainLocation = function(train) {
        if (train.leftBound) {
                //train is heading left, so subtract distance traveled on segment
                return this.distanceFromLeft(train.currentSegment.right) - train.distanceOnTrack;
            } else {
                // train is heading right, so subtract distance left to go
                return this.distanceFromLeft(train.currentSegment) + train.distanceOnTrack;
            }
    }

    // return array of where trains are located
    this.trainLocations = function() {
        i = this.trains.length -1;
        dist = [];
        // go through each train
        while (i >= 0) {
            train = this.trains[i];
            dist.push(this.trainLocation(train));
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
    this.addTrainAtTick = function(tick, leftMost) {
        if (leftMost) {
         this.trains.push(new Train(this.trains.length, this.line.leftMost, true, tick));
        } else {
         this.trains.push(new Train(this.trains.length, this.line.rightMost, false, tick));
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
    sst.line.insertBeginning(new RouteSegment(new Station(0)));
    sst.line.insertBeginning(new RouteSegment(new Track(400)));
    sst.line.insertBeginning(new RouteSegment(new Track(400)));
    sst.line.insertBeginning(new RouteSegment(new Track(1000)));
    sst.line.insertBeginning(new RouteSegment(new Track(400)));
    sst.line.insertBeginning(new RouteSegment(new Track(400)));
    sst.line.insertBeginning(new RouteSegment(new Station(1)));
    sst.line.insertBeginning(new RouteSegment(new Terminus()));

    // disable passenger generation at two end platforms
    sst.line.leftMost.right.here.leftBoundPlatform.shouldGeneratePassengers = false;
    sst.line.rightMost.left.here.rightBoundPlatform.shouldGeneratePassengers = false;


    // generate trains
    // trains number of trains has to be set in the beginning, so that the data container can be set up properly

    sst.addTrainAtTick(5, true);
    sst.addTrainAtTick(6, false);

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
        for (var numTrain = 0, len = sst.trains.length; numTrain < len; numTrain++) {
            data.trains[numTrain] = {
                leftDist: [],
            }; // initialize object
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

        for (var numTrain = 0, len = sst.trains.length; numTrain < len; numTrain++) {
            data.trains[numTrain].leftDist.push(sst.trainLocation(sst.trains[numTrain]));
        }
        // console.log("tick", t, sst.trains[0].currentSegment, data.trains.locations[t])

        // Time dependent behaviors
        /////////////////////////////


        // Print world to console for debugging purposes
        // if (sst.tickCount > 58360 && sst.tickCount < 58375) {
        //     peek = sst.line.rightMost.here.leftBoundPlatform;
        //     console.log(sst.tickCount, peek, peek.waitTimes, meanArray(peek.waitTimes));
        // }


    }

    return data;

};

