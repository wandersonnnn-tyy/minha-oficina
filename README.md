# Minha Oficina

App de orçamento rápido para oficina de motos (Honda e Yamaha). Funciona no navegador do celular, instala na tela inicial (PWA), guarda os dados no próprio aparelho e abre sem internet.

## Telas

- `index.html`: app do mecânico (próximo passo do dia, novo orçamento, ordens, estoque, ajustes, PDF e WhatsApp)
- `login.html`: entrada dos mecânicos (ainda sem senha de verdade)
- `aprovacao.html`: página que o cliente vê para aprovar o orçamento (ainda com dados de exemplo)

## Como atualizar

As telas são editadas em `src/*.dc.html` (as mesmas do canvas de design). Depois:

```
python build.py
```

Isso gera `index.html`, `login.html` e `aprovacao.html`. Ao publicar uma versão nova, aumente `VERSAO` em `sw.js` para os celulares baixarem a atualização.

Para testar no computador:

```
python -m http.server 8765
```

e abra http://localhost:8765.

## Onde ficam os dados

No `localStorage` do navegador de cada aparelho (chave `minhaOficina`): orçamentos e ordens, estoque, dados da oficina e logo, nome do mecânico, preços editados. Cada celular tem os seus dados; ainda não há sincronização entre aparelhos.

## Créditos das imagens

Fotos dos modelos (Wikimedia Commons): MT-03 por Retired electrician (CC0), NMax por Chanokchon (CC BY-SA 4.0), PCX 160 por Ahri Boy (CC BY 4.0), XMax 250 por Firzafp (CC BY 4.0). Logos Honda, Yamaha, Pix e WhatsApp pertencem às respectivas marcas.
