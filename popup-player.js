startPopupPlayer(document.querySelector('video'))

/**
 * @param {HTMLVideoElement} video
 */
function startPopupPlayer(video) {

  const makeBmpHead = (width, height) => {
    const BMP_HEADER_LEN = 14
    const DIB_HEADER_LEN = 108
    const buf = new Uint8Array(BMP_HEADER_LEN + DIB_HEADER_LEN)

    // https://en.wikipedia.org/wiki/BMP_file_format#Example_2
    buf[0] = 0x42      // 'B'
    buf[1] = 0x4D      // 'M'
    buf[0x0A] = BMP_HEADER_LEN + DIB_HEADER_LEN
    buf[0x0E] = DIB_HEADER_LEN
    buf[0x1A] = 1      // Number of color planes being used
    buf[0x1C] = 32     // Number of bits per pixel
    buf[0x1E] = 3      // BI_BITFIELDS, no pixel array compression used

    buf[0x36] = 0xFF   // R channel bit mask
    buf[0x3B] = 0xFF   // G channel bit mask
    buf[0x40] = 0xFF   // B channel bit mask
    buf[0x45] = 0xFF   // A channel bit mask

    const view = new DataView(buf.buffer)
    view.setInt32(0x12, width, true)
    view.setInt32(0x16, -height, true)  // top-down
    return buf
  }

  const CANVAS_W = 256
  const CANVAS_H = 256

  const bmpHead = makeBmpHead(CANVAS_W, CANVAS_H)
  const bmpBufs = [bmpHead.buffer]
  const artwork = {
    src: '',
    sizes: CANVAS_W + 'x' + CANVAS_H,
    type: 'image/bmp',
  }

  if (!navigator.mediaSession.metadata) {
    navigator.mediaSession.metadata = new MediaMetadata()
  }

  const render = () => {
    if (video.paused) {
      return
    }
    URL.revokeObjectURL(artwork.src)

    const h = video.videoHeight / video.videoWidth * CANVAS_W
    const y = (CANVAS_H - h) / 2

    ctx.drawImage(video, 0, y, CANVAS_W, h)
    const imgData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)
    bmpBufs[1] = imgData.data.buffer

    const blob = new Blob(bmpBufs, {
      type: 'image/bmp',
    })
    artwork.src = URL.createObjectURL(blob)
    navigator.mediaSession.metadata.artwork = [artwork]
  }

  const canvas = new OffscreenCanvas(CANVAS_W, CANVAS_H)
  const ctx = canvas.getContext('2d', {
    willReadFrequently: true,
  })
  const FRAME_DELAY = 20
  try {
    const worker = new Worker(`data:,setInterval(_=>postMessage(0),${FRAME_DELAY})`)
    worker.onmessage = render
  } catch {
    setInterval(render, FRAME_DELAY)
  }
}
