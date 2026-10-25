# Galeria imutável — Pedal nos Bálcãs

A versão pública permanece inalterada enquanto o inventário não estiver completo.

## Fonte definitiva

Colocar os arquivos originais nas pastas `assets/originals/dia-01` até `dia-14`.
São os **arquivos binários**, não links com data de expiração.
Nunca substituir por miniaturas nem ignorar fotos ausentes.

## Migração

1. `npm install`
2. `node scripts/build-immutable-gallery.js`
3. `node scripts/validate-immutable-gallery.js`
4. Conferir visualmente a ordem de captura, todas as fotos e a correspondência foto/legenda.
5. Integrar o novo catálogo ao front-end, gerar versão de teste e percorrer as 14 galerias.
6. Promover à produção apenas após a verificação integral.

O catálogo é `dados/fotografias.json`, com 14 dias, ordem explícita, arquivo estático, título, legenda e SHA-256.
O site deve consumir somente caminhos `/imagens/dia-XX/NNN.webp`.
Os arquivos finais ficam em `public/imagens` e entram no artefato publicado, sem requisições a URLs assinadas ou ao Google Drive.

**Importante:** o código atual mistura galerias antigas, URLs Vercel Blob e conteúdo embutido. A migração para a nova fonte só deve ocorrer depois que todos os originais forem materializados. Apenas criar um manifesto com links existentes não elimina o problema.

## Bloqueio de publicação

`validate-immutable-gallery.js` reprova fotos ausentes, ilegíveis, alteradas, duplicadas, não catalogadas e referências externas, além de dias vazios.
A ordem final e a veracidade das legendas exigem revisão humana sobre os arquivos originais.
