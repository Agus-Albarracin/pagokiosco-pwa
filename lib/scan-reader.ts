import {
  BarcodeFormat, BinaryBitmap, BrowserMultiFormatReader, ChecksumException,
  DecodeHintType, FormatException, HTMLCanvasElementLuminanceSource,
  HybridBinarizer, NotFoundException,
} from "@zxing/library";

export function isScanMiss(error: unknown) {
  return error instanceof NotFoundException || error instanceof ChecksumException || error instanceof FormatException;
}

// BrowserCodeReader alternates polarity globally across calls, including an
// inverted first frame. Decode both polarities from ONE capture when necessary
// so a valid first/only frame never depends on processing the same frame again.
export function createScanReader() {
  const reader = new BrowserMultiFormatReader(new Map([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_8, BarcodeFormat.EAN_13]],
  ]));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("CANVAS_UNAVAILABLE");
  return {
    decode(video: HTMLVideoElement) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const source = new HTMLCanvasElementLuminanceSource(canvas, false);
      try {
        return reader.decodeBitmap(new BinaryBitmap(new HybridBinarizer(source)));
      } catch (error) {
        if (!isScanMiss(error)) throw error;
        return reader.decodeBitmap(new BinaryBitmap(new HybridBinarizer(source.invert())));
      }
    },
    reset() {
      reader.reset();
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}

export type ScanReader = ReturnType<typeof createScanReader>;
