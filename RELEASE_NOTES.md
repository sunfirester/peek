## What's new in v0.4.0

**Stream fixes**
- Stream names are now resolved through the Frigate config API, so cameras with multiple streams play the correct go2rtc source.
- Fixed a connection leak on stream teardown, and the stream is reused on back-to-back detections from the same camera instead of restarting.
- Fixed a setup bug where a host pasted with a scheme prefix produced an invalid URL.

**Overlay**
- Added a dismiss countdown bar at the top of the notification, so you can see how long it stays up.

**macOS reachability**
- Peek now runs as a single instance and reopens Settings when relaunched from Spotlight or the Applications folder, so it stays reachable even when the menu bar icon ends up hidden behind the notch.
- New optional "Keep an icon in the Dock" setting for a permanent entry point.

Thanks to @NickLD, @saihgupr and @brandonjones24 for the reports and fixes, and to @veilofsecurity for the feedback on keeping Peek dock-free by default.
