const fs = require("fs");
const path = require("path");

// 配置参数
const MUSIC_DIR = path.join(__dirname, "music"); // music文件夹路径
const OUTPUT_FILE = "music(love).json"; // 输出文件名
const AUDIO_EXTENSIONS = [
  // 支持的音频格式
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".ogg",
  ".m4a",
];

function scanMusicFiles(dir) {
  let results = [];

  // 读取目录内容
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 递归扫描子目录
      results = results.concat(scanMusicFiles(fullPath));
    } else {
      // 检查文件扩展名
      const ext = path.extname(file).toLowerCase();

      if (AUDIO_EXTENSIONS.includes(ext)) {
        // 获取相对路径 (相对于music目录)
        const relativePath = "../music/" + path.relative(MUSIC_DIR, fullPath);

        results.push({
          fileName: file,
          filePath: relativePath.replace(/\\/g, "/"), // 统一使用正斜杠
        });
      }
    }
  });

  return results;
}

// 主执行流程
try {
  if (!fs.existsSync(MUSIC_DIR)) {
    throw new Error(`Music directory not found: ${MUSIC_DIR}`);
  }

  // 扫描音频文件
  const musicData = scanMusicFiles(MUSIC_DIR);

  // 生成JSON并保存
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(musicData, null, 2) // 格式化的JSON
  );

  console.log(`成功生成 ${musicData.length} 个音频文件的JSON数据`);
  console.log(`输出文件: ${path.resolve(OUTPUT_FILE)}`);
} catch (error) {
  console.error("处理过程中出错:", error.message);
}
