// platform
function Platform(name) {
    this.name = name || "";
    this.queue = [];
    this.push = function(person) {
        this.queue.push(person);
    };
    this.pop = function {
        this.queue.pop();
    };
}

// passenger
function Passenger(id) {
    this.destination = "";
    this.waiting = false;
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

