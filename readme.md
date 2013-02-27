Simple Subway Transit
=====================

Description of Investigation
-----------------------------

The project will investigate how variations in transit scheduling (number of trains and speed) and passenger load and frequency affect the efficiency (as measured in costs of passenger time and train use). The initial system will just use two stations connected by a length of track, with passengers traveling in both directions. The goal is to see what type of relationship the different variables in the system have.

**Goal**

The hope is to better understand the types of interactions that the passengers and trains have. If inefficiencies or bottlenecks occur, then I will investigate strategies to alleviate delays or costs.

**Current Status and Direction**

_Status_

Currently, the system has been tested and working with two stations and a variable number of trains and track length separating them. Scenarios including one and two trains have been tested, and some preliminary results are:

-   With one train, there is a threshold where if the number of passengers waiting increases past the capacity of the train, the system degenerates into ever-increasing passengers waiting
-   With two trains, there is a similar behavior if the trains are mirrored along the line (start at opposite ends and leave at the same time)
-   With two trains, even spacing is an unstable state. If passengers arrive randomly, bunching of the trains will occur. If passengers arrive deterministically, but the trains don't start at exactly the same time, the system falls into a bunched state.

_Direction_

I wish to continue investigating behavior of the system with two stations:

-   Increase the number of trains
-   Add dispatching to try and intelligently control headway between trains and try to avoid bunching.
-   Is there a threshold where bunched trains degenerate into ever-increasing passengers waiting? (probably, but haven't had high enough passenger generation to test with two trains)

And with Multiple stations:

-   Begin by investigating how one train behaves
-   Add additional trains to see how system behaves, similar to two station system




Model Overview
--------------

Trains collect passengers and transport them to their destination with limited stations. Passengers wait on platform and are picked up at intervals by a limited-capacity train. Passengers vary time-dependently.

Model Components
----------------

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

**Stations**

-   Trains go in both directions
-   FIFO queue to track passengers waiting to board
-   Variable number of stations

Tracking variables
-------------------

This is the variables being principally investigated, i.e. the project seeks to understand the relationships between these properties of the system

-   Number of trains active
-   Total passenger wait time
-   Median passenger wait time
-   Total passenger trip time
-   Median passenger trip time
-   Number of passengers on platforms (waiting)
-   Headway distribution

Interesting Notes
-------------------

-   Trains being eveling spaced is an unstable condition. The system degenerates into bunching if either the passenger arrival is random or the trains don't start exactly at the same time at opposite ends


