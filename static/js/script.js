let appData = {};
let currentBig = "";
let currentMid = "";
let currentSmall = "";
let currentFontSize = 1.2;
let currentNoteColor = "#fff9c4";
let isPracticeMode = false;
let isFilterActive = false;
let isProductionMode = false;
let isMobileEditMode = false;
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
    }

    // --- テンプレートの初期化 ---
    // データが完全に空（新規ユーザー）の場合のみ、デフォルトのテンプレートを作成します。
    // これにより、ユーザーが削除した項目がリロード時に勝手に復活するのを防ぎます。
    if (bigKeys.length === 0) {
        setupDefaultTemplates();
    }
    updateAllUI();
}

function applyTemplates() {
    if (confirm("既存のデータにテンプレートを追加しますか？（同名のタブがある場合は上書きされません）")) {
        setupDefaultTemplates();
        saveData();
    }
}

function setupDefaultTemplates() {
    // 初期起動時に自動で追加されるテンプレート
    addTemplateToTabs("面接：基本質問セット");
    addTemplateToTabs("面接：自己PR");
    addTemplateToTabs("面接：ガクチカ深掘り");
    addTemplateToTabs("面接：志望動機");
    addTemplateToTabs("面接：頻出質問50選(抜粋)");
    addTemplateToTabs("面接：逆質問");
    addTemplateToTabs("プレゼン：構成案テンプレート");

    // 初期表示するカテゴリを設定
    currentBig = "自己分析";
    currentMid = "導入";
    currentSmall = "自己紹介";
}

/**
 * テンプレートライブラリの定義
 */
