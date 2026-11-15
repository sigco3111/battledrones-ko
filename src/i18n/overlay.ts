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


let creditBtn: HTMLButtonElement | null = null;
let creditPanel: HTMLDivElement | null = null;

const CREDITS: Record<"ko" | "en", [string, string][]> = {
  ko: [
    ["원작", "Battle Drones © simonw — github.com/simonw/battledrones"],
    ["원작 라이선스", "Apache License 2.0 (원문 LICENSE 유지, NOTICE에 변경 고지)"],
    ["한국어판", "번역·표시 시점 오버레이·빌드 sigco3111"],
    ["번역 사전", "약 550항목 (src/i18n/ko/*.json)"],
    ["사용 라이브러리", "three.js (MIT, r185) · qrcode-generator (MIT) · Vite (MIT) · vite-plugin-pwa (MIT)"],
    ["아트·사운드", "아트: 원작 파이프라인(OpenAI gpt-image-2.5) · 사운드는 실시간 합성"],
    ["안내", "원작자와 무관한 비공식 2차 창작입니다. 권리자의 요청이 있으면 즉시 비공개·삭제합니다."]
  ],
  en: [
    ["Original", "Battle Drones © simonw — github.com/simonw/battledrones"],
    ["Original license", "Apache License 2.0 (verbatim LICENSE kept, changes noted in NOTICE)"],
    ["Korean edition", "translation, display-time overlay and build by sigco3111"],
    ["Dictionary", "about 550 entries (src/i18n/ko/*.json)"],
    ["Libraries", "three.js (MIT, r185) · qrcode-generator (MIT) · Vite (MIT) · vite-plugin-pwa (MIT)"],
    ["Art and sound", "art: original pipeline (OpenAI gpt-image-2.5) · sound synthesised live"],
    ["Notice", "Unofficial fan translation, not affiliated with the original author. Removed on request."]
  ]
};

function renderCredits() {
  if (!creditPanel) return;
  creditPanel.textContent = "";
  const head = document.createElement("div");
  head.textContent = lang === "ko" ? "배틀 드론 한국어판 · 크레딧" : "Battle Drones KO · Credits";
  head.style.cssText = "font-weight:600;font-size:13px;color:#e6edfa;margin-bottom:8px";
  creditPanel.appendChild(head);
  for (const row of CREDITS[lang]) {
    const line = document.createElement("div");
    line.style.cssText = "margin:4px 0";
    const key = document.createElement("span");
    key.textContent = row[0] + ": ";
    key.style.color = "#93a9cd";
    const val = document.createElement("span");
    val.textContent = row[1];
    line.appendChild(key);
    line.appendChild(val);
    creditPanel.appendChild(line);
  }
  const links = document.createElement("div");
  links.style.cssText = "margin-top:10px;display:flex;gap:12px;flex-wrap:wrap";
  const made: [string, string][] = [
    ["https://github.com/simonw/battledrones", lang === "ko" ? "원작 저장소" : "Original repo"],
    ["https://github.com/sigco3111/battledrones-ko", lang === "ko" ? "한국어판 저장소" : "Korean repo"],
    ["https://github.com/simonw/battledrones/blob/main/LICENSE", lang === "ko" ? "라이선스 전문" : "License"]
  ];
  for (const hit of made) {
    const a = document.createElement("a");
    a.href = hit[0];
    a.textContent = hit[1];
    a.target = "_blank";
    a.rel = "noopener";
    a.style.cssText = "color:#8fb7ff;text-decoration:none";
    links.appendChild(a);
  }
  creditPanel.appendChild(links);
}

function toggleCredits() {
  if (!creditPanel) return;
  const open = creditPanel.style.display === "block";
  creditPanel.style.display = open ? "none" : "block";
  creditBtn?.setAttribute("aria-expanded", open ? "false" : "true");
}

function paintBar() {
  if (!label) return;
  label.textContent = lang === "ko" ? "English" : "한국어";
  if (creditBtn) creditBtn.textContent = lang === "ko" ? "크레딧" : "Credits";
  renderCredits();
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
  creditBtn = document.createElement("button");
  creditBtn.type = "button";
  creditBtn.textContent = "크레딧";
  creditBtn.setAttribute("aria-expanded", "false");
  creditBtn.style.cssText = "font:inherit;color:#93a9cd;background:none;border:0;padding:0 2px;cursor:pointer";
  creditBtn.addEventListener("click", (e) => { e.preventDefault(); toggleCredits(); });
  creditPanel = document.createElement("div");
  creditPanel.style.cssText = "position:fixed;right:10px;bottom:calc(46px + env(safe-area-inset-bottom));z-index:2147483647;max-width:min(92vw,430px);max-height:68vh;overflow:auto;background:rgba(8,12,20,.96);border:1px solid rgba(255,255,255,.22);border-radius:12px;padding:12px 14px;color:#c8d2e4;font:12px/1.55 system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;display:none;box-shadow:0 8px 30px rgba(0,0,0,.5)";
  renderCredits();
  bar.appendChild(home);
  bar.appendChild(creditBtn);
  bar.appendChild(label);
  bar.appendChild(creditPanel);
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
