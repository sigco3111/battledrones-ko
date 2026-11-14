/* Battle Drones 한국어판 — 표시 시점 번역 오버레이.
 * 원문(영어)은 소스에 그대로 두고, 화면에 보이는 문구만 한국어로 바꾼다.
 * 오른쪽 아래 버튼으로 한국어/English를 전환한다(localStorage에 기억). */
type Dict = Record<string, string>;
type Part = { s?: Dict; r?: [string, string][] };
const PARTS = import.meta.glob("./ko/*.json", { eager: true }) as Record<string, Part>;
const RAW: Dict = Object.create(null);
const RULES: [RegExp, string][] = [];
for (const key of Object.keys(PARTS).sort()) {
  const part = PARTS[key];
  if (part.s) for (const k in part.s) RAW[k] = part.s[k];
  if (part.r) for (const rule of part.r) RULES.push([new RegExp(rule[0]), rule[1]]);
}
const NORM: Dict = Object.create(null);
for (const k in RAW) {
  const n = k.replace(/\s+/g, " ").trim();
  if (NORM[n] === undefined) NORM[n] = RAW[k];
}
const KEY = "battledrones-ko-lang";
let lang: "ko" | "en" = "ko";
try { if (localStorage.getItem(KEY) === "en") lang = "en"; } catch (e) { /* 저장소 없음 */ }

function core(value: string): string | null {
  if (RAW[value] !== undefined) return RAW[value];
  const n = value.replace(/\s+/g, " ").trim();
  if (NORM[n] !== undefined) return NORM[n];
  for (let i = 0; i < RULES.length; i++) if (RULES[i][0].test(value)) return value.replace(RULES[i][0], RULES[i][1]);
  return null;
}

function tr(value: string): string {
  if (!value || lang === "en" || !/[A-Za-z]/.test(value)) return value;
  const head = value.slice(0, value.length - value.trimStart().length);
  const tail = value.slice(value.trimEnd().length);
  const body = value.slice(head.length, value.length - tail.length);
  if (!body) return value;
  const out = core(body);
  return out === null ? value : head + out + tail;
}

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE", "KBD", "CANVAS", "SVG", "TITLE"]);
const ATTRS = ["title", "aria-label", "placeholder", "alt"];
const BAR = "bd-ko-bar";
const srcText = new WeakMap<Node, string>();
const outText = new WeakMap<Node, string>();
const attrSrc = new WeakMap<Element, Record<string, string>>();

function doText(node: Text) {
  const cur = node.nodeValue || "";
  if (outText.get(node) !== cur) srcText.set(node, cur);
  const from = srcText.get(node);
  if (from === undefined) return;
  const out = lang === "en" ? from : tr(from);
  if (out !== cur) { outText.set(node, out); node.nodeValue = out; }
}

function doAttrs(el: Element) {
  let map = attrSrc.get(el);
  for (let i = 0; i < ATTRS.length; i++) {
    const name = ATTRS[i];
    const cur = el.getAttribute(name);
    if (!cur || !/[A-Za-z]/.test(cur)) continue;
    if (!map) { map = {}; attrSrc.set(el, map); }
    if (map[name] === undefined || cur !== tr(map[name])) map[name] = cur;
    const out = lang === "en" ? map[name] : tr(map[name]);
    if (out !== cur) el.setAttribute(name, out);
  }
}

function walk(root: Node) {
  if (!root || root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
  const doc = root.ownerDocument || (root as Document);
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentNode as Element | null;
      if (!p || p.nodeType !== 1 || SKIP.has(p.nodeName) || (p as HTMLElement).isContentEditable) return NodeFilter.FILTER_REJECT;
      if ((p.closest && p.closest("#" + BAR))) return NodeFilter.FILTER_REJECT;
      return /[A-Za-z]/.test(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  for (const node of nodes) doText(node);
  const els = (root as Element).querySelectorAll ? (root as Element).querySelectorAll("[title],[aria-label],[placeholder],[alt]") : [];
  for (const el of Array.from(els)) doAttrs(el);
}

let sourceTitle: string | null = null;
function syncTitle() {
  if (sourceTitle === null) sourceTitle = document.title;
  const out = lang === "en" ? sourceTitle : (core(sourceTitle) || sourceTitle);
  if (out && document.title !== out) document.title = out;
}

const observer = new MutationObserver((records) => {
  for (const rec of records) {
    if (rec.type === "characterData") { doText(rec.target as Text); continue; }
    if (rec.type === "attributes") { if (rec.target.nodeType === 1) doAttrs(rec.target as Element); continue; }
    rec.addedNodes.forEach((node) => {
      if (node.nodeType === 3) doText(node as Text);
      else if (node.nodeType === 1 && (node as Element).id !== BAR) walk(node);
    });
  }
});

let bar: HTMLDivElement | null = null;
let label: HTMLSpanElement | null = null;

function paintBar() {
  if (!label) return;
  label.textContent = lang === "ko" ? "English" : "한국어";
  label.title = lang === "ko" ? "Show the original English text" : "한국어로 보기";
}

function setLang(next: "ko" | "en") {
  lang = next;
  try { localStorage.setItem(KEY, next); } catch (e) { /* 저장소 없음 */ }
  walk(document.body);
  syncTitle();
  paintBar();
}

function mountBar() {
  if (bar || document.getElementById(BAR)) return;
  bar = document.createElement("div");
  bar.id = BAR;
  bar.style.cssText = "position:fixed;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:2147483647;display:flex;gap:8px;align-items:center;font:12px/1.4 system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#c8d2e4;background:rgba(8,12,20,.82);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:5px 10px;user-select:none";
  const home = document.createElement("a");
  home.href = "https://github.com/sigco3111/battledrones-ko";
  home.target = "_blank";
  home.rel = "noopener";
  home.textContent = "한국어판";
  home.style.cssText = "color:#93a9cd;text-decoration:none";
  label = document.createElement("span");
  label.style.cssText = "font:inherit;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:1px 9px;cursor:pointer";
  label.addEventListener("click", () => setLang(lang === "ko" ? "en" : "ko"));
  bar.appendChild(home);
  bar.appendChild(label);
  document.body.appendChild(bar);
  paintBar();
}

const fontStyle = document.createElement("style");
fontStyle.textContent = "body,button,input,select,textarea{font-family:'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',system-ui,sans-serif}";
document.head.appendChild(fontStyle);

function boot() {
  walk(document.body);
  syncTitle();
  mountBar();
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

// 메뉴 카드·상단 상태처럼 자주 다시 그려지는 화면에서도 번역이 유지되도록 주기적으로 다시 훑습니다.
setInterval(() => {
  if (lang === "ko" && document.body) walk(document.body);
}, 400);