const templateLibrary = {
    "面接：基本質問セット": {
        desc: "自己紹介、強み、挫折経験など必須項目",
        data: {
            "自己分析": {
                "導入": {
                    "自己紹介": { question: "1分間で自己紹介をしてください。", answer: "", placeholder: "1.氏名 2.大学 3.注力した事 4.本日の意気込み", memo: "1分以内に収める", important: true },
                },
                "性格・価値観": {
                    "周囲からの評価": { question: "周囲からどのような人だと言われますか？", answer: "", placeholder: "具体的なエピソードを交えて", memo: "" },
                    "挫折経験": { question: "これまでの人生で一番の挫折は何ですか？", answer: "", placeholder: "1.状況 2.困難だった点 3.どう乗り越えたか 4.学んだこと", memo: "STAR法で話す" }
                }
            }
        }
    },
    "面接：自己PR": {
        desc: "あなたの強みを効果的に伝える構成",
        data: {
            "自己PR": {
                "強み": { question: "あなたの強みを教えてください。", answer: "", placeholder: "結論（強み）→具体的なエピソード→仕事への活かし方", memo: "企業が求める人物像と結びつける", important: true },
                "弱み": { question: "あなたの弱みは何ですか？", answer: "", placeholder: "結論（弱み）→具体的なエピソード→改善策", memo: "改善策まで話す" }
            }
        }
    },
    "面接：ガクチカ深掘り": {
        desc: "学生時代に力を入れたことのSTAR構成",
        data: {
            "ガクチカ": {
                "メインエピソード": { question: "学生時代に最も力を入れたことは？", answer: "", placeholder: "S:状況 T:課題 A:行動 R:結果", memo: "数字を使うと説得力UP", important: true },
                "苦労した点": { question: "取り組む中で一番苦労したことは？", answer: "", placeholder: "直面した壁→試行錯誤→得られた成果", memo: "" },
                "学び": { question: "その経験から何を学びましたか？", answer: "", placeholder: "入社後どう活かせるか", memo: "" }
            }
        }
    },
    "面接：志望動機": {
        desc: "企業への熱意を伝えるための構成",
        data: {
            "志望動機": {
                "業界・企業": {
                    "業界理由": { question: "なぜこの業界を志望しているのですか？", answer: "", placeholder: "業界の魅力→将来性", memo: "" },
                    "弊社である理由": { question: "数ある企業の中で、なぜ弊社なのですか？", answer: "", placeholder: "他社との比較→共感した点→自分のビジョンとの重なり", memo: "競合他社との比較を明確に", important: true },
                    "職種理由": { question: "なぜこの職種を希望するのですか？", answer: "", placeholder: "職種の魅力→自分の適性", memo: "" }
                },
                "キャリアビジョン": {
                    "5年後の姿": { question: "5年後、弊社でどのような活躍をしていたいですか？", answer: "", placeholder: "具体的な目標→そこに至るまでのステップ", memo: "" },
                    "入社後にやりたいこと": { question: "入社してまず挑戦したいことは何ですか？", answer: "", placeholder: "具体的な業務内容と貢献", memo: "" }
                }
            }
        }
    },
    "面接：頻出質問50選(抜粋)": {
        desc: "面接でよく聞かれる質問を網羅",
        data: {
            "頻出質問": {
                "企業研究": {
                    "入社後": { question: "入社後にやりたいことは？", answer: "", placeholder: "具体的な業務内容と貢献", memo: "" },
                    "貢献": { question: "弊社にどう貢献できますか？", answer: "", placeholder: "自分の強みと経験をどう活かすか", memo: "" },
                    "他社選考": { question: "他に選考を受けている企業は？", answer: "", placeholder: "正直に答えつつ、軸がぶれていないことを強調", memo: "" }
                },
                "自己理解": {
                    "成功体験": { question: "成功体験を教えてください。", answer: "", placeholder: "STAR法で具体的に", memo: "" },
                    "失敗体験": { question: "失敗体験を教えてください。", answer: "", placeholder: "失敗から何を学び、どう改善したか", memo: "" },
                    "ストレス": { question: "ストレス解消法は？", answer: "", placeholder: "健全な方法を具体的に", memo: "" }
                },
                "キャリア": {
                    "転勤": { question: "転勤は可能ですか？", answer: "", placeholder: "基本的には可能と答える", memo: "" },
                    "残業": { question: "残業についてどう思いますか？", answer: "", placeholder: "業務効率化への意識を伝える", memo: "" }
                }
            }
        }
    },
    "面接：逆質問": {
        desc: "面接官への効果的な逆質問集",
        data: {
            "逆質問": {
                "企業理解": {
                    "活躍する人物像": { question: "御社で活躍している方に共通する素養は何ですか？", answer: "", placeholder: "入社後のイメージを具体化", memo: "" },
                    "教育体制": { question: "入社までに学んでおくべきスキルはありますか？", answer: "", placeholder: "学習意欲をアピール", memo: "" },
                    "社風": { question: "御社の社風を一言で表すと何ですか？", answer: "", placeholder: "企業文化への関心", memo: "" }
                },
                "業務内容": {
                    "具体的な業務": { question: "配属された場合、具体的な1日の業務の流れは？", answer: "", placeholder: "入社後のイメージを具体化", memo: "" },
                    "やりがい": { question: "この仕事のやりがいは何ですか？", answer: "", placeholder: "仕事へのモチベーション", memo: "" }
                },
                "最終確認": {
                    "懸念点の払拭": { question: "本日の私の話の中で、懸念に感じられた点はありますか？", answer: "", placeholder: "最後に熱意を伝えるチャンス", important: true }
                }
            }
        }
    },
    "プレゼン：構成案テンプレート": {
        desc: "フック、本論、解決策の王道構成",
        data: {
            "プレゼン構成": {
                "導入 (Introduction)": {
                    "フック": { question: "聞き手の関心を引く導入案", answer: "", placeholder: "・問いかけから始める\n・驚きの統計データを出す\n・個人的なストーリーを話す", memo: "" },
                    "アジェンダ": { question: "本日の流れの提示", answer: "", placeholder: "1.現状の課題 2.解決策の提案 3.期待される効果 4.まとめ", memo: "" }
                },
                "本論 (Body)": {
                    "課題提起": { question: "解決すべき問題の明確化", answer: "", placeholder: "現状分析と問題点の提示", memo: "" },
                    "解決策": { question: "具体的な提案内容", answer: "", placeholder: "結論→根拠→ベネフィットの順で", memo: "", important: true },
                    "根拠・データ": { question: "提案を支える証拠", answer: "", placeholder: "客観的なデータや事例", memo: "" }
                },
                "結論 (Conclusion)": {
                    "まとめ": { question: "メッセージの再確認", answer: "", placeholder: "最も伝えたいことを簡潔に", memo: "" },
                    "ネクストアクション": { question: "聞き手に取ってほしい行動", answer: "", placeholder: "具体的な行動を促す", memo: "" }
                }
            }
        }
    }
};

