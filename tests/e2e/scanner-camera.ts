import type { Page } from "@playwright/test";

// A real EAN-13 image in a synthetic MediaStream exercises the ZXing decoder.
export async function useBarcodeCamera(page: Page, code = "7798113302458") {
  await page.addInitScript((ean: string) => {
    sessionStorage.setItem("pagokiosco.install-dismissed", "1");
    navigator.mediaDevices.getUserMedia = async () => {
      const left = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
      const parity = [0x00, 0x0b, 0x0d, 0x0e, 0x13, 0x19, 0x1c, 0x15, 0x16, 0x1a][Number(ean[0])];
      const invert = (bits: string) => [...bits].map(bit => bit === "1" ? "0" : "1").join("");
      let bars = "101";
      for (let i = 1; i <= 6; i++) {
        const pattern = left[Number(ean[i])];
        bars += (parity & (1 << (6 - i))) ? invert([...pattern].reverse().join("")) : pattern;
      }
      bars += "01010";
      for (let i = 7; i <= 12; i++) bars += invert(left[Number(ean[i])]);
      bars += "101";
      const canvas = document.createElement("canvas");
      canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "white"; ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = "black";
      [...bars].forEach((bar, index) => { if (bar === "1") ctx.fillRect(130 + index * 4, 100, 4, 260); });
      const stream = canvas.captureStream(5);
      (window as Window & { testStream?: MediaStream }).testStream = stream;
      return stream;
    };
  }, code);
}
