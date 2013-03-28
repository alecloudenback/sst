Simple Subway Transit
=====================

Description of Investigation
-----------------------------

The project will investigate how variations in transit scheduling (number of trains and speed) and passenger load and frequency affect the efficiency (as measured in costs of passenger time and train use). The initial system will just use two stations connected by a length of track, with passengers traveling in both directions. The goal is to see what type of behavior the system has with different properties and scenarios.

**Goal**

The hope is to better understand the types of interactions that the passengers and trains have. If inefficiencies or bottlenecks occur, then I will investigate strategies to alleviate delays or costs.

**Current Status and Direction**

_Status_

Preliminary results with two stations (simplified model):

-   With one train, there is a threshold where if the number of passengers waiting increases past the capacity of the train, the system degenerates into ever-increasing passengers waiting
-   With two trains, there is a similar behavior if the trains are mirrored along the line (start at opposite ends and leave at the same time)
-   With two trains, even spacing is an unstable state. If passengers arrive randomly, bunching of the trains will occur. If passengers arrive deterministically, but the trains don't start within the time-gap of passenger generation, the system falls into a bunched state.


Preliminary results with multiple stations, variable number of trains:

-   The 'system capacity' isn't limited by train bunching (systems where bunching is observed don't carry significantly less passengers)
-   As long as the trains don't go over-capacity and the system queues 'run-away', 'system capacity' is not significantly affected
-   Additional trains only increase the system capacity if there are more passengers than less trains can support (e.g. if the passengers can all fit on a fewer number of trains, there isn't a capacity boost to additional trains)
-   Additional trains and managed headway decrease passenger wait time (mean and median) but don't significantly affect system capacity

_Direction_

Direction for continued investigation:

-   Add time-dependent Poisson process to more accurately model passenger flow (ideally in a way that intelligently depends on centrality of platform in given direction [i.e. more people get on in the morning going 'inbound']).
-   Try different dispatching strategies (train speed factoring)


Model Overview
--------------

Trains collect passengers and transport them to their destination. Passengers are generated randomly and wait on platform and are picked up at intervals by a limited-capacity train.

Model Components and Assumptions
---------------------------------

**Scenario**

-   Scenario plays out over a single day (20 hours)

**Trains**

-	Safety control system (can't get too close to train in front)
-   Takes time to load passengers based on train capacity (function that increases based on how close to capacity)
-   Move on track in both directions, pausing to switch direction at each end of the line

**Passengers**

-   Agent-based (each passenger is modeled)
-   Tracks time waiting on platform
-   Arrive according to a Poisson process (can be set to be deterministic)
-   Passengers decide destination based on distance-weighted gravity model (each station has 'attractiveness', which affects the decision of passengers). They are generated at station-level and decide where to go (and thus which platform to go to)

**Stations**

-   Trains go in both directions
-   FIFO queue to track passengers waiting to board
-   Variable number of stations

Tracking variables
-------------------

This is the variables being principally investigated, i.e. the project seeks to understand the relationships between these properties of the system

-   Number of trains active ✓
-   Total passenger wait time ✓
-   Median passenger wait time ✓
-   Total passenger trip time
-   Median passenger trip time
-   Number of passengers on platforms (waiting) ✓
-   Headway distribution ✓

Issues
-------------------

-   Refactor route object model to avoid layered configuration (would have to learn more about prototypal chain and inheritance to avoid large scale route-related method duplication)

Next Steps
-----------------
1.  Add time-dependent poisson process
2.  Develop concrete hypotheses and run model sufficient number of times to collect data and test hypotheses (create way to automate testing?)
3.  Add on-page configuration and resets

Ideas for passenger behavior:
-   use psuedo-gravity model and assign destination on passenger creation. Assign certain stations as 'attractors' where in the morning traffic tends to go towards them and in the afternoon, traffic tends to go away from them. Have 'attractiveness' scale down from the assigned 'attractive' stations. Switch to having passengers generated at station vs platform. Add 'overall activity level' to be able to roughly scale entire system?

References
------------
http://www.cts.umn.edu/trg/publications/pdfreport/TRGrpt2.pdf




