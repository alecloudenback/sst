var sst = function(hours,route,trains,seed) {


// Passenger
function Passenger(tick) {
    this.creationTime = tick;

    this.chooseDestination = function(curStat, statArr) {
        //calculate distance-weighted attractiveness for each station
        var wa = []; //weighted-attractiveness
        for (i = 0, len = statArr.length; i < len; i++) {
            if (statArr[i] === curStat) {
                wa[i] = 0;
            } else {
                dist = Math.abs(curStat.distanceFrom(statArr[i]));
                wa[i] = statArr[i].attractiveness / dist;
            }
        }
        // normalize the options to be from 0 to 1
        ratio = sumArray(wa); //find the sum of value
        for (i = 0; i < len; i++) {
            prev = wa[i-1] || 0; // what number to be at the bottom of the range
            wa[i] = wa[i] / ratio + prev;
        }
        //decide what station to go to
        rand = Math.random();
        i = 0;
        while (rand > wa[i]) {
            i++;
        }
        this.destination = statArr[i];
    };

    this.enter = function(place) {
        if (place instanceof Platform) {
            place.push(this);
        } else if (place instanceof Train) {
            // Decide where to get off next
        } else {
            // error
            console.log("Error in passenger entering place.");
        }
    };

    this.gettingOff = function(curStat) {
        if (curStat == this.destination){
         return true;
     } else {
        return false;
    }
};



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
    };


    // return how many more passengers can fit
    this.passengerSpace = function() {
        return this.capacity - this.passengers.length;
    };


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
    };

    // take the passengers getting on and decide how long it will take to board them
    this.board = function(pass) {
        this.pauseTicks += (4 * pass.length + 250) / 25 ; // chosen to have a baseline of 10 seconds for stop, with a max of ~1.5 minutes if 500 passengers getting on
        this.passengers = this.passengers.concat(pass); // add the boarding passengers to list of those already onboard
    };


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
    };



    this.terminusProcedures = function() {

        if (this.pauseTicks < 1) {
            // time for the train to leave the station
            this.distanceOnTrack = 0;
            this.boarded = false;
            this.ready = true;
        } else {
            this.pauseTicks--;
        }

    };
    this.currentProcedure = this.terminusProcedures; // trains start at terminus

    this.trackProcedures = function() {
        if ((this.currentSegment.here.length - this.distanceOnTrack) - this.speed / 60 / 60 <= 0) {
            // train ready to proceed to next segment
            this.ready = true;
        }
        // add this speed so that it can partially travel on next track segment
        this.distanceOnTrack += this.speed / 60 / 60;
    };



    this.makeNotReady = function() {
        this.ready = false;
    };

    this.tick = function() {
        if (this.ready) {
            //travel
            this.travel();
        } else {
            // continue process until ready
            this.currentProcedure();
        }

    };

    this.travel = function() {
        nextSeg = this.nextSegment();
        headingLeft = this.leftBound;
        if (nextSeg.okayToProceed(headingLeft)) {
            //  proceed
            this.currentSegment.trainExit(this);
            this.currentSegment = nextSeg;
            this.currentSegment.trainEnter(this);
        } else {
            // don't proceed
        }
    };

}

