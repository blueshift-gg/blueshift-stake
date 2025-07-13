export function shortenString(str: string, length = 16): string {
  return `${str.slice(0, Math.floor(length / 2))}...${str.slice(-Math.floor(length / 2))}`;
}

export function rgbToRgba(rgb: string, alpha: number) {
  return rgb.replace("rgb(", `rgba(`).replace(")", `, ${alpha})`);
}
