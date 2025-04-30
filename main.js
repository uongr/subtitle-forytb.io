// main.js

// === 初期設定 ===
const DEFAULT_VIDEO_ID = "EJlmCPF55ZQ";
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzqGLb-WTleiLCt1ee3tDux4Lr4AczdrILq-w1AIAyXgRriASpQylx7cN-_L6Dke2Z72Q/exec"; // 最新デプロイGAS URL

// === ユーティリティ関数 ===
function extractVideoId(url) {
  const regex = /(?:v=|\.be\/|embed\/)([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function formatTimeFromDateStr(str) {
  const date = new Date(str);
  if (isNaN(date)) return "00:00.0";
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(Math.floor(date.getMilliseconds() / 100));
  return `${mm}:${ss}.${ms}`;
}

function createSubtitleRow(time = "00:00.0", text = "") {
  const row = document.createElement("div");
  row.className = "subtitle-row";

  const timeInput = document.createElement("input");
  timeInput.type = "text";
  timeInput.className = "time-input";
  timeInput.value = time;

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.className = "text-input";
  textInput.value = text;

  row.appendChild(timeInput);
  row.appendChild(textInput);
  return row;
}

// === DOM読込後に各セクションを読み込み ===
async function loadComponent(id, file) {
  const res = await fetch(file);
  const html = await res.text();
  document.getElementById(id).innerHTML = html;
}

window.onload = async () => {
  await loadComponent("header", "Header.html");
  await loadComponent("video", "Video.html");
  await loadComponent("controls", "Controls.html");
  await loadComponent("editor", "SubtitleEditor.html");
  initApp();
};

// === メインの初期化処理 ===
async function initApp() {
  const videoInput = document.getElementById("video-url-input");
  const loadBtn = document.getElementById("load-video-btn");
  const subtitleContainer = document.getElementById("subtitle-container");
  const playerFrame = document.getElementById("yt-player");
  const addBtn = document.getElementById("add-subtitle-btn");
  const dropdownToggle = document.getElementById("toggle-sheets-link");
  const sheetList = document.getElementById("sheet-list");

  let currentSheet = "";

  // ▼字幕一覧の表示切替
  dropdownToggle.onclick = async () => {
    if (sheetList.style.display === "none") {
      const response = await fetch(`${GAS_API_URL}?mode=list`);
      const data = await response.json();
      sheetList.innerHTML = "";
      data.sheets.forEach(sheet => {
        const item = document.createElement("div");
        item.className = "sheet-item";
        item.textContent = sheet;
        item.onclick = () => loadSubtitles(sheet);
        sheetList.appendChild(item);
      });
      sheetList.style.display = "block";
      dropdownToggle.textContent = "▲保存済み字幕データ一覧";
    } else {
      sheetList.style.display = "none";
      dropdownToggle.textContent = "▼保存済み字幕データ一覧";
    }
  };

  // ▼動画URLから読み込み
  loadBtn.onclick = () => {
    const url = videoInput.value;
    const videoId = extractVideoId(url) || DEFAULT_VIDEO_ID;
    loadVideo(videoId);
  };

  // ▼動画と字幕のロード
  function loadVideo(videoId) {
    playerFrame.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
  }

  async function loadSubtitles(sheetName) {
    currentSheet = sheetName;
    document.getElementById("current-sheet-name").textContent = sheetName;
    const response = await fetch(`${GAS_API_URL}?mode=get&sheet=${sheetName}`);
    const data = await response.json();
    subtitleContainer.innerHTML = "";
    (data.subtitles || []).forEach(sub => {
      const time = formatTimeFromDateStr(sub.time);
      const row = createSubtitleRow(time, sub.text);
      subtitleContainer.appendChild(row);
    });
    // 空行追加（30行保証）
    for (let i = data.subtitles.length; i < 30; i++) {
      subtitleContainer.appendChild(createSubtitleRow());
    }
    loadVideo(data.videoId || DEFAULT_VIDEO_ID);
  }

  // ▼編集行追加
  addBtn.onclick = () => {
    subtitleContainer.appendChild(createSubtitleRow());
  };

  // ▼初期化時にデフォルト動画表示
  loadVideo(DEFAULT_VIDEO_ID);
}
