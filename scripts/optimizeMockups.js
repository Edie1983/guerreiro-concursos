import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, "..", "public", "landing");

console.log("🔍 Procurando PNGs em:", dir);

if (!fs.existsSync(dir)) {
  console.error("❌ Diretório não encontrado:", dir);
  process.exit(1);
}

const files = fs.readdirSync(dir);
const pngFiles = files.filter(file => file.endsWith(".png"));

if (pngFiles.length === 0) {
  console.log("⚠️  Nenhum arquivo PNG encontrado.");
  process.exit(0);
}

console.log(`📦 Encontrados ${pngFiles.length} arquivo(s) PNG para otimizar:\n`);

let processed = 0;
let totalOriginalSize = 0;
let totalOptimizedSize = 0;

async function optimizeFile(file) {
  const input = path.join(dir, file);
  const output = path.join(dir, file + ".temp");
  
  try {
    const stats = fs.statSync(input);
    const originalSize = stats.size;
    totalOriginalSize += originalSize;
    
    await sharp(input)
      .png({ 
        compressionLevel: 9, 
        quality: 85,
        adaptiveFiltering: true,
        palette: true
      })
      .toFile(output);
    
    const optimizedStats = fs.statSync(output);
    const optimizedSize = optimizedStats.size;
    totalOptimizedSize += optimizedSize;
    
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    const originalMB = (originalSize / 1024 / 1024).toFixed(2);
    const optimizedMB = (optimizedSize / 1024 / 1024).toFixed(2);
    
    // Substituir o arquivo original apenas se o otimizado for menor
    if (optimizedSize < originalSize) {
      fs.renameSync(output, input);
      console.log(`✔  ${file}`);
      console.log(`   ${originalMB} MB → ${optimizedMB} MB (${savings}% menor)`);
    } else {
      // Se não houver ganho, manter o original
      fs.unlinkSync(output);
      console.log(`⚠  ${file} (já otimizado, mantido original)`);
      totalOptimizedSize += originalSize; // Não contar como otimizado
    }
    
    processed++;
    
    if (processed === pngFiles.length) {
      const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
      const totalOriginalMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
      const totalOptimizedMB = (totalOptimizedSize / 1024 / 1024).toFixed(2);
      
      console.log(`\n✨ Otimização concluída!`);
      console.log(`📊 Total: ${totalOriginalMB} MB → ${totalOptimizedMB} MB`);
      console.log(`💾 Economia: ${totalSavings}%`);
    }
  } catch (err) {
    console.error(`❌ Erro otimizando ${file}:`, err.message);
    if (fs.existsSync(output)) {
      fs.unlinkSync(output);
    }
    processed++;
  }
}

// Processar todos os arquivos
pngFiles.forEach(file => {
  optimizeFile(file);
});

