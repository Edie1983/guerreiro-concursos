import sharp from 'sharp';
import { writeFileSync } from 'fs';

const width = 1920;
const height = 1080;

// Criar um buffer para a imagem
const image = sharp({
  create: {
    width,
    height,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparente
  }
});

// Gerar SVG com estrelas
let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
svg += '<defs><style>.star { fill: white; opacity: 0.6; }</style></defs>';

// Adicionar estrelas aleatórias (mas determinísticas para ser tileable)
const numStars = 150;
const seed = 42; // Para tornar determinístico

function seededRandom(seed) {
  let value = seed;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const random = seededRandom(seed);

// Gerar estrelas distribuídas uniformemente
for (let i = 0; i < numStars; i++) {
  const x = Math.floor(random() * width);
  const y = Math.floor(random() * height);
  const size = 0.5 + random() * 1.5; // Tamanho entre 0.5 e 2
  const opacity = 0.3 + random() * 0.4; // Opacidade entre 0.3 e 0.7
  
  svg += `<circle cx="${x}" cy="${y}" r="${size}" class="star" opacity="${opacity}"/>`;
}

// Adicionar algumas estrelas maiores e mais brilhantes
for (let i = 0; i < 20; i++) {
  const x = Math.floor(random() * width);
  const y = Math.floor(random() * height);
  const size = 1.5 + random() * 1;
  const opacity = 0.5 + random() * 0.3;
  
  svg += `<circle cx="${x}" cy="${y}" r="${size}" class="star" opacity="${opacity}"/>`;
}

svg += '</svg>';

// Converter SVG para PNG
const svgBuffer = Buffer.from(svg);

sharp(svgBuffer)
  .png()
  .toFile('landing/assets/bg-stars.png')
  .then(() => {
    console.log('✅ bg-stars.png criado com sucesso!');
  })
  .catch((err) => {
    console.error('❌ Erro ao criar bg-stars.png:', err);
    process.exit(1);
  });
