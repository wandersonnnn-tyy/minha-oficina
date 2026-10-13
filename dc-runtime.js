/*
 * Motor das telas do Minha Oficina.
 * Lê um <template> com {{buracos}}, <sc-if> e <sc-for>, monta o HTML a partir
 * do renderVals() do componente e redesenha a cada setState.
 */
(function () {
  'use strict';

  class DCLogic {
    constructor(props) {
      this.props = props || {};
      this.state = {};
    }
    setState(change, cb) {
      const c = typeof change === 'function' ? change(this.state) : change;
      this.state = Object.assign({}, this.state, c);
      if (this.__agendar) this.__agendar();
      if (cb) cb();
    }
    forceUpdate() {
      if (this.__agendar) this.__agendar();
    }
  }

  const BURACO = /\{\{\s*([^}]+?)\s*\}\}/g;
  const SO_BURACO = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

  function resolver(caminho, escopo) {
    const p = caminho.trim();
    if (p === 'true') return true;
    if (p === 'false') return false;
    if (p === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(p)) return Number(p);
    if (/^'.*'$/.test(p) || /^".*"$/.test(p)) return p.slice(1, -1);
    const partes = p.split('.');
    let v;
    for (let i = escopo.length - 1; i >= 0; i--) {
      if (escopo[i] && Object.prototype.hasOwnProperty.call(escopo[i], partes[0])) { v = escopo[i][partes[0]]; break; }
    }
    for (let k = 1; k < partes.length && v != null; k++) v = v[partes[k]];
    return v;
  }

  function interpolar(texto, escopo) {
    const m = texto.match(SO_BURACO);
    if (m) return resolver(m[1], escopo);
    return texto.replace(BURACO, (_, c) => {
      const v = resolver(c, escopo);
      return v == null ? '' : String(v);
    });
  }

  const EVENTOS = { onclick: 'click', ontouchstart: 'touchstart', ontouchend: 'touchend', oninput: 'input', onkeydown: 'keydown', onblur: 'blur', onfocus: 'focus' };

  function eventoDe(nome, el) {
    const n = nome.toLowerCase();
    if (n === 'onchange') {
      const t = (el.getAttribute('type') || '').toLowerCase();
      return (el.tagName === 'INPUT' && t !== 'checkbox' && t !== 'radio' && t !== 'file') || el.tagName === 'TEXTAREA' ? 'input' : 'change';
    }
    return EVENTOS[n] || n.slice(2);
  }

  function montar(no, escopo, destino) {
    no.childNodes.forEach((filho) => {
      if (filho.nodeType === 3) {
        const t = filho.nodeValue;
        destino.appendChild(document.createTextNode(t.indexOf('{{') === -1 ? t : String(interpolar(t, escopo) ?? '')));
        return;
      }
      if (filho.nodeType !== 1) return;
      const tag = filho.tagName.toLowerCase();
      if (tag === 'sc-if') {
        if (interpolar(filho.getAttribute('value') || '', escopo)) montar(filho, escopo, destino);
        return;
      }
      if (tag === 'sc-for') {
        const lista = interpolar(filho.getAttribute('list') || '', escopo) || [];
        const como = filho.getAttribute('as') || 'item';
        lista.forEach((item, i) => montar(filho, escopo.concat([{ [como]: item, $index: i }]), destino));
        return;
      }
      const el = filho.cloneNode(false);
      Array.from(filho.attributes).forEach((a) => {
        const nome = a.name;
        if (nome.indexOf('hint-') === 0) { el.removeAttribute(nome); return; }
        if (/^on/i.test(nome)) {
          el.removeAttribute(nome);
          const fn = interpolar(a.value, escopo);
          if (typeof fn === 'function') el.addEventListener(eventoDe(nome, filho), fn);
          return;
        }
        if (a.value.indexOf('{{') === -1) return;
        const v = interpolar(a.value, escopo);
        if (nome === 'checked' || nome === 'disabled' || nome === 'selected') {
          el.removeAttribute(nome);
          el[nome] = !!v;
          if (v) el.setAttribute(nome, '');
          return;
        }
        if (nome === 'value') {
          el.setAttribute('value', v == null ? '' : String(v));
          el.value = v == null ? '' : String(v);
          return;
        }
        if (v == null || v === false) { el.removeAttribute(nome); return; }
        el.setAttribute(nome, String(v));
      });
      montar(filho.content || filho, escopo, el);
      destino.appendChild(el);
    });
  }

  function caminhoAte(el, raiz) {
    const p = [];
    while (el && el !== raiz) {
      const pai = el.parentNode;
      if (!pai) return null;
      p.unshift(Array.prototype.indexOf.call(pai.children, el));
      el = pai;
    }
    return el === raiz ? p : null;
  }

  function seguir(raiz, caminho) {
    let el = raiz;
    for (const i of caminho) { el = el && el.children[i]; }
    return el;
  }

  function mount(Componente, template, raiz, opcoes) {
    opcoes = opcoes || {};
    const comp = new Componente({});
    const chave = opcoes.salvarEm;
    const campos = opcoes.campos || [];

    if (chave) {
      try {
        const salvo = JSON.parse(localStorage.getItem(chave) || 'null');
        if (salvo) campos.forEach((k) => { if (k in salvo) comp.state[k] = salvo[k]; });
      } catch (e) { /* dados antigos ilegíveis: começa do zero */ }
    }

    let pendente = false;
    let timerSalvar = null;

    function salvar() {
      if (!chave) return;
      clearTimeout(timerSalvar);
      timerSalvar = setTimeout(() => {
        const dados = {};
        campos.forEach((k) => { dados[k] = comp.state[k]; });
        try { localStorage.setItem(chave, JSON.stringify(dados)); } catch (e) { console.warn('Não foi possível salvar', e); }
      }, 300);
    }

    function desenhar() {
      pendente = false;
      const ativo = document.activeElement;
      const caminhoFoco = ativo && raiz.contains(ativo) ? caminhoAte(ativo, raiz) : null;
      let selIni = null, selFim = null;
      try { selIni = ativo.selectionStart; selFim = ativo.selectionEnd; } catch (e) { /* sem seleção */ }
      const rolagens = [];
      raiz.querySelectorAll('*').forEach((el) => { if (el.scrollTop > 0) rolagens.push([caminhoAte(el, raiz), el.scrollTop]); });

      const frag = document.createDocumentFragment();
      montar(template.content, [comp.renderVals()], frag);
      raiz.replaceChildren(frag);

      rolagens.forEach(([c, top]) => { const el = c && seguir(raiz, c); if (el) el.scrollTop = top; });
      if (caminhoFoco) {
        const el = seguir(raiz, caminhoFoco);
        if (el && el.tagName === ativo.tagName && typeof el.focus === 'function') {
          el.focus({ preventScroll: true });
          try { if (selIni != null) el.setSelectionRange(selIni, selFim); } catch (e) { /* campo sem cursor */ }
        }
      }
      salvar();
    }

    comp.__agendar = () => {
      if (pendente) return;
      pendente = true;
      Promise.resolve().then(desenhar);
    };
    desenhar();
    if (typeof comp.componentDidMount === 'function') comp.componentDidMount();
    return comp;
  }

  window.DCLogic = DCLogic;
  window.DC = { mount: mount };
})();