function Route(leftMost, rightMost) {
    //both should be terminus
    this.leftMost = leftMost;
    this.rightMost = rightMost;
    this.totalLength = 0;

    // interpolateAttractiveness
    // based on given station attractiveness, interpolate other station values
    this.interpolateAttractiveness = function() {
        var cur = this.leftMost;
        var stationCount = 0;
        //create array of attractiveness values
        attr = [];

        while (cur) {
            if (cur.here instanceof Station) {
                if (cur.here.attractiveness) {
                    attr[stationCount] = cur.here.attractiveness;
                } else {
                    attr[stationCount] = undefined;
                }
                stationCount += 1;
            }
            cur = cur.right;
        }
        // interpolate missing values, with min being the value to interpolate from if not bounded
        var linearInt = function(arr,min) {
            for (i = 0, len = arr.length; i < len; i++) {
                if (!arr[i]) {
                    a = arr[i-1] || min;
                    b = arr[i+1] || min;
                    arr[i] = a + (b-a)/2;
                }
            }
            return arr;
        };
        // interpolate missing values
        attr = linearInt(attr, 0.1);

        // loop back through and assign attractiveness
        cur = this.leftMost;
        stationCount = 0;
        while (cur) {
            if (cur.here instanceof Station) {

                cur.here.attractiveness = attr[stationCount];
                stationCount += 1;
            }
            cur = cur.right;
        }

    };

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
    };

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
    };

    // insertBeginning(first node)
    // Insert the first item into the Route
    this.insertBeginning = function(newSeg) {
        if (!this.leftMost) { // is leftmost null?
            this.leftMost = newSeg;
            this.rightMost = newSeg;
        } else {
            this.insertBefore(this.leftMost,newSeg);
        }
        return newSeg;
    };

    // print route
    this.printRoute = function() {
        // print left to right
        console.log("-------- left to right ----");
        cur = this.leftMost;
        while (!(cur instanceof Terminus) || !cur) {
            console.log(cur.here);
            cur = cur.right;
        }
        console.log("------- right to left ----");

        // print right to left
        cur = this.rightMost;
        while (!(cur instanceof Terminus) || !cur) {
            console.log(cur.here);
            cur = cur.left;
        }
    };

    // tick the route forward in time
    this.tick = function() {
        cur = this.leftMost;
        while (cur) {
            cur.tick();
            cur = cur.right;
        }
    };
}

// Route
// A route is one of: a RouteSegment, a Terminus
function RouteSegment(here, left, right) {
    this.here = here; // The first here should be a terminus
    this.left = left;
    this.right = right;

    here.addParentSegment(this);

    this.trainEnter = function(train) {
        this.here.trainEnter(train);
    };

    this.trainExit = function(train) {
        this.here.trainExit(train);
    };

    this.okayToProceed = function(left) {
        return this.here.okayToProceed(left); // ask what's here
    };

    // What is the distance from the left up to and including seg
    this.distanceFromLeft = function(seg) {
        distance = 0;
        cur = this.leftMost();
        while (cur !== seg) {
            if (cur.here.length) { // add to length if it exists
                distance += cur.here.length;
            }
            cur = cur.right;
        }
        return distance;
    };

    // return the leftMost station
    this.leftMost = function() {
        if (!this.left) {
            // if left is null, this is terminus, so return one right
            return this;
        } else {
            return this.left.leftMost();
        }
    };

    // return the rightMost station
    this.rightMost = function() {
        if (!this.right) {
            // if right is null, this is terminus, so return one left
            return this;
        } else {
            return this.right.rightMost();
        }
    };

    // pass the tick onto this node's location
    this.tick = function() {
        this.here.tick();
    };
}

// Track
// A track is a distance that the train must travel in between stations
function Track(len) {
    this.length = len;
    this.hasLeftBoundTrain = false;
    this.hasRightBoundTrain = false;
    this.rightBoundHold = false;
    this.leftBoundHold = false;


    this.trainEnter = function(train) {
        if (train.leftBound) {
            this.hasLeftBoundTrain = true;
        } else {
            this.hasRightBoundTrain = true;
        }
        train.distanceOnTrack += train.speed / 60 / 60; // give train boost equal to one tick to make up for losing turn on travel
        train.ready = false;
        train.currentProcedure = train.trackProcedures;
    };

    this.trainExit = function(train) {
        train.distanceOnTrack -= this.length; // reset distance traveled on segment
        if (train.leftBound) {
            this.hasLeftBoundTrain = false;
        } else {
            this.hasRightBoundTrain = false;
        }
    };

    this.tick = function() {
        // do nothing
    };

    this.addParentSegment = function(seg) {
        this.routeSeg = seg;
    };

    this.setHold = function(left,setting) {
        if (left) {
            this.leftBoundHold = setting;
        } else {
            this.rightBoundHold = setting;
        }
    }
    this.okayToProceed = function(left) {
        if (left) {
            return !this.hasLeftBoundTrain && !this.leftBoundHold;
        } else {
            return !this.hasRightBoundTrain && !this.rightBoundHold;
        }
    };

}

