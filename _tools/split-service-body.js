'use strict';
const fs = require('fs');

const PAGES = ['laser.html', 'facial.html'];
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function topLevelNodes(html) {
  const re = /<(\/?)([a-zA-Z0-9-]+)([^>]*)>/g;
  const nodes = [];
  let depth = 0;
  let start = -1;
  let tag = '';
  let m;
  while ((m = re.exec(html))) {
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    if (!closing && (name === 'script' || name === 'style')) {
      const end = html.toLowerCase().indexOf('</' + name + '>', re.lastIndex);
      if (end !== -1) re.lastIndex = end + name.length + 3;
      continue;
    }
    if (closing) {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start !== -1) {
        nodes.push({ tag: tag, html: html.slice(start, re.lastIndex) });
        start = -1;
        tag = '';
      }
      continue;
    }
    if (VOID.has(name)) {
      if (depth === 0) nodes.push({ tag: name, html: m[0] });
      continue;
    }
    if (depth === 0) {
      start = m.index;
      tag = name;
    }
    depth += 1;
  }
  return nodes;
}

function isWideFigure(html) {
  return /^<figure\b/i.test(html) && !/class="[^"]*\bportrait\b/i.test(html);
}

function sectionHtml(group) {
  const content = group.content.map(function (node) {
    let html = node.html;
    if (isWideFigure(html)) {
      html = html.replace(/sizes="\(min-width: (?:900|760)px\) (?:760|640)px, 92vw"/g, 'sizes="(min-width: 900px) 1160px, 92vw"');
    }
    return html;
  }).join('');
  if (group.h2) {
    return '<section class="svc-sec"><div class="svc-sec__label">' + group.h2.html + '</div><div class="svc-sec__content">' + content + '</div></section>';
  }
  if (!content) return '';
  return '<section class="svc-sec svc-sec--intro"><div class="svc-sec__label" aria-hidden="true"></div><div class="svc-sec__content">' + content + '</div></section>';
}

for (const file of PAGES) {
  let text = fs.readFileSync(file, 'utf8');
  const bom = text.charCodeAt(0) === 0xFEFF;
  if (bom) text = text.slice(1);
  const eol = text.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  text = text.replace(/\r\n/g, '\n');

  const leads = text.match(/<p class="svc-lead wrap">[\s\S]*?<\/p>/g) || [];
  if (leads.length !== 1) {
    throw new Error(file + ': expected one svc-lead paragraph, found ' + leads.length);
  }
  text = text.replace(/<p class="svc-lead wrap">[\s\S]*?<\/p>/, '');

  const bodyStart = text.indexOf('<article class="svc-body">');
  if (bodyStart === -1) throw new Error(file + ': no svc-body');
  const articleEnd = text.indexOf('</article>', bodyStart);
  if (articleEnd === -1) throw new Error(file + ': no article end');
  const divStart = text.indexOf('<div>', bodyStart);
  if (divStart === -1 || divStart > articleEnd) throw new Error(file + ': no body div');
  const divOpenEnd = divStart + 5;
  const divEnd = text.lastIndexOf('</div>', articleEnd);
  if (divEnd === -1 || divEnd < divOpenEnd) throw new Error(file + ': no body div end');

  const inner = text.slice(divOpenEnd, divEnd);
  const nodes = topLevelNodes(inner);
  const intro = { content: [] };
  const groups = [intro];
  let current = intro;
  for (const node of nodes) {
    if (node.tag === 'h2') {
      current = { h2: node, content: [] };
      groups.push(current);
    } else {
      current.content.push(node);
    }
  }
  const sections = groups.map(sectionHtml).filter(Boolean);
  if (!sections.length) throw new Error(file + ': no sections produced');
  const replacement = '\n' + sections.join('\n') + '\n';
  text = text.slice(0, divOpenEnd) + replacement + text.slice(divEnd);

  if (eol === '\r\n') text = text.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, (bom ? '\uFEFF' : '') + text, 'utf8');
  console.log(file + ': removed 1 svc-lead, ' + groups.length + ' groups, ' + sections.length + ' sections');
}