function openTemplateModal() {
    const modal = document.getElementById('template-modal');
    const container = document.getElementById('template-list-container');
    container.innerHTML = "";
    modal.style.display = 'flex';

    Object.keys(templateLibrary).forEach(key => {
        const item = templateLibrary[key];
        const div = document.createElement('div');
        div.className = 'template-item';
        div.innerHTML = `
            <div class="template-info">
                <div class="template-name">${key}</div>
                <div class="template-desc">${item.desc}</div>
            </div>
            <button class="template-add-btn" onclick="addTemplateToTabs('${key}')">
                <span class="material-symbols-outlined">add</span>
            </button>
        `;
        container.appendChild(div);
    });
}

function addTemplateToTabs(templateKey) {
    const template = templateLibrary[templateKey];
    if (!template) return;

    let addedCount = 0;
    Object.keys(template.data).forEach(big => {
        if (!appData[big]) { // 既存のタブと重複しない場合のみ追加
            appData[big] = JSON.parse(JSON.stringify(template.data[big])); // 深いコピー
            addedCount++;
        }
    });

    if (addedCount > 0) {
        saveData();
        updateAllUI();
        showToast(`${templateKey}を追加しました`);
    } else {
        showToast("既に追加されているテンプレートです");
    }
    closeTemplateModal();
}

function closeTemplateModal(event) {
    const modal = document.getElementById('template-modal');
    if (!event || event.target === modal) {
        modal.style.display = 'none';
    }
}

function setupDefaultTemplates() {
    // 初期起動時に自動で追加されるテンプレート
    addTemplateToTabs("面接：基本質問セット");
    addTemplateToTabs("面接：自己PR");
    addTemplateToTabs("面接：ガクチカ深掘り");
    addTemplateToTabs("面接：志望動機");
    addTemplateToTabs("面接：頻出質問50選(抜粋)");
    addTemplateToTabs("面接：逆質問");
    addTemplateToTabs("プレゼン：構成案テンプレート");

    // 初期表示するカテゴリを設定
    currentBig = "自己分析";
    currentMid = "導入";
    currentSmall = "自己紹介";
}

function updateAllUI() {
    renderTabs();
    renderMidSelect();
    renderSmallSelect();
    renderBreadcrumb();
    renderContent();
    updateUndoButtonVisibility();
}