// platform
function Platform(station, leftBound) {
    this.queue = [];
    this.leftBound = leftBound; //which direction does this platforms trains head towards?
    this.station = station;
    this.newPass = false; // was a passenger generated on the previous tick?
    this.waitTimes = []; // array of current time spent waiting
    this.timeSinceLastTrain = 0;



    this.push = function(person) {
        this.newPass = true;
        return this.queue.push(person);
    };


    // make the passengers board the given train
    this.board = function(train) {
        // determine how many passengers can board given train
        cap = train.passengerSpace();

        // take the fitting number of passengers off of the queue and waitTimes
        boardingPassengers = this.queue.slice(0,cap-1);
        this.queue = this.queue.slice(cap, this.queue.length);

        // add the waiting times of passengers boarding to dispatcher (data collection)
        this.station.world.dispatcher.concatWaitTimes(this.waitTimes.slice(0,cap));

        this.waitTimes = this.waitTimes.slice(cap, this.waitTimes.length);


        // increment the number of carried passengers (data collection)
        this.station.world.dispatcher.passengersCarried += boardingPassengers.length;

        // pass the boarding passengers to the train
        train.board(boardingPassengers);
        this.timeSinceLastTrain = 0;
    };

    this.tick = function() {


        // tick the passengers
        this.setWaitTimes(this.newPass);

        // increase tick count and reset newPass flag
        this.newPass = false;
        this.tickCount += 1;
        this.timeSinceLastTrain += 1;
    };

    this.setWaitTimes = function(newPass) {
        wt = this.waitTimes;
        for (i = 0, len = this.waitTimes.length; i < len; i++) {
            wt[i] += 1;
        }
        // add new data point if new passenger was generated
        if (newPass) {
            wt.push(0);
        }
    };

}

