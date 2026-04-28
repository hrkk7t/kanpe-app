let appData = {};
let currentBig = "";
let currentMid = "";
let currentSmall = "";
let currentFontSize = 1.2;
let currentNoteColor = "#fff9c4";
let isPracticeMode = false;
let isFilterActive = false;
let isProductionMode = false;
let timerInterval = null;
let timerSeconds = 0;
let scrollInterval = null;
let isScrolling = false;
let touchStartX = 0;
let touchStartY = 0;

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
    const item = appData[currentBig][currentMid][currentSmall];
    questionInput.value = item.question;
    document.getElementById('answer').value = item.answer;
    document.getElementById('memo').value = item.memo || "";
    
    const starIcon = document.getElementById('star-icon');
    starIcon.className = 'material-symbols-outlined' + (item.important ? ' active' : '');

    // 質問欄の高さを内容に合わせて調整
    autoResizeQuestion();
    
    const note = document.querySelector('.sticky-note');
    note.style.top = appData[currentBig][currentMid][currentSmall].top || "80px";
    note.style.left = appData[currentBig][currentMid][currentSmall].left || "740px";
    note.style.right = "auto";

    setNoteColor(appData[currentBig][currentMid][currentSmall].color || "#fff9c4");
    // 現在のフォントサイズ設定を適用
    applyFontSize();
    updateCharCount();
    
    // 練習モードの表示リセット
    if (isPracticeMode) {
        document.getElementById('practice-overlay').style.display = 'flex';
    }
}

function togglePracticeMode() {
    isPracticeMode = !isPracticeMode;
    const overlay = document.getElementById('practice-overlay');
    const icon = document.getElementById('practice-icon');
    
    overlay.style.display = isPracticeMode ? 'flex' : 'none';
    icon.innerText = isPracticeMode ? 'visibility' : 'visibility_off';
    showToast(isPracticeMode ? "練習モードON" : "練習モードOFF");
}

function revealAnswer() {
    document.getElementById('practice-overlay').style.display = 'none';
}

function toggleFilterImportant() {
    isFilterActive = !isFilterActive;
    document.getElementById('filter-icon').classList.toggle('active', isFilterActive);
    
    if (isFilterActive) {
        // 現在の項目が重要でない場合、最初の重要項目へ移動
        const item = appData[currentBig][currentMid][currentSmall];
        if (!item.important) {
            findFirstImportant();
        }
    }
    updateAllUI();
    showToast(isFilterActive ? "重要項目のみ表示中" : "すべての項目を表示");
}

function findFirstImportant() {
    for (const b in appData) {
        for (const m in appData[b]) {
            for (const s in appData[b][m]) {
                if (appData[b][m][s].important) {
                    currentBig = b; currentMid = m; currentSmall = s;
                    return;
                }
            }
        }
    }
}

function toggleProductionMode() {
    isProductionMode = !isProductionMode;
    document.body.classList.toggle('production-mode', isProductionMode);
    updateInputState();

    const icon = document.getElementById('production-icon');
    const button = document.getElementById('production-mode-btn');
    
    if (isProductionMode) {
        icon.innerText = 'edit_note';
        button.title = '本番モードを解除（編集モードに戻る）';
        showToast("本番モードON（編集不可）");
    } else {
        icon.innerText = 'cast';
        button.title = '本番モード';
        showToast("編集モードに戻りました");
    }
}

function toggleStar() {
    const item = appData[currentBig][currentMid][currentSmall];
    item.important = !item.important;
    renderContent();
}

// --- タイマー機能 ---
function openTimerModal() {
    document.getElementById('timer-modal').style.display = 'block';
}

function closeTimerModal(event) {
    document.getElementById('timer-modal').style.display = 'none';
}

function toggleTimer() {
    const btn = document.getElementById('modal-timer-toggle-btn');
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        showToast("タイマー停止");
        if (btn) btn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
    } else {
        timerInterval = setInterval(() => {
            timerSeconds++;
            updateTimerDisplay();
        }, 1000);
        showToast("タイマースタート");
        if (btn) btn.innerHTML = '<span class="material-symbols-outlined">pause</span>';
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds = 0;
    updateTimerDisplay();
    const btn = document.getElementById('modal-timer-toggle-btn');
    if (btn) btn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
    showToast("タイマーをリセットしました");
}

function adjustTarget(type, delta) {
    const minInput = document.getElementById('target-min');
    const secInput = document.getElementById('target-sec');
    if (type === 'min') {
        minInput.value = Math.max(0, (parseInt(minInput.value) || 0) + delta);
    } else {
        let currentSec = (parseInt(secInput.value) || 0) + delta;
        if (currentSec < 0) currentSec = 0;
        if (currentSec >= 60) currentSec = 59;
        secInput.value = currentSec;
    }
    updateTimerDisplay();
}

