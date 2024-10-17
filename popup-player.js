const mediaPopupPlayer = function() {

  function makeBmpHead(width, height) {
    const BMP_HEADER_LEN = 14
    const DIB_HEADER_LEN = 108
    const bytes = new Uint8Array(BMP_HEADER_LEN + DIB_HEADER_LEN)

    // https://en.wikipedia.org/wiki/BMP_file_format#Example_2
    bytes[0] = 0x42     // 'B'
    bytes[1] = 0x4D     // 'M'
    bytes[0x0A] = BMP_HEADER_LEN + DIB_HEADER_LEN
    bytes[0x0E] = DIB_HEADER_LEN
    bytes[0x1A] = 1     // Number of color planes being used
    bytes[0x1C] = 32    // Number of bits per pixel
    bytes[0x1E] = 3     // BI_BITFIELDS, no pixel array compression used

    bytes[0x36] = 0xFF  // R channel bit mask
    bytes[0x3B] = 0xFF  // G channel bit mask
    bytes[0x40] = 0xFF  // B channel bit mask
    bytes[0x45] = 0xFF  // A channel bit mask

    const view = new DataView(bytes.buffer)
    view.setInt32(0x12, width, true)
    view.setInt32(0x16, -height, true)  // top-down
    return bytes.buffer
  }

  const bmpBufs = []
  const artwork = {
    src: '',
    sizes: '',
    type: 'image/bmp',
  }
  // ring buffer
  const blobUrls = Array(20).fill('')
  let blobUrlPos = 0

  let isInited = false
  let canvasCtx
  let canvasW = 0
  let canvasH = 0
  let videoElem
  let timerWorker
  let timerId = 0
  let interval = 0

  function init() {
    const workerCode = () => {
      let timer = 0
      onmessage = (e) => {
        clearInterval(timer)
        timer = setInterval(postMessage, e.data, 0)
      }
    }
    try {
      timerWorker = new Worker('data:,(' + workerCode + ')()')
      timerWorker.onmessage = render
    } catch {
    }
  }

  function bindVideo(video) {
    if (!isInited) {
      isInited = true
      init()
    }
    if (!canvasW) {
      setSize(256, 256)
    }
    if (!interval) {
      setFrameRate(60)
    }
    videoElem = video
  }

  function unload() {
    if (timerWorker) {
      timerWorker.terminate()
      timerWorker = undefined
    } else {
      clearInterval(timerId)
    }
    blobUrls.forEach(URL.revokeObjectURL)
    blobUrlPos = 0
    canvasCtx = undefined
    canvasW = canvasH = 0
    interval = 0
    isInited = false
  }

  function render() {
    if (!videoElem || videoElem.paused) {
      return
    }
    URL.revokeObjectURL(blobUrls[blobUrlPos])

    const {videoWidth, videoHeight} = videoElem
    const aspectRatio = videoWidth / videoHeight
    let w, h, x, y

    if (aspectRatio >= 1) {
      // landscape mode
      w = canvasW
      h = canvasW / aspectRatio
      x = 0
      y = (canvasH - h) / 2
    } else {
      // portrait mode
      w = canvasW * aspectRatio
      h = canvasH
      x = (canvasW - w) / 2
      y = 0
    }
    canvasCtx.drawImage(videoElem, x, y, w, h)

    const imgData = canvasCtx.getImageData(0, 0, canvasW, canvasH)
    bmpBufs[1] = imgData.data.buffer

    const blob = new Blob(bmpBufs, {type: 'image/bmp'})
    const url = URL.createObjectURL(blob)
    artwork.src = url

    blobUrls[blobUrlPos] = url
    blobUrlPos = (blobUrlPos + 1) % blobUrls.length

    if (!navigator.mediaSession.metadata) {
      navigator.mediaSession.metadata = new MediaMetadata()
    }
    navigator.mediaSession.metadata.artwork = [artwork]
  }

  function setSize(width, height) {
    const canvas = new OffscreenCanvas(width, height)
    canvasCtx = canvas.getContext('2d', {
      willReadFrequently: true,
    })
    bmpBufs[0] = makeBmpHead(width, height)
    artwork.sizes = width + 'x' + height
    canvasW = width
    canvasH = height
  }

  function setFrameRate(fps) {
    interval = 1000 / fps
    if (timerWorker) {
      timerWorker.postMessage(interval)
    } else {
      clearInterval(timerId)
      timerId = setInterval(render, interval)
    }
  }

  return {
    bindVideo,
    setSize,
    setFrameRate,
    unload,
  }
}()
