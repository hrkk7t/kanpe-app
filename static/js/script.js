let appData = {};
let currentBig = "";
let currentMid = "";
let currentSmall = "";
let currentFontSize = 1.2;
let currentNoteColor = "#fff9c4";

async function loadData() {
    const response = await fetch('/api/data');
    appData = await response.json();
    const bigKeys = Object.keys(appData);
    if (bigKeys.length > 0) {
        currentBig = bigKeys[0];
        const midKeys = Object.keys(appData[currentBig]);
        currentMid = midKeys[0];
        const smallKeys = Object.keys(appData[currentBig][currentMid]);
        currentSmall = smallKeys[0];
        updateAllUI();
    }
}

function updateAllUI() {
    renderTabs();
    renderMidSelect();
    renderSmallSelect();
    renderBreadcrumb();
    renderContent();
}

function renderContent() {
    const questionInput = document.getElementById('question');
    questionInput.value = appData[currentBig][currentMid][currentSmall].question;
    document.getElementById('answer').value = appData[currentBig][currentMid][currentSmall].answer;
    document.getElementById('memo').value = appData[currentBig][currentMid][currentSmall].memo || "";
    
    // 質問欄の高さを内容に合わせて調整
    autoResizeQuestion();
    
    const note = document.querySelector('.sticky-note');
    note.style.top = appData[currentBig][currentMid][currentSmall].top || "80px";
    note.style.left = appData[currentBig][currentMid][currentSmall].left || "740px";
    note.style.right = "auto";

    setNoteColor(appData[currentBig][currentMid][currentSmall].color || "#fff9c4");
    // 現在のフォントサイズ設定を適用
    applyFontSize();
}

function autoResizeQuestion() {
    const el = document.getElementById('question');
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function saveCurrentInput() {
    if (currentBig && currentMid && currentSmall && appData[currentBig] && appData[currentBig][currentMid] && appData[currentBig][currentMid][currentSmall]) {
        const item = appData[currentBig][currentMid][currentSmall];
        item.question = document.getElementById('question').value;
        item.answer = document.getElementById('answer').value;
        item.memo = document.getElementById('memo').value;
        item.color = currentNoteColor;
        const note = document.querySelector('.sticky-note');
        item.top = note.style.top;
        item.left = note.style.left;
    }
}

async function saveData() {
    saveCurrentInput();
    
    const sound = document.getElementById('save-sound');
    if (sound) { sound.currentTime = 0; sound.play().catch(() => {}); }

    const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
    });
    if (response.ok) showToast("保存しました！");
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="material-symbols-outlined">check_circle</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function initDraggable() {
    const note = document.querySelector('.sticky-note');
    const handle = document.querySelector('.sticky-note-title');
    let isDragging = false, offsetX, offsetY;

    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - note.offsetLeft;
        offsetY = e.clientY - note.offsetTop;
        note.style.opacity = '0.7';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        note.style.left = (e.clientX - offsetX) + 'px';
        note.style.top = (e.clientY - offsetY) + 'px';
        note.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            note.style.opacity = '1.0';
            saveCurrentInput();
        }
    });
}

function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('dark-mode', isDark);
    const icon = document.getElementById('dark-mode-icon');
    if (icon) icon.innerText = isDark ? 'light_mode' : 'dark_mode';
}

function changeFontSize(step) {
    currentFontSize = Math.max(0.8, Math.min(3.0, currentFontSize + step));
    applyFontSize();
}

function applyFontSize() {
    document.getElementById('question').style.fontSize = (currentFontSize + 0.2) + "em";
    document.getElementById('answer').style.fontSize = currentFontSize + "em";
}

function setNoteColor(color) {
    currentNoteColor = color;
    document.querySelector('.sticky-note').style.backgroundColor = color;
}

function renderTabs() {
    const container = document.getElementById('tabs-container');
    container.innerHTML = "";
    Object.keys(appData).forEach(big => {
        const tab = document.createElement('div');
        tab.className = `tab ${big === currentBig ? 'active' : ''}`;
        tab.innerText = big;
        tab.onclick = () => { saveCurrentInput(); currentBig = big; currentMid = Object.keys(appData[big])[0]; currentSmall = Object.keys(appData[big][currentMid])[0]; updateAllUI(); };
        container.appendChild(tab);
    });
}

function renderMidSelect() {
    const select = document.getElementById('mid-select');
    select.innerHTML = "";
    Object.keys(appData[currentBig]).forEach(mid => {
        const opt = new Option(mid, mid);
        if (mid === currentMid) opt.selected = true;
        select.add(opt);
    });
}

function renderSmallSelect() {
    const select = document.getElementById('small-select');
    select.innerHTML = "";
    Object.keys(appData[currentBig][currentMid]).forEach(small => {
        const opt = new Option(small, small);
        if (small === currentSmall) opt.selected = true;
        select.add(opt);
    });
}

function renderBreadcrumb() {
    const container = document.getElementById('breadcrumb');
    container.innerHTML = "";
    
    const createSpan = (text, onClickHandler) => {
        const span = document.createElement('span');
        span.innerText = text;
        span.onclick = (e) => onClickHandler(e);
        return span;
    };

    container.appendChild(createSpan(currentBig, (e) => showBreadcrumbPopup(e, 'mid')));
    container.appendChild(document.createTextNode(' ＞ '));
    container.appendChild(createSpan(currentMid, (e) => showBreadcrumbPopup(e, 'small')));
    container.appendChild(document.createTextNode(' ＞ '));
    container.appendChild(createSpan(currentSmall, () => document.getElementById('small-select').focus()));
}

