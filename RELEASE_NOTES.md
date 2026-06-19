## What's new in v0.4.2

**Fixes**
- The dismiss countdown bar now reappears correctly on later detections, after the first countdown has fully run.
- Authenticated Frigate setups: the login token is refreshed before it expires, so the live view keeps loading even after Peek has been open for a long time.
- The MQTT connection is restored immediately when the computer wakes from sleep or hibernate, so detections are no longer missed until a restart.

Thanks to @NickLD for the fixes.
