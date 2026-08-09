import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
const img = new Image(100, 200);
const size = Math.max(img.width, img.height);
const canvas = new Image(size, size);
// pad with white
canvas.fill(0xFFFFFFFF);
canvas.composite(img, (size - img.width) / 2, (size - img.height) / 2);
console.log("Success", canvas.width, canvas.height);