function showBreadcrumbPopup(event, type) {
    // 既存のポップアップを削除
    const existing = document.getElementById('breadcrumb-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'breadcrumb-popup';
    popup.className = 'breadcrumb-popup';
    
    let items = [];
    let currentActive = "";
    let onSelect = null;

    if (type === 'mid') {
        items = Object.keys(appData[currentBig]);
        currentActive = currentMid;
        onSelect = (val) => {
            currentMid = val;
            currentSmall = Object.keys(appData[currentBig][val])[0];
        };
    } else {
        items = Object.keys(appData[currentBig][currentMid]);
        currentActive = currentSmall;
        onSelect = (val) => {
            currentSmall = val;
        };
    }

    items.forEach(val => {
        const item = document.createElement('div');
        item.className = 'popup-item' + (val === currentActive ? ' active' : '');
        item.innerText = val;
        item.onclick = (e) => {
            e.stopPropagation();
            saveCurrentInput();
            onSelect(val);
            updateAllUI();
            popup.remove();
        };
        popup.appendChild(item);
    });

    document.body.appendChild(popup);
    popup.style.left = event.pageX + 'px';
    popup.style.top = (event.pageY + 10) + 'px';

    // ポップアップの外側をクリックしたら閉じる設定
    setTimeout(() => {
        window.addEventListener('click', function closePopup(e) {
            if (!popup.contains(e.target)) {
                popup.remove();
                window.removeEventListener('click', closePopup);
            }
        }, { once: true });
    }, 0);
}

function changeMid() {
    saveCurrentInput();
    currentMid = document.getElementById('mid-select').value;
    currentSmall = Object.keys(appData[currentBig][currentMid])[0];
    updateAllUI();
}

function changeSmall() {
    saveCurrentInput();
    currentSmall = document.getElementById('small-select').value;
    renderContent();
}

function addBig() {
    const name = prompt("新しい大タブの名前:");
    if (name && !appData[name]) {
        appData[name] = { "新規中カテゴリ": { "新規小カテゴリ": { "question": "", "answer": "" } } };
        currentBig = name; currentMid = "新規中カテゴリ"; currentSmall = "新規小カテゴリ";
        updateAllUI();
    }
}

function addMid() {
    const name = prompt("新しい中カテゴリの名前:");
    if (name && !appData[currentBig][name]) {
        appData[currentBig][name] = { "新規小カテゴリ": { "question": "", "answer": "" } };
        currentMid = name; currentSmall = "新規小カテゴリ";
        updateAllUI();
    }
}

function addSmall() {
    const name = prompt("新しい小カテゴリの名前:");
    if (name && !appData[currentBig][currentMid][name]) {
        appData[currentBig][currentMid][name] = { "question": "", "answer": "" };
        currentSmall = name;
        updateAllUI();
    }
}

function renameBig() {
    const newName = prompt(`大タブ「${currentBig}」の新しい名前:`, currentBig);
    if (newName && newName !== currentBig && !appData[newName]) {
        appData[newName] = appData[currentBig];
        delete appData[currentBig];
        currentBig = newName;
        updateAllUI();
    }
}

function deleteBig() {
    if (Object.keys(appData).length <= 1) { alert("最低1つの大タブが必要です。"); return; }
    if (confirm(`大タブ「${currentBig}」を削除しますか？`)) {
        delete appData[currentBig];
        currentBig = Object.keys(appData)[0];
        currentMid = Object.keys(appData[currentBig])[0];
        currentSmall = Object.keys(appData[currentBig][currentMid])[0];
        updateAllUI();
    }
}

function renameMid() {
    const newName = prompt(`中カテゴリ「${currentMid}」の新しい名前:`, currentMid);
    if (newName && newName !== currentMid && !appData[currentBig][newName]) {
        appData[currentBig][newName] = appData[currentBig][currentMid];
        delete appData[currentBig][currentMid];
        currentMid = newName;
        updateAllUI();
    }
}

function deleteMid() {
    if (Object.keys(appData[currentBig]).length <= 1) { alert("最低1つの中カテゴリが必要です。"); return; }
    if (confirm(`中カテゴリ「${currentMid}」を削除しますか？`)) {
        delete appData[currentBig][currentMid];
        currentMid = Object.keys(appData[currentBig])[0];
        currentSmall = Object.keys(appData[currentBig][currentMid])[0];
        updateAllUI();
    }
}

function renameSmall() {
    const newName = prompt(`小カテゴリ「${currentSmall}」の新しい名前:`, currentSmall);
    if (newName && newName !== currentSmall && !appData[currentBig][currentMid][newName]) {
        appData[currentBig][currentMid][newName] = appData[currentBig][currentMid][currentSmall];
        delete appData[currentBig][currentMid][currentSmall];
        currentSmall = newName;
        updateAllUI();
    }
}

function deleteSmall() {
    if (Object.keys(appData[currentBig][currentMid]).length <= 1) { alert("最低1つの小カテゴリが必要です。"); return; }
    if (confirm(`小カテゴリ「${currentSmall}」を削除しますか？`)) {
        delete appData[currentBig][currentMid][currentSmall];
        currentSmall = Object.keys(appData[currentBig][currentMid])[0];
        updateAllUI();
    }
}

async function resetAllData() {
    if (confirm("全てのデータを初期状態に戻しますか？")) {
        const res = await fetch('/api/reset', { method: 'POST' });
        if (res.ok) location.reload();
    }
}

window.onload = () => {
    loadData();
    initDraggable();
    if (localStorage.getItem('dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('dark-mode-icon');
        if (icon) icon.innerText = 'light_mode';
    }
    
    // 質問入力時にも高さを自動調整
    document.getElementById('question').addEventListener('input', autoResizeQuestion);
};