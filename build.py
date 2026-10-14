"""Gera as páginas do app (index.html, login.html, aprovacao.html) a partir das telas em src/.

Uso: python build.py
"""
import re
from pathlib import Path

RAIZ = Path(__file__).parent
SRC = RAIZ / 'src'

PAGINAS = {
    'Main.dc.html': ('index.html', 'Minha Oficina'),
    'Login.dc.html': ('login.html', 'Minha Oficina — entrar'),
    'Aprovacao.dc.html': ('aprovacao.html', 'Aprovar orçamento'),
}

LINKS = {'Main.dc.html': 'index.html', 'Login.dc.html': 'login.html', 'Aprovacao.dc.html': 'aprovacao.html'}

IMAGENS = {
    'a43502f4bff8d474224573e6696b24f8': 'img/honda.png',
    'bedcfb5f45c3be264da6f69a770ec574': 'img/yamaha.png',
    'fdefb710a0cf083fb10634d1dbc74080': 'img/pix.png',
    'c9037b92de146d8cdcf862cd7a4afcdd': 'img/whatsapp.png',
    'b72fad0aeff32e1a5cc5544fe7acb02e': 'img/mt03.jpg',
    '3c6a58f7401bb8ad26030e7acc547ebf': 'img/nmax.jpg',
    '8fe5c733e1179cc59b2667cdfc67248d': 'img/pcx.jpg',
    'a2f409746ba9bcea9774d52fe75dca2e': 'img/xmax.jpg',
}

# o que fica salvo no celular, por página
SALVAR = {
    'index.html': ['history', 'osNum', 'stock', 'shop', 'mecanico', 'fator', 'edits', 'names', 'uid', 'clientes', 'ocultos'],
}

MODELO = '''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#18181B">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>{titulo}</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-192.png">
{helmet}
<style>
html, body {{ height: 100%; }}
body {{ margin: 0; background: #18181B; }}
#app {{ height: 100%; display: flex; justify-content: center; }}
#app > div {{ padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }}
</style>
</head>
<body>
<div id="app"></div>
<template id="tela">{corpo}</template>
<script src="dc-runtime.js"></script>
<script>
{script}
DC.mount(Component, document.getElementById('tela'), document.getElementById('app'), {opcoes});
</script>
<script>
if ('serviceWorker' in navigator) {{
  window.addEventListener('load', function () {{ navigator.serviceWorker.register('sw.js'); }});
}}
</script>
</body>
</html>
'''


def converter(nome_src):
    s = (SRC / nome_src).read_text(encoding='utf-8')
    destino, titulo = PAGINAS[nome_src]
    xdc = s[s.index('<x-dc>') + len('<x-dc>'):s.index('</x-dc>')]
    helmet = ''
    m = re.search(r'<helmet>(.*?)</helmet>', xdc, re.S)
    if m:
        helmet = m.group(1).strip()
        xdc = xdc[:m.start()] + xdc[m.end():]
    script = re.search(r'<script type="text/x-dc"[^>]*>(.*?)</script>', s, re.S).group(1).strip()

    # a tela ocupa o celular inteiro (no canvas ela tinha tamanho fixo)
    def tela_cheia(mt):
        estilo = mt.group(1)
        estilo = re.sub(r'width:\s*\d+px;\s*height:\s*\d+px;', 'width: 100%; max-width: 560px; height: 100dvh;', estilo, count=1)
        estilo = re.sub(r';\s*position:\s*absolute;\s*left:\s*-?\d+px;\s*top:\s*-?\d+px', '', estilo)
        return '<div style="' + estilo + '"'
    xdc = re.sub(r'<div style="([^"]*)"', tela_cheia, xdc.strip(), count=1)

    for velho, novo in LINKS.items():
        xdc = xdc.replace('href="' + velho + '"', 'href="' + novo + '"')
    for blob, arq in IMAGENS.items():
        xdc = xdc.replace('/_blob/' + blob, arq)
        script = script.replace('/_blob/' + blob, arq)
        helmet = helmet.replace('/_blob/' + blob, arq)

    campos = SALVAR.get(destino)
    opcoes = '{}' if not campos else '{ salvarEm: "minhaOficina", campos: ' + str(campos).replace("'", '"') + ' }'
    html = MODELO.format(titulo=titulo, helmet=helmet, corpo=xdc, script=script, opcoes=opcoes)
    (RAIZ / destino).write_text(html, encoding='utf-8')
    print('ok', destino, len(html), 'bytes')


if __name__ == '__main__':
    for nome in PAGINAS:
        converter(nome)
