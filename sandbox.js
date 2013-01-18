// platform
function Platform(name) {
    this.name = name || "";
    this.queue = [];
    this.push = function(person) {
        this.queue.push(person);
    };
    this.pop = function() {
        this.queue.pop();
    };
}

// passenger
function Passenger(id) {
    this.destination = "";
    this.waiting = false;
    this.countDown = 0;
    this.
    this.enter = function(place) {
        if (place instanceof Platform) {
            place.push(this);
        } else if (place instanceof Train) {

        } else {
            // error
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


// World
// A place to keep track of all of the objects
function World() {
    this.passengers = [];
    this.stations = [];
    this.trains = [];
    this.tickCount = 0;
    this.tick = function() {
        //tick the world forward
    }
}


// Run the model

Dtwn = new Platform();

