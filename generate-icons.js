// 生成 TabBar 图标
const fs = require('fs');
const path = require('path');

// 简单的 PNG 生成器（纯 JS 实现）
function createPNG(width, height, pixels) {
  // PNG 文件头
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // CRC32 表
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(data) {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
      crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function createChunk(type, data) {
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData));
    return Buffer.concat([length, typeData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT - 使用 zlib 压缩
  const zlib = require('zlib');

  // 添加 filter byte (0) 每行
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const outIdx = y * (width * 4 + 1) + 1 + x * 4;
      rawData[outIdx] = pixels[idx];     // R
      rawData[outIdx + 1] = pixels[idx + 1]; // G
      rawData[outIdx + 2] = pixels[idx + 2]; // B
      rawData[outIdx + 3] = pixels[idx + 3]; // A
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', iend)
  ]);
}

// 创建图标
function createIcon(iconName, active) {
  const size = 81;
  const pixels = new Uint8Array(size * size * 4);

  // 颜色
  const bgColor = active ? [155, 125, 237, 255] : [153, 153, 153, 255]; // 紫色 / 灰色
  const iconColor = active ? [255, 255, 255, 255] : [255, 255, 255, 255];

  // 填充背景
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      pixels[idx] = bgColor[0];
      pixels[idx + 1] = bgColor[1];
      pixels[idx + 2] = bgColor[2];
      pixels[idx + 3] = bgColor[3];
    }
  }

  // 绘制图标形状
  const cx = size / 2;
  const cy = size / 2;

  if (iconName === 'home') {
    // 房子形状
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        // 屋顶
        const roofY = y - 15;
        const roofWidth = (40 - roofY) * 0.8;
        if (roofY >= 15 && roofY <= 35 && Math.abs(x - cx + 10) < roofWidth) {
          pixels[idx] = iconColor[0];
          pixels[idx + 1] = iconColor[1];
          pixels[idx + 2] = iconColor[2];
          pixels[idx + 3] = iconColor[3];
        }
        // 墙体
        if (y >= 35 && y <= 65 && x >= 25 && x <= 56) {
          pixels[idx] = iconColor[0];
          pixels[idx + 1] = iconColor[1];
          pixels[idx + 2] = iconColor[2];
          pixels[idx + 3] = iconColor[3];
        }
      }
    }
  } else if (iconName === 'wish') {
    // 星星/愿望形状
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const dx = x - cx + 5;
        const dy = y - cy + 5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 18 && y > 20 && y < 65) {
          pixels[idx] = iconColor[0];
          pixels[idx + 1] = iconColor[1];
          pixels[idx + 2] = iconColor[2];
          pixels[idx + 3] = iconColor[3];
        }
      }
    }
  } else if (iconName === 'heart') {
    // 心形
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const dx = (x - cx + 10) / 15;
        const dy = (y - cy + 10) / 15;
        const heart = Math.pow(dx * dx + dy * dy - 1, 3) - dx * dx * dy * dy * dy;
        if (heart < 0 && y > 25 && y < 65) {
          pixels[idx] = iconColor[0];
          pixels[idx + 1] = iconColor[1];
          pixels[idx + 2] = iconColor[2];
          pixels[idx + 3] = iconColor[3];
        }
      }
    }
  } else if (iconName === 'user') {
    // 用户形状
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        // 头
        const headDist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - 35, 2));
        if (headDist < 12) {
          pixels[idx] = iconColor[0];
          pixels[idx + 1] = iconColor[1];
          pixels[idx + 2] = iconColor[2];
          pixels[idx + 3] = iconColor[3];
        }
        // 身体
        if (y >= 45 && y <= 65 && x >= 25 && x <= 56) {
          pixels[idx] = iconColor[0];
          pixels[idx + 1] = iconColor[1];
          pixels[idx + 2] = iconColor[2];
          pixels[idx + 3] = iconColor[3];
        }
      }
    }
  }

  return createPNG(size, size, pixels);
}

// 生成所有图标
const iconsDir = path.join(__dirname, 'app', 'assets', 'icons');

// 确保目录存在
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const icons = ['home', 'wish', 'heart', 'user'];

icons.forEach(icon => {
  // 普通状态
  const normal = createIcon(icon, false);
  fs.writeFileSync(path.join(iconsDir, `${icon}.png`), normal);
  console.log(`Created ${icon}.png`);

  // 激活状态
  const active = createIcon(icon, true);
  fs.writeFileSync(path.join(iconsDir, `${icon}-active.png`), active);
  console.log(`Created ${icon}-active.png`);
});

console.log('All icons generated successfully!');