// Station
// A Station is where passengers may board and exit the train
function Station(id, world, attractiveness, baseLambda) {
    this.world = world; // give Stations access to information about the world
    this.attractiveness = attractiveness; // should be between 0 and 1
    this.id = id;
    this.baseLambda = baseLambda || 500;
    this.hasLeftBoundTrain = false;
    this.hasRightBoundTrain = false;
    this.tickCount = 0; // keep track to allow time-dependent passenger creation
    this.leftBoundPlatform = new Platform(this, true);
    this.rightBoundPlatform = new Platform(this, false);

    // lambda is a function so that it can vary in the model
    this.lambda = function() {
        var factor = 1 * this.attractiveness;
        return factor * 1500;
    };

    // generatePassengers creates a number of passengers and inserts them into the queue based on the platform's Poisson process
    this.generatePassengers = function() {
            // process governing passenger creation
            if (Math.random() < this.lambda() / (60 * 60)) { // assumes hourly lambda
                var p = new Passenger(this.tickCount);
                p.chooseDestination(this,this.world.stations);
                if (this.distanceFrom(p.destination) < 0 ){
                    // assign to leftBoundPlatform
                    this.leftBoundPlatform.push(p);
                } else {
                   // assign to rightBoundPlatform
                   this.rightBoundPlatform.push(p);
               }
           }

            // (optional) Deterministic passenger creation
            // if (this.tickCount % 2 === 0){
            //     this.push(new Passenger(this.tickCount));
            //     return true;
            // }
        };

    //Misc methods

    //give the absolute distance from the given station
    this.distanceFrom = function(stat) {
        // return signed distance so that direction can be discerned
        d1 = this.routeSeg.distanceFromLeft(this.routeSeg);
        d2 = stat.routeSeg.distanceFromLeft(stat.routeSeg);
        return  d1 - d2 ;

    };
    this.setHold = function(left,setting) {
        //nothing right now
    }

    // Train related methods
    this.trainEnter = function(train) {
        if (train.leftBound) {
            this.hasLeftBoundTrain = true;
        } else {
            this.hasRightBoundTrain = true;
        }
        train.ready = false;
        train.currentProcedure = train.stationProcedures;
    };

    this.trainExit = function(train) {
        if (train.leftBound) {
            this.hasLeftBoundTrain = false;
        } else {
            this.hasRightBoundTrain = false;
        }
    };

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

    };

    this.tick = function() {
        // generate passengers
        this.generatePassengers();

        // tick each platform
        this.leftBoundPlatform.tick();
        this.rightBoundPlatform.tick();

    };

    this.okayToProceed = function(left) {
        if (left) {
            return !this.hasLeftBoundTrain;
        } else {
            return !this.hasRightBoundTrain;
        }
    };

    this.addParentSegment = function(seg) {
        this.routeSeg = seg;
    };
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
        train.leftBound = !train.leftBound;
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
    this.okayToProceed = function() {
        return true; // assume that the end of the line can handle multiple trains
    }

    this.addParentSegment = function(seg) {
        this.routeSeg = seg;
    }
    this.tick = function() {
        return;
    }
        this.setHold = function(left,setting) {
        //nothing right now
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

//Dispatcher
// An object to watch the system and signal trains to optimize efficiency
function Dispatcher(world,execute) {
    this.world = world;
    this.execute = execute;
    this.trainDists = [];
    this.headwayDists = [];
    this.passengersCarried = 0;
    this.waitTimes = [];

    this.strategy = function() {

        // Slow down trains that are below the average distance from each other
        tolerance = 0.85;
        avgDist = meanArray(this.headwayDists);
        for (var i = 0, len = this.headwayDists.length; i < len; i++ ){
            if (this.headwayDists[i] < avgDist * tolerance) {
                this.world.trains[i].nextSegment().here.setHold(this.world.trains[i].leftBound, true);
            } else {
                this.world.trains[i].nextSegment().here.setHold(this.world.trains[i].leftBound, false);

            }
        }
    };

    this.tick = function() {
        // gather data
        this.trainDists = this.world.trainDists();
        this.headwayDists = this.getHeadwayDists();
        if (this.execute) {
            this.strategy();
        }
    };

    // get array of headway times
    this.getHeadwayTimes = function() {
        // TODO
    };

    // allow concatenation of waitTimes
    this.concatWaitTimes = function(arr) {
        this.waitTimes = this.waitTimes.concat(arr);
    };

    // get the distance between two trains
    this.getHeadwayDist = function(train1, train2) {
        var d1 = this.world.trainDist(train1, true);
        var d2 = this.world.trainDist(train2, true);
        dist = d2 - d1;

        if (dist < 0 ) {
            // if dist is < 0 'modularly divide' by the loop's length
            return Math.abs(this.world.line.totalLength * 2 + dist);
        } else{
            return Math.abs(dist);
        }

    };


    // returns array of headway distances with the distance between train i and i + 1 in array slot i
    this.getHeadwayDists = function() {
        var res = [];
        loop = this.world.line.totalLength * 2;

        // find minimum headway based compared to each other train
        for (var i = 0, tc = this.world.trains.length; i < tc; i++ ) {
            minDist = loop;
            //compare to other trains
            for (var j = 0; j < tc; j++) {
                if (j != i) { //skip over itself
                    hd = this.getHeadwayDist(this.world.trains[i], this.world.trains[j]);
                    if ( hd < minDist) {
                        //new minDist
                        minDist = hd;
                    }

                }
            }
            //keep closest match
            res[i] = minDist;

        }
        return res;
    };


}

// World
// A place to keep track of all of the objects
function World(useDispatcher) {
    // A World starts with a Station
    this.line = new Route();
    this.stations = [];
    this.trains = [];
    this.dispatcher = new Dispatcher(this,useDispatcher);
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

        // run the dispatcher
        this.dispatcher.tick();

    };

    //wrapper for convenient distance calcs
    this.distanceFromLeft = function(seg) {
        return this.line.rightMost.distanceFromLeft(seg);
    };

    // return how far from the left the train is
    this.trainDist = function(train, loopDist) {
        if (train.leftBound) {
                //train is heading left, so subtract distance traveled on segment
                var dist =  this.distanceFromLeft(train.currentSegment.right) - train.distanceOnTrack;
            } else {
                // train is heading right, so subtract distance left to go
                var dist =  this.distanceFromLeft(train.currentSegment) + train.distanceOnTrack;
            }

            if (loopDist && train.leftBound) {
                // subtract the train dist from the loop if heading 'back' left
                return this.line.totalLength * 2 - dist;
            } else {
                return dist;
            }
        };

    // return array of where trains are located
    this.trainDists = function() {
        dist = [];
        for (var i = 0, len = this.trains.length; i < len; i ++){
            train = this.trains[i];
            dist[i] = this.trainDist(train);
        }
        return dist;
    };


    this.addTrainAtTick = function(tick, starOnLeftB) {
        if (starOnLeftB) {
         this.trains.push(new Train(this.trains.length, this.line.leftMost, false, tick));
     } else {
         this.trains.push(new Train(this.trains.length, this.line.rightMost, true, tick));
     }
 };

    // add a route to the world based on the passed on route
    this.generateRoute = function(route) {

        // build the route right to left

        var stationCount = 0;

        //insert start terminus
        this.line.insertBeginning(new RouteSegment(new Terminus()));

        for (var i = 0, len = route.length; i < len; i++) {
            if (route[i].here === 'station') {
                stationSeg = this.line.insertBeginning(new RouteSegment(new Station(stationCount, this, route[i].attractiveness)));
                this.stations[stationCount] = stationSeg.here; // add the created station to the easy-to-access array of stations
                stationCount += 1;

            }
            if (route[i].here === 'track') {
                var tLength = route[i].trackLength;
                this.line.insertBeginning(new RouteSegment(new Track(tLength)));
                this.line.totalLength += tLength;
            }
        }
        // insert end terminus
        this.line.insertBeginning(new RouteSegment(new Terminus()));

        // disable passenger generation at two end platforms
        // this.line.leftMost.right.here.leftBoundPlatform.shouldGeneratePassengers = false;
        // this.line.rightMost.left.here.rightBoundPlatform.shouldGeneratePassengers = false;

    };
    // add trains to the world based on the array of train options passed
    this.generateTrains = function(trains) {
        // generate trains
        // trains number of trains has to be set in the beginning, so that the data container can be set up properly
        for (var i = 0, len = trains.length; i < len; i++) {
            this.addTrainAtTick(trains[i].startTime, trains[i].startOnLeft );
        }
    };
}