function setTargetPreset(min, sec) {
    document.getElementById('target-min').value = min;
    document.getElementById('target-sec').value = sec;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const min = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const sec = (timerSeconds % 60).toString().padStart(2, '0');
    
    const display = document.getElementById('modal-timer-display');
    if (display) {
        display.innerText = `${min}:${sec}`;
        
        // 目標時間のチェック
        const targetMin = parseInt(document.getElementById('target-min').value) || 0;
        const targetSec = parseInt(document.getElementById('target-sec').value) || 0;
        const totalTargetSeconds = (targetMin * 60) + targetSec;

        if (totalTargetSeconds > 0 && timerSeconds >= totalTargetSeconds) {
            display.classList.add('over-time');
        } else {
            display.classList.remove('over-time');
        }
    }
}

// --- 自動スクロール機能 ---
function toggleAutoScroll() {
    const textarea = document.getElementById('answer');
    const icon = document.getElementById('scroll-icon');
    
    if (isScrolling) {
        clearInterval(scrollInterval);
        isScrolling = false;
        icon.innerText = 'south';
        showToast("スクロール停止");
    } else {
        isScrolling = true;
        icon.innerText = 'pause';
        showToast("自動スクロール開始");
        scrollInterval = setInterval(() => {
            // 1pxずつ下にスクロール
            textarea.scrollTop += 1;
            
            // 下端まで行ったら停止
            if (textarea.scrollTop + textarea.clientHeight >= textarea.scrollHeight) {
                clearInterval(scrollInterval);
                isScrolling = false;
                icon.innerText = 'south';
            }
        }, 50); // 速度調整（50msごとに1px）
    }
}

// --- スワイプジェスチャー（スマホ用） ---
function initSwipeEvents() {
    const card = document.querySelector('.card');
    if (!card) return;

    card.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
    }, { passive: true });
}

function handleSwipe(startX, startY, endX, endY) {
    const diffX = startX - endX;
    const diffY = startY - endY;
    
    // 横方向の移動が縦方向より大きく、かつ一定以上の距離(70px)がある場合のみ実行
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 70) {
        let smallKeys = Object.keys(appData[currentBig][currentMid]);
        if (isFilterActive) {
            smallKeys = smallKeys.filter(s => appData[currentBig][currentMid][s].important);
        }
        
        const currentIndex = smallKeys.indexOf(currentSmall);
        
        if (diffX > 0) {
            // 左スワイプ -> 次の小カテゴリへ
            if (currentIndex < smallKeys.length - 1) {
                saveCurrentInput();
                currentSmall = smallKeys[currentIndex + 1];
                updateAllUI();
            }
        } else {
            // 右スワイプ -> 前の小カテゴリへ
            if (currentIndex > 0) {
                saveCurrentInput();
                currentSmall = smallKeys[currentIndex - 1];
                updateAllUI();
            }
        }
    }
}