function renderContent() {
    const questionInput = document.getElementById('question');
    const item = appData[currentBig][currentMid][currentSmall];
    const answerInput = document.getElementById('answer');

    questionInput.value = item.question || "";
    answerInput.value = item.answer || "";
    answerInput.placeholder = item.placeholder || "ここに回答を入力してください...";
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
    updateInputState();
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

function toggleMobileEditMode() {
    isMobileEditMode = !isMobileEditMode;
    document.body.classList.toggle('mobile-edit-active', isMobileEditMode);
    const icon = document.getElementById('mobile-edit-icon');
    if (icon) {
        icon.innerText = isMobileEditMode ? 'edit' : 'edit_off';
    }
    updateInputState();
    showToast(isMobileEditMode ? "スマホ編集モードON" : "スマホ編集モードOFF");
}

function updateInputState() {
    const q = document.getElementById('question');
    const a = document.getElementById('answer');
    const m = document.getElementById('memo');
    const isMobile = window.innerWidth <= 600;
    const shouldBeReadOnly = isProductionMode || (isMobile && !isMobileEditMode);
    if(q) q.readOnly = shouldBeReadOnly;
    if(a) a.readOnly = shouldBeReadOnly;
    if(m) m.readOnly = shouldBeReadOnly;
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
    const panel = document.getElementById('timer-modal');
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        showToast("タイマー停止");
        if (btn) btn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
        if (panel) panel.classList.remove('timer-running');
    } else {
        timerInterval = setInterval(() => {
            timerSeconds++;
            updateTimerDisplay();
        }, 1000);
        showToast("タイマースタート");
        if (btn) btn.innerHTML = '<span class="material-symbols-outlined">pause</span>';
        if (panel) panel.classList.add('timer-running');
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds = 0;
    updateTimerDisplay();
    const btn = document.getElementById('modal-timer-toggle-btn');
    if (btn) btn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
    document.getElementById('timer-modal').classList.remove('timer-running');
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

/**
 * 破壊的変更の前にデータをアーカイブ（ゴミ箱）に保存する
 */
function archiveCurrentData() {
    saveCurrentInput();
    localStorage.setItem('scriptor_archive', JSON.stringify(appData));
    updateUndoButtonVisibility();
}

function restoreFromArchive() {
    const archived = localStorage.getItem('scriptor_archive');
    if (archived && confirm("最後に削除またはリセットした状態を復元しますか？")) {
        appData = JSON.parse(archived);
        saveData(); // サーバーに保存
        updateAllUI();
        localStorage.removeItem('scriptor_archive');
        updateUndoButtonVisibility();
        showToast("データを復元しました");
    }
}

function printData() {
    window.print();
}

/**
 * 現在のデータをJSONファイルとしてダウンロードする
 */
function exportData() {
    saveCurrentInput();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const date = new Date().toISOString().slice(0, 10);
    downloadAnchorNode.setAttribute("download", `scriptor_backup_${date}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast("バックアップを作成しました");
}

function updateUndoButtonVisibility() {
    const btn = document.getElementById('undo-btn');
    if (btn) btn.style.display = localStorage.getItem('scriptor_archive') ? 'inline-flex' : 'none';
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
    const speed = parseInt(document.getElementById('speaking-speed').value) || 5;
    const count = text.length;
    const seconds = Math.floor(count / speed);
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
        note.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        requestAnimationFrame(() => {
            if (!isDragging) return;
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;

            // 画面外に出ないように制限
            const maxX = window.innerWidth - note.offsetWidth;
            const maxY = window.innerHeight - note.offsetHeight;
            x = Math.max(0, Math.min(x, maxX));
            y = Math.max(0, Math.min(y, maxY));

            note.style.left = x + 'px';
            note.style.top = y + 'px';
            note.style.right = 'auto';
        });
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            note.style.opacity = '1.0';
            note.style.transition = '';
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
        panel.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        requestAnimationFrame(() => {
            if (!isDragging) return;
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;

            // 画面外に出ないように制限
            const maxX = window.innerWidth - panel.offsetWidth;
            const maxY = window.innerHeight - panel.offsetHeight;
            x = Math.max(0, Math.min(x, maxX));
            y = Math.max(0, Math.min(y, maxY));

            // パネルの位置を更新（fixedの制約を解除するためにbottomをautoにする）
            panel.style.left = x + 'px';
            panel.style.top = y + 'px';
            panel.style.bottom = 'auto';
            panel.style.right = 'auto';
        });
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            panel.style.opacity = '1.0';
            panel.style.transition = '';
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
}

function setNoteColor(color) {
    currentNoteColor = color;
    document.querySelector('.sticky-note').style.backgroundColor = color;
}

function renderTabs() {
    const container = document.getElementById('tabs-container');
    container.innerHTML = "";

    const keys = Object.keys(appData);
    // タブが1つでも表示するように変更（ユーザーの混乱を防ぐため）
    container.style.display = keys.length === 0 ? 'none' : 'flex';

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
        appData[name] = { "新規中カテゴリ": { "新規小カテゴリ": { "question": "", "answer": "", "memo": "" } } };
        currentBig = name; currentMid = "新規中カテゴリ"; currentSmall = "新規小カテゴリ";
        updateAllUI();
        saveData();
        document.getElementById('question').focus();
    }
}

function addMid() {
    const name = prompt("新しい中カテゴリの名前:");
    if (name && !appData[currentBig][name]) {
        appData[currentBig][name] = { "新規小カテゴリ": { "question": "", "answer": "", "memo": "" } };
        currentMid = name; currentSmall = "新規小カテゴリ";
        updateAllUI();
        saveData();
        document.getElementById('question').focus();
    }
}

function addSmall() {
    const name = prompt("新しい小カテゴリの名前:");
    if (name && !appData[currentBig][currentMid][name]) {
        appData[currentBig][currentMid][name] = { "question": "", "answer": "", "memo": "" };
        currentSmall = name;
        updateAllUI();
        saveData();
        document.getElementById('question').focus();
    }
}

function renameBig() {
    const newName = prompt(`大タブ「${currentBig}」の新しい名前:`, currentBig);
    if (newName && newName !== currentBig && !appData[newName]) {
        appData[newName] = appData[currentBig];
        delete appData[currentBig];
        currentBig = newName;
        saveData();
        updateAllUI();
    }
}

function deleteBig() {
    if (Object.keys(appData).length <= 1) { alert("最低1つの大タブが必要です。"); return; }
    if (confirm(`大タブ「${currentBig}」を削除しますか？`)) {
        archiveCurrentData();
        delete appData[currentBig];
        currentBig = Object.keys(appData)[0];
        currentMid = Object.keys(appData[currentBig])[0];
        currentSmall = Object.keys(appData[currentBig][currentMid])[0];
        saveData();
        updateAllUI();
    }
}

function renameMid() {
    const newName = prompt(`中カテゴリ「${currentMid}」の新しい名前:`, currentMid);
    if (newName && newName !== currentMid && !appData[currentBig][newName]) {
        appData[currentBig][newName] = appData[currentBig][currentMid];
        delete appData[currentBig][currentMid];
        currentMid = newName;
        saveData();
        updateAllUI();
    }
}

function deleteMid() {
    if (Object.keys(appData[currentBig]).length <= 1) { alert("最低1つの中カテゴリが必要です。"); return; }
    if (confirm(`中カテゴリ「${currentMid}」を削除しますか？`)) {
        archiveCurrentData();
        delete appData[currentBig][currentMid];
        currentMid = Object.keys(appData[currentBig])[0];
        currentSmall = Object.keys(appData[currentBig][currentMid])[0];
        saveData();
        updateAllUI();
    }
}

function renameSmall() {
    const newName = prompt(`小カテゴリ「${currentSmall}」の新しい名前:`, currentSmall);
    if (newName && newName !== currentSmall && !appData[currentBig][currentMid][newName]) {
        appData[currentBig][currentMid][newName] = appData[currentBig][currentMid][currentSmall];
        delete appData[currentBig][currentMid][currentSmall];
        currentSmall = newName;
        saveData();
        updateAllUI();
    }
}

function deleteSmall() {
    if (Object.keys(appData[currentBig][currentMid]).length <= 1) { alert("最低1つの小カテゴリが必要です。"); return; }
    if (confirm(`小カテゴリ「${currentSmall}」を削除しますか？`)) {
        archiveCurrentData();
        delete appData[currentBig][currentMid][currentSmall];
        currentSmall = Object.keys(appData[currentBig][currentMid])[0];
        saveData();
        updateAllUI();
    }
}

async function resetAllData() {
    if (confirm("全てのデータを初期状態に戻しますか？")) {
        archiveCurrentData();
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

function openTocModal() {
    const modal = document.getElementById('toc-modal');
    const container = document.getElementById('toc-list-container');
    if (!modal || !container) return;

    container.innerHTML = "";
    modal.style.display = 'flex';

    Object.keys(appData).forEach(big => {
        if (!appData[big] || Object.keys(appData[big]).length === 0) return;

        const midKeysToShow = Object.keys(appData[big]).filter(mid => {
            const smallKeys = Object.keys(appData[big][mid]).filter(small => {
                return !isFilterActive || appData[big][mid][small].important;
            });
            return smallKeys.length > 0;
        });

        if (midKeysToShow.length === 0) return;

        // 大カテゴリ
        const bigDiv = document.createElement('div');
        bigDiv.className = 'toc-big-title';
        bigDiv.innerText = big;
        container.appendChild(bigDiv);

        midKeysToShow.forEach(mid => {
            // 中カテゴリ
            const midDiv = document.createElement('div');
            midDiv.className = 'toc-mid-title';
            midDiv.innerText = mid;
            container.appendChild(midDiv);

            Object.keys(appData[big][mid]).forEach(small => {
                const item = appData[big][mid][small];
                if (isFilterActive && !item.important) return;

                // 小カテゴリ（質問項目）
                const smallDiv = document.createElement('div');
                const isActive = (big === currentBig && mid === currentMid && small === currentSmall);
                smallDiv.className = 'toc-small-item' + (isActive ? ' active' : '');

                const label = item.question || small;
                smallDiv.innerHTML = `
                    <span>${label}</span>
                    ${item.important ? '<span class="material-symbols-outlined toc-star">star</span>' : ''}
                `;

                smallDiv.onclick = () => {
                    if (typeof saveCurrentInput === 'function') {
                        saveCurrentInput();
                    }
                    currentBig = big;
                    currentMid = mid;
                    currentSmall = small;
                    updateAllUI();
                    document.getElementById('toc-modal').style.display = 'none';
                };
                container.appendChild(smallDiv);
            });
        });
    });
}

function closeTocModal(event) {
    const modal = document.getElementById('toc-modal');
    if (!event || event.target === modal) {
        modal.style.display = 'none';
    }
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

    // スマホ入力中にキーボードが表示された際、フッターやFABを隠す処理
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            if (window.innerWidth <= 600) document.body.classList.add('keyboard-open');
        });
        input.addEventListener('blur', () => {
            if (window.innerWidth <= 600) document.body.classList.remove('keyboard-open');
        });
    });

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