// Run the model
getSimulationData = function(hours,route,trains,dispatcher,seed){

    // if seed exists, use it, else just store the generated seed
    if (seed) {
        randomSeed = Math.seedrandom(seed);
    } else {
        randomSeed = Math.seedrandom();
    }
    sst = new World(dispatcher);


    sst.generateRoute(route);
    sst.line.interpolateAttractiveness(); // set attractiveness for each station

    sst.generateTrains(trains);

    // Begin ticking the world
    totalTicks = hours * 60 * 60;

    // set up data container
    data = {
        stations: [],
        trains: [],
        seed : randomSeed
    };

    var stationCount = sst.stations.length;
    var trainCount = sst.trains.length;

    //set up train data object
    for (var trainNum = 0; trainNum < trainCount; trainNum++) {
        data.trains[trainNum] = {
            leftDist: []
        };
    }

    // set up station data object
    for (var statNum = 0; statNum < stationCount; statNum++) {
        data.stations[statNum] = {
            leftBound: {
                waitTimes : [],
                queueLength : []
            },
            rightBound: {
                waitTimes : [],
                queueLength : []
            }
        };
    }



    for (t = 0; t < totalTicks ; t++) {
        //tick the world forward
        sst.tick();

        // collect data
        ////////////////////////////

        // station data
        for (var statNum = 0; statNum < stationCount; statNum++) {
            d = data.stations[statNum];
            s = sst.stations[statNum];
            d.leftBound.waitTimes.push(sumArray(s.leftBoundPlatform.waitTimes));
            d.leftBound.queueLength.push(s.leftBoundPlatform.queue.length);
            d.rightBound.waitTimes.push(sumArray(s.rightBoundPlatform.waitTimes));
            d.rightBound.queueLength.push(s.rightBoundPlatform.queue.length);
        }

        // train data
        for (trainNum = 0; trainNum < trainCount; trainNum++) {
            data.trains[trainNum].leftDist.push(sst.dispatcher.trainDists[trainNum]);
        }

    }

    // Add data gathered as of end of model run
    //////////////

    //account for wait times of passengers never picked up
    for (var i = 0, len = sst.stations.length; i < len; i++) {
        d = sst.dispatcher;
        // add leftbound
        d.concatWaitTimes(sst.stations[i].leftBoundPlatform.waitTimes);
        //add rightbound
        d.concatWaitTimes(sst.stations[i].rightBoundPlatform.waitTimes);
    }
    data.waitTimes = sst.dispatcher.waitTimes;
    data.waitTimes.average = meanArray(data.waitTimes);
    data.passengersCarried = sst.dispatcher.passengersCarried;
    return data;

};
return getSimulationData(hours,route,trains,seed);
};