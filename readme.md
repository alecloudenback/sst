A model of a subway line:

Model Overview
==============

Trains collect passengers and trasport them to their destination with limited stations. Passengers wait on platform and are picked up at intervals by a limited-capacity train. Passengers vary time-dependently.

Model Components
================

Scenario
--------

-   Scenario plays out over a single day

Trains
------

-	Safety control system (can't get too close to train in front)
-   Takes time to load passengers based on train capacity (non-linear function that increases based on how close to capacity)
-   Move on track in both directions

Passengers
----------

-   Agent-based (each passenger is modeled)
-   Tracks destination (random destination [residential <-> work]?)
-   Tracks time waiting on platform
-   Tracks time until reaching destination
-   (?) Get back on from station they got off  (could make system closed)
-   Arrive according to some (random?) function

Stations
--------

-   Trains go in both directions
-   FIFO queue to track passengers waiting to board
-   Variable number of stations
-   (?) Some stations are more 'work', others residential

Tracking variables
==================
-   Number of trains active
-   Total passenger wait time
-   Median passenger wait time
-   Total passenger trip time
-   Median passenger trip time
-   Number of passengers on platforms