function printData() {
    window.print();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        showToast("全画面モードON");
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function updateCharCount() {
    const text = document.getElementById('answer').value;
    const count = text.length;
    const seconds = Math.floor(count / 5); // 1秒間5文字(分300文字)計算
    document.getElementById('char-count').innerText = `${count} 文字 (目安: 約 ${seconds}秒)`;
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
    if (window.innerWidth <= 600) return; // スマホではドラッグ無効

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

function initTimerDraggable() {
    if (window.innerWidth <= 600) return; // スマホではドラッグ無効

    const panel = document.getElementById('timer-modal');
    const header = panel.querySelector('.timer-header');
    let isDragging = false, offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        // 現在のパネル位置とマウス位置の差分を保持
        offsetX = e.clientX - panel.offsetLeft;
        offsetY = e.clientY - panel.offsetTop;
        panel.style.opacity = '0.8';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        // パネルの位置を更新（fixedの制約を解除するためにbottomをautoにする）
        panel.style.left = (e.clientX - offsetX) + 'px';
        panel.style.top = (e.clientY - offsetY) + 'px';
        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            panel.style.opacity = '1.0';
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

function handleSliderChange(val) {
    currentFontSize = parseFloat(val);
    applyFontSize();
}

function applyFontSize() {
    document.getElementById('question').style.fontSize = (currentFontSize + 0.2) + "em";
    document.getElementById('answer').style.fontSize = currentFontSize + "em";
    const slider = document.getElementById('font-slider');
    if (slider) slider.value = currentFontSize;
}

function setNoteColor(color) {
    currentNoteColor = color;
    document.querySelector('.sticky-note').style.backgroundColor = color;
}

function renderTabs() {
    const container = document.getElementById('tabs-container');
    container.innerHTML = "";

    const hasImportantInBig = (big) => {
        if (!isFilterActive) return true;
        return Object.values(appData[big]).some(midObj => 
            Object.values(midObj).some(item => item.important));
    };

    Object.keys(appData).forEach(big => {
        if (!hasImportantInBig(big)) return;
        const tab = document.createElement('div');
        tab.className = `tab ${big === currentBig ? 'active' : ''}`;
        tab.innerText = big;
        tab.draggable = true;
        
        // ドラッグ開始
        tab.ondragstart = (e) => {
            e.dataTransfer.setData("text/plain", big);
            tab.classList.add('dragging');
        };
        
        // ドラッグ中
        tab.ondragover = (e) => {
            e.preventDefault();
            tab.classList.add('drag-over');
        };
        
        tab.ondragleave = () => tab.classList.remove('drag-over');

        // ドロップ処理（入れ替え）
        tab.ondrop = (e) => {
            e.preventDefault();
            tab.classList.remove('drag-over');
            const draggedKey = e.dataTransfer.getData("text/plain");
            if (draggedKey === big) return;

            const keys = Object.keys(appData);
            const fromIndex = keys.indexOf(draggedKey);
            const toIndex = keys.indexOf(big);

            keys.splice(fromIndex, 1);
            keys.splice(toIndex, 0, draggedKey);

            // オブジェクトのキーを並び替えて再構築
            const newData = {};
            keys.forEach(k => newData[k] = appData[k]);
            appData = newData;
            
            renderTabs();
            showToast("順番を変更しました（保存を忘れずに）");
        };

        tab.ondragend = () => tab.classList.remove('dragging');

        tab.onclick = () => { saveCurrentInput(); currentBig = big; currentMid = Object.keys(appData[big])[0]; currentSmall = Object.keys(appData[big][currentMid])[0]; updateAllUI(); };
        container.appendChild(tab);
    });
}

function renderMidSelect() {
    const select = document.getElementById('mid-select');
    select.innerHTML = "";
    
    const hasImportantInMid = (mid) => {
        if (!isFilterActive) return true;
        return Object.values(appData[currentBig][mid]).some(item => item.important);
    };

    Object.keys(appData[currentBig]).forEach(mid => {
        if (!hasImportantInMid(mid)) return;
        const opt = new Option(mid, mid);
        if (mid === currentMid) opt.selected = true;
        select.add(opt);
    });
}

function renderSmallSelect() {
    const select = document.getElementById('small-select');
    select.innerHTML = "";

    Object.keys(appData[currentBig][currentMid]).forEach(small => {
        if (isFilterActive && !appData[currentBig][currentMid][small].important) return;

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
        if (isFilterActive) {
            items = items.filter(m => Object.values(appData[currentBig][m]).some(i => i.important));
        }
        currentActive = currentMid;
        onSelect = (val) => {
            currentMid = val;
            currentSmall = Object.keys(appData[currentBig][val])[0];
        };
    } else {
        items = Object.keys(appData[currentBig][currentMid]);
        if (isFilterActive) {
            items = items.filter(s => appData[currentBig][currentMid][s].important);
        }
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

function openSearchModal() {
    const modal = document.getElementById('search-modal');
    modal.style.display = 'flex';
    const input = document.getElementById('modal-search-input');
    input.value = "";
    input.focus();
    document.getElementById('modal-search-results').innerHTML = "";
}

function closeSearchModal(event) {
    document.getElementById('search-modal').style.display = 'none';
}

function handleSearch(query) {
    const resultsContainer = document.getElementById('modal-search-results');
    if (!query) {
        resultsContainer.innerHTML = "";
        return;
    }

    const results = [];
    const q = query.toLowerCase();

    for (const big in appData) {
        for (const mid in appData[big]) {
            for (const small in appData[big][mid]) {
                const item = appData[big][mid][small];
                if (small.toLowerCase().includes(q) || 
                    item.question.toLowerCase().includes(q) || 
                    item.answer.toLowerCase().includes(q)) {
                    results.push({ big, mid, small, question: item.question || small });
                }
            }
        }
    }

    resultsContainer.innerHTML = "";
    if (results.length > 0) {
        results.forEach(res => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `
                <div class="item-path">${res.big} ＞ ${res.mid}</div>
                <div class="item-text">${res.question}</div>
            `;
            div.onclick = () => {
                saveCurrentInput();
                currentBig = res.big;
                currentMid = res.mid;
                currentSmall = res.small;
                updateAllUI();
                closeSearchModal();
            };
            resultsContainer.appendChild(div);
        });
    }
}

window.onload = () => {
    loadData();
    initDraggable();
    initTimerDraggable();
    initSwipeEvents();
    updateInputState();
    updateCharCount();

    if (localStorage.getItem('dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('dark-mode-icon');
        if (icon) icon.innerText = 'light_mode';
    }
    
    // 質問入力時にも高さを自動調整
    document.getElementById('question').addEventListener('input', autoResizeQuestion);
    document.getElementById('answer').addEventListener('input', updateCharCount);

    // 画面サイズ変更時に入力状態を再チェック
    window.addEventListener('resize', updateInputState);

    // ショートカットキー設定
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveData();
        }
        // Escキーで本番モードを解除
        if (e.key === 'Escape' && isProductionMode) {
            toggleProductionMode();
        }
    });

    // 検索窓以外をクリックしたら検索結果を閉じる
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            document.getElementById('search-results').classList.remove('active');
        }
    });
};