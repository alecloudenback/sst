Simple Subway Transit
=====================

Description of Investigation
-----------------------------

The project will investigate how variations in transit scheduling (number of trains and speed) and passenger load and frequency affect the efficiency (as measured in costs of passenger time and train use). The initial system will just use two stations connected by a length of track, with passengers traveling in both directions. The goal is to see what type of relationship the different variables in the system have.

**Goal**

The hope is to better understand the types of interactions that the passengers and trains have. If inefficiencies or bottlenecks occur, then I will investigate strategies to alleviate delays or costs.

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
-   Move on track in both directions

**Passengers**

-   Agent-based (each passenger is modeled)
-   Tracks time waiting on platform
-   Arrive according to a Poisson process

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



