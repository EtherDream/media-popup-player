# Media Popup Player

Watch videos on the album artwork of music control bar.

## Demo

https://etherdream.com/media-popup-player/demo.html

(Windows) System Media Transport Controls:

https://github.com/user-attachments/assets/e025fb1b-8ac2-4eb2-b0bc-0c4d8ec23e59

(iOS) Lock Screen:

https://github.com/user-attachments/assets/8c5c9b93-8ee1-4da7-a53a-b1a0913d9088


## Try

Open a video website and inject [popup-player.js](popup-player.js), then run:

```js
mediaPopupPlayer.bindVideo(document.querySelector('video'))
```

https://github.com/user-attachments/assets/3c62b0ad-bc79-4e7c-ac43-3d6005e2f15c

## API

* void `bindVideo`(video: HTMLVideoElement)

* void `unbindVideo`()

* void `setSize`(width: number, height: number)

  Set the resolution of the artwork. Default `256x256`.

* void `setFrameRate`(fps: number)

  Set the rendering frame rate. Default `60`.

* void `unload`()

  Free this library (terminate timer, etc.), call `bindVideo` will re-init.


## Known Issues

Firefox: MediaSession does not support dynamically generated images, i.e. data url, blob, and cannot be intercepted by Service Worker.

## Related Projects

* [headphone-morse-transmitter](https://github.com/EtherDream/headphone-morse-transmitter) (Send Morse code via ⏮️ ⏸️ ⏯️)
