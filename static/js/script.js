let appData = {};
let currentTab = "";
let currentItem = "";
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
let autoSaveTimer = null;
let motivationInterval = null;

async function loadData() {
    try {
        // キャッシュ対策としてタイムスタンプを付与
        const response = await fetch('/api/data?t=' + new Date().getTime());
        appData = await response.json();

        // データが完全に空、またはフォルダが1つもない場合に初期化を実行
        const folderKeys = Object.keys(appData || {}).filter(k => !k.startsWith('_'));

        if (folderKeys.length === 0) {
            console.log("No valid data found, setting up default templates.");
            setupDefaultTemplates();
        } else {
            currentTab = folderKeys[0];
            currentItem = Object.keys(appData[currentTab])[0] || "";
            updateAllUI(); // ここでUIを更新
        }
    } catch (e) {
        console.error("Data load failed, loading templates.", e);
        // エラーが発生した場合も初期テンプレートをセットアップ
        await setupDefaultTemplates(); // await を追加
    } finally {
        updateInputState(); // ロード後に必ず入力状態を更新
    }
}

/**
 * テンプレートライブラリの定義
 */
// テンプレートライブラリの定義 (穴埋め式フレームワーク版)
const templateLibrary = {
    "面接：基本質問セット": {
        desc: "自己紹介、強み、挫折経験など必須項目",
        data: {
            "自己紹介": {
                "自己紹介": { 
                    question: "1分間で自己紹介をしてください。", 
                    answer: "本日は貴重なお時間をいただき、ありがとうございます。\n\n【大学名・学部 / 現職の社名】の、【氏名】と申します。\n\n【学生時代 / 現職】では、主に【注力したこと・役割】に力を入れて取り組みました。\nその経験の中で培った【自分の強み・スキル】を活かし、御社の【具体的な業務やビジョン】に貢献したいと考えております。\n\n本日はどうぞよろしくお願いいたします。", 
                    placeholder: "氏名、所属、注力したこと、意気込みを簡潔に。", 
                    memo: "明るく元気な声で！1分（約300文字）に収める", 
                    important: true 
                },
                "周囲からの評価": { 
                    question: "周囲からどのような人だと言われますか？", 
                    answer: "周囲からはよく「【キャッチコピー・評価される特徴】」だと言われます。\n\n実際、【エピソード：例：イベント企画】の際にも、私が【自分が取った行動】をしたことで、周囲から「【言われたポジティブな言葉】」と評価していただきました。\n\nこの【自分の持ち味】は、仕事においても【どう活かせるか】という点で活かせると考えています。", 
                    placeholder: "客観的な視点と、それを裏付けるエピソード", 
                    memo: "" 
                },
                "挫折経験": { 
                    question: "これまでの人生で一番の挫折は何ですか？", 
                    answer: "私の最大の挫折は、【挫折した出来事】です。\n\n[状況・課題] 当時、【直面した困難や壁】にぶつかり、非常に悔しい思いをしました。\n[行動] しかし諦めず、原因は【分析した原因】にあると考え、以下の行動をとりました。\n1. 【行動1】\n2. 【行動2】\n[結果] その結果、【どのように乗り越えたか・結果】に至りました。\n\nこの経験から、【学んだ教訓】という教訓を得ることができました。", 
                    placeholder: "状況→課題→行動→結果→学び の順で", 
                    memo: "どう立ち直ったか（レジリエンス）を伝える" 
                }
            }
        }
    },
    "面接：自己PR": {
        desc: "あなたの強みを効果的に伝える王道構成",
        data: {
            "自己PR": {
                "強み": { 
                    question: "あなたの強みを教えてください。", 
                    answer: "私の強みは【強みとなる能力・特徴】です。\n\n具体的には、【エピソードの舞台】において、この強みを発揮しました。\n当時、【解決すべき課題や目標】という課題がありましたが、私は持ち前の強みを活かし、【具体的な行動や施策】を行いました。\n\nその結果、【定量的な成果・実績】を達成することができました。\n\n御社に入社した際も、この【強み】を活かし、【御社の具体的な業務】において貢献できると確信しております。", 
                    placeholder: "結論→具体例→貢献の順で記載", 
                    memo: "企業が求める人物像と結びつける！", 
                    important: true 
                },
                "弱み": { 
                    question: "あなたの弱みは何ですか？", 
                    answer: "私の弱みは【弱みとなる特徴：例：一つのことに集中しすぎてしまうこと】です。\n\n実際、【具体的な失敗談や困った状況】ということがありました。\n\nしかし現在では、これを改善するために【具体的な改善策：例：タスクの優先順位を毎日可視化する】ように徹底しています。\nその結果、最近では【改善策によるポジティブな変化】という状態を維持できています。", 
                    placeholder: "弱みと、それを克服するための具体的なアクション", 
                    memo: "致命的な弱みは避け、改善姿勢をアピール" 
                }
            }
        }
    },
    "面接：ガクチカ・実績深掘り": {
        desc: "力を入れたことのSTAR構成（新卒・中途兼用）",
        data: {
            "ガクチカ": {
                "メインエピソード": { 
                    question: "これまでで最も力を入れたこと（実績）は？", 
                    answer: "私が最も力を入れたのは、【打ち込んだ活動やプロジェクト名】です。\n\n[状況・役割] 当時、【当時の環境】の中で、【自分の役割】を務めていました。\n[課題] 目標として【目標内容】を掲げていました。しかし、【直面した課題・壁】という問題がありました。\n[行動] そこで私は、【考えた解決策】を実行しました。具体的には以下の2点です。\n1. 【行動の詳細1】\n2. 【行動の詳細2】\n[結果] その結果、【具体的な成果・数字】を達成することができました。", 
                    placeholder: "S:状況 T:課題 A:行動 R:結果 で記載", 
                    memo: "数字を使って説得力UP！", 
                    important: true 
                },
                "苦労した点": { 
                    question: "取り組む中で一番苦労したことは？", 
                    answer: "最も苦労したのは、【具体的に壁にぶつかったポイント】です。\n\n当初は【失敗したアプローチや予想外の事態】があり、なかなか上手くいきませんでした。\nしかし、【誰かに相談した / 視点を変えた】ことで、【新しいアプローチ】を試み、最終的には乗り越えることができました。", 
                    placeholder: "直面した壁→試行錯誤→乗り越えた方法", 
                    memo: "" 
                },
                "学び": { 
                    question: "その経験から何を学びましたか？", 
                    answer: "この経験を通じて、【具体的な学び：例：周囲を巻き込むことの重要性】を学びました。\n\n個人の力だけでなく、【学んだ教訓の深掘り】をすることで、より大きな成果が出せると実感しました。\n入社後もこの学びを活かし、【御社での具体的な行動】につなげていきたいです。", 
                    placeholder: "経験から得た教訓と、入社後の活かし方", 
                    memo: "" 
                }
            }
        }
    },
    "面接：志望動機": {
        desc: "企業への熱意とマッチ度を伝える構成",
        data: {
            "志望動機": {
                "業界理由": { 
                    question: "なぜこの業界を志望しているのですか？", 
                    answer: "私が【業界名】業界を志望する理由は、【業界に興味を持った原体験やきっかけ】があるからです。\n\nそこから業界について深く調べる中で、【業界の魅力や将来性】に強く惹かれました。\n私の【自分の強み】を活かして、この業界の【解決したい課題】に貢献したいと考えております。", 
                    placeholder: "業界への興味のきっかけと、実現したいこと", 
                    memo: "" 
                },
                "弊社である理由": { 
                    question: "数ある企業の中で、なぜ弊社なのですか？", 
                    answer: "御社を志望する最大の理由は、御社の【御社ならではの強み：理念 / 独自技術 / サービス】に強く共感したためです。\n\n他社と比較した際、御社は特に【他社との明確な違い】という点で優れていると感じています。\n\n私の【活かせる経験・スキル】を最も発揮できるのは、まさにそのような環境である御社だと確信し、第一志望としております。", 
                    placeholder: "他社との比較、共感した点、自分のビジョンとの重なり", 
                    memo: "「他社でもできるよね？」と言われないように", 
                    important: true 
                },
                "職種理由": { 
                    question: "なぜこの職種を希望するのですか？", 
                    answer: "私が【希望職種】を志望する理由は、【職種に対する熱意・理由】だからです。\n\nこれまで培ってきた【関連する経験やスキル】は、この職種の【具体的な業務】において早期にキャッチアップし、貢献できると考えています。", 
                    placeholder: "職種の魅力と、自分の適性", 
                    memo: "" 
                },
                "入社後にやりたいこと": { 
                    question: "入社してまず挑戦したいことは何ですか？", 
                    answer: "入社後はまず、【具体的な業務内容やプロジェクト】に挑戦したいと考えています。\n\nそのためにも、まずは【身につけたいスキルや知識】を早期に習得し、一日でも早くチームの戦力として貢献できるよう努めます。", 
                    placeholder: "具体的な業務内容と貢献イメージ", 
                    memo: "" 
                }
            }
        }
    },
    "面接：逆質問": {
        desc: "熱意を伝えるための効果的な逆質問",
        data: {
            "逆質問": {
                "活躍する人物像": { 
                    question: "【逆質問】活躍している方の特徴", 
                    answer: "御社で早期にキャッチアップし、貢献したいと考えております。\n\n差し支えなければ、現在御社で実際に活躍されている方に共通する『マインドセット』や『行動特性』があれば教えていただけますでしょうか？", 
                    placeholder: "入社後のイメージを具体化するための質問", 
                    memo: "メモを取りながら聞く姿勢を見せる" 
                },
                "教育体制": { 
                    question: "【逆質問】入社前の準備", 
                    answer: "内定をいただけた場合、入社までに少しでも即戦力に近づきたいと考えております。\n\n入社までに特に勉強しておくべき知識や、読んでおくべき書籍などがあれば教えていただけますでしょうか？", 
                    placeholder: "学習意欲をアピールする質問", 
                    memo: "" 
                },
                "懸念点の払拭": { 
                    question: "【逆質問】懸念点の払拭（クロージング）", 
                    answer: "本日は貴重なお話をありがとうございました。最後に一点だけよろしいでしょうか。\n\n私としては御社への入社を強く希望しておりますが、本日の面接を通じて、私の経験やスキルに関して何か懸念に感じられた点はございましたでしょうか？\nもしあれば、この場で補足させていただきたいと考えております。", 
                    placeholder: "最後に熱意を伝え、誤解を解くチャンス", 
                    important: true 
                }
            }
        }
    },
    "プレゼン：構成案テンプレート": {
        desc: "フック、本論、解決策の王道構成",
        data: {
            "プレゼン": {
                "導入": { 
                    question: "導入：聞き手の関心を引く", 
                    answer: "皆様、本日はお集まりいただきありがとうございます。\n突然ですが、【驚きのデータや、聞き手への問いかけ】をご存知でしょうか？\n\n本日はこの課題を解決するための提案をお持ちしました。\n以下の流れでご説明いたします。\n1. 【現状の課題】\n2. 【解決策の提案】\n3. 【期待される効果】\n\nお時間は【〇分】ほど頂戴いたします。", 
                    placeholder: "問いかけ、驚きの事実、ストーリーなど", 
                    memo: "最初の10秒で心をつかむ！" 
                },
                "課題提起": { 
                    question: "現状分析と問題点の提示", 
                    answer: "まず現状についてですが、現在私たちのチーム（または業界）は【現在の状況】という状態にあります。\n\nしかし、ここで大きな問題となっているのが【解決すべき課題】です。\nこのまま放置すると、【予想される最悪の事態や損失】を招く恐れがあります。", 
                    placeholder: "現状分析と問題点の提示", 
                    memo: "" 
                },
                "解決策と根拠": { 
                    question: "具体的な提案内容とデータ", 
                    answer: "そこで私が提案する解決策は、【提案のコアメッセージ・結論】です。\n\nなぜこれが有効なのか、理由は2つあります。\n\n1つ目は、【理由1】です。\n【裏付けとなるデータや事例】\n\n2つ目は、【理由2】です。\n【コスト削減や効率化などのメリット】", 
                    placeholder: "結論→理由→具体例 の順で", 
                    memo: "ゆっくり力強く話す", 
                    important: true 
                },
                "まとめ・アクション": { 
                    question: "メッセージの再確認と次の行動", 
                    answer: "まとめますと、【提案のコアメッセージ】を実行することで、【得られる最大のベネフィット】を実現できます。\n\nこのプロジェクトを前に進めるため、まずは【聞き手に取ってほしい具体的な行動・ネクストアクション】をお願いしたいと考えております。\n\nご清聴ありがとうございました。質疑応答に移らせていただきます。", 
                    placeholder: "最も伝えたいことの反復と、具体的な行動喚起", 
                    memo: "最後まで堂々と！" 
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

    saveCurrentInput(); // 現在作業中の内容を保存
    let addedFolders = [];
    Object.keys(template.data).forEach(folder => {
        if (!appData[folder]) { // 既存のフォルダと重複しない場合のみ追加
            appData[folder] = JSON.parse(JSON.stringify(template.data[folder])); // 深いコピー
            addedFolders.push(folder);
        }
    });

    if (addedFolders.length > 0) {
        // 追加された最初のフォルダに自動移動
        currentTab = addedFolders[0];
        currentItem = Object.keys(appData[currentTab])[0];
        
        updateAllUI();
        saveData();
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
    const defaultTemplates = [
        "面接：志望動機",
        "面接：自己PR",
        "面接：基本質問セット",
        "面接：ガクチカ・実績深掘り",
        "面接：逆質問",
        "プレゼン：構成案テンプレート"
    ];

    defaultTemplates.forEach(key => {
        const template = templateLibrary[key];
        if (template) {
            Object.keys(template.data).forEach(folder => {
                    appData[folder] = JSON.parse(JSON.stringify(template.data[folder]));
            });
        }
    });

    // 「志望動機」を初期表示に設定（存在する場合）
    if (appData["志望動機"]) {
        currentTab = "志望動機";
        const items = Object.keys(appData[currentTab]);
        currentItem = items.length > 0 ? items[0] : "";
    } else {
        // 志望動機がなければ最初のフォルダ
        const keys = Object.keys(appData).filter(k => !k.startsWith('_'));
        if (keys.length > 0) {
            currentTab = keys[0];
            const items = Object.keys(appData[currentTab]);
            currentItem = items.length > 0 ? items[0] : "";
        }
    }

    updateAllUI();
    saveData(true);
}

function updateAllUI() {
    renderTabs();
    renderItemSelect();
    renderBreadcrumb();
    renderContent();
    updateUndoButtonVisibility();
}

function renderContent() {
    // currentTab, appData[currentTab], currentItem が有効でない場合は描画をスキップ
    if (!currentTab || !appData[currentTab] || !currentItem || !appData[currentTab][currentItem]) {
        document.getElementById('question').value = "";
        document.getElementById('answer').value = "";
        document.getElementById('memo').value = "";
        return;
    }
    
    const questionInput = document.getElementById('question');
    const item = appData[currentTab][currentItem];
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
    note.style.top = appData[currentTab][currentItem].top || "80px";
    note.style.left = appData[currentTab][currentItem].left || "740px";
    note.style.right = "auto";

    setNoteColor(appData[currentTab][currentItem].color || "#fff9c4");
    // 現在のフォントサイズ設定を適用
    applyFontSize();
    updateCharCount();
    
    // 練習モードの表示リセット
    if (isPracticeMode) {
        document.getElementById('practice-overlay').style.display = 'flex';
    }
    updateInputState();
}

function updateProductionPhrase() {
    const display = document.getElementById('production-phrase');
    const phrases = appData._motivationPhrases || [];
    if (isProductionMode && phrases.length > 0 && display) {
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        display.innerText = `「${randomPhrase}」`;
        display.style.display = 'block';
    } else {
        if (display) display.style.display = 'none';
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
        const item = appData[currentTab][currentItem];
        if (!item.important) {
            findFirstImportant();
        }
    }
    updateAllUI();
    showToast(isFilterActive ? "重要項目のみ表示中" : "すべての項目を表示");
}

function findFirstImportant() {
    for (const f in appData) {
        for (const i in appData[f]) {
            if (appData[f][i].important) {
                currentTab = f; currentItem = i;
                return;
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
    updateInputState(); // 編集モード切り替え後に必ず入力状態を更新
    showToast(isMobileEditMode ? "スマホ編集モードON" : "スマホ編集モードOFF");
}

function updateInputState() {
    const q = document.getElementById('question');
    const a = document.getElementById('answer');
    const m = document.getElementById('memo');
    const isMobile = window.innerWidth <= 600;
    const shouldBeReadOnly = isProductionMode || (isMobile && !isMobileEditMode);
    if(q) q.readOnly = shouldBeReadOnly;
    if(a) a.readOnly = shouldBeReadOnly; // 回答欄は常に読み取り専用にしない
    if(m) m.readOnly = shouldBeReadOnly; // メモ欄は常に読み取り専用にしない
}

function toggleProductionWithFullscreen() {
    isProductionMode = !isProductionMode;
    
    const icon = document.getElementById('main-fab-icon');
    const fab = document.getElementById('main-fab');
    const editActions = document.getElementById('edit-actions');
    
    if (isProductionMode) {
        // 本番モード開始
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log("Error attempting to enable full-screen mode", err);
            });
        }
        icon.innerText = 'edit';
        fab.title = "編集に戻る";
        if (editActions) editActions.style.display = 'none';
        showToast("本番モード・フルスクリーン開始");
        openTimerModal(); // 本番モード開始時にタイマーを自動表示
        if (!timerInterval) toggleTimer(); // タイマーを自動スタート
        
        // 応援メッセージの開始
        updateProductionPhrase();
        motivationInterval = setInterval(updateProductionPhrase, 10000); // 10秒ごとに更新
    } else {
        // 編集モードに戻る
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        icon.innerText = 'play_arrow';
        fab.title = "本番モード開始";
        if (editActions) editActions.style.display = 'flex';
        showToast("編集モードに戻りました");

        // 応援メッセージの停止
        if (motivationInterval) clearInterval(motivationInterval);
        const display = document.getElementById('production-phrase');
        if (display) display.style.display = 'none';
    }
    
    document.body.classList.toggle('production-mode', isProductionMode);
    updateInputState();
}

function toggleSettingsDropdown() {
    document.getElementById("settings-dropdown").classList.toggle("show");
}

function openGuideModal() {
    document.getElementById('guide-modal').style.display = 'flex';
    renderMotivationPhrases();
}

function closeGuideModal(event) {
    const modal = document.getElementById('guide-modal');
    if (!event || event.target === modal) {
        modal.style.display = 'none';
    }
}

function renderMotivationPhrases() {
    const list = document.getElementById('motivation-list');
    if (!list) return;
    list.innerHTML = "";
    const phrases = appData._motivationPhrases || [];
    phrases.forEach((text, index) => {
        const li = document.createElement('li');
        li.className = 'phrase-item';
        li.innerHTML = `<span>「${text}」</span><button onclick="deleteMotivationPhrase(${index})"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>`;
        list.appendChild(li);
    });
}

function addMotivationPhrase() {
    const input = document.getElementById('motivation-input');
    const text = input.value.trim();
    if (text) {
        if (!appData._motivationPhrases) appData._motivationPhrases = [];
        appData._motivationPhrases.push(text);
        input.value = "";
        renderMotivationPhrases();
        saveData(true);
    }
}

function deleteMotivationPhrase(index) {
    appData._motivationPhrases.splice(index, 1);
    renderMotivationPhrases();
    saveData(true);
}

function toggleStar() {
    const item = appData[currentTab][currentItem];
    item.important = !item.important;
    renderContent();
}

// --- タイマー機能 ---
function openTimerModal() {
    const panel = document.getElementById('timer-modal');
    panel.style.display = 'block';
    
    // 本番モード時のスマホタイマーをタップで操作可能にする
    panel.onclick = (e) => {
        if (isProductionMode && window.innerWidth <= 600) {
            toggleTimer();
        }
    };
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
        let itemKeys = Object.keys(appData[currentTab]);
        if (isFilterActive) {
            itemKeys = itemKeys.filter(i => appData[currentTab][i].important);
        }
        
        const currentIndex = itemKeys.indexOf(currentItem);
        
        if (diffX > 0) {
            // 左スワイプ -> 次の項目へ
            if (currentIndex < itemKeys.length - 1) {
                saveCurrentInput();
                currentItem = itemKeys[currentIndex + 1];
                updateAllUI();
            }
        } else {
            // 右スワイプ -> 前の項目へ
            if (currentIndex > 0) {
                saveCurrentInput();
                currentItem = itemKeys[currentIndex - 1];
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
    const container = document.getElementById('print-all-container');
    if (!container) return;

    let html = "";
    for (const folder in appData) {
        if (folder.startsWith('_')) continue;
        html += `<h1 class="print-big">${folder}</h1>`;
        for (const itemKey in appData[folder]) {
            const item = appData[folder][itemKey];
            html += `
                <div class="print-item">
                    <div class="print-question">${item.question || itemKey}</div>
                    <div class="print-answer">${item.answer || ""}</div>
                </div>
            `;
        }
    }
    container.innerHTML = html;
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
    const menuItem = document.getElementById('undo-menu-item');
    const hasArchive = !!localStorage.getItem('scriptor_archive');
    if (menuItem) menuItem.style.display = hasArchive ? 'flex' : 'none';
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
    if (currentTab && currentItem && appData[currentTab] && appData[currentTab][currentItem]) {
        const q = document.getElementById('question');
        const a = document.getElementById('answer');
        if (!q || !a || q.value === "" && a.value === "") return; // DOM未準備、または初期化直後の空上書きを防止

        const item = appData[currentTab][currentItem];
        item.question = q.value;
        item.answer = a.value;
        item.memo = document.getElementById('memo').value || "";
        item.color = currentNoteColor;
        const note = document.querySelector('.sticky-note');
        item.top = note.style.top;
        item.left = note.style.left;
    }
}

/**
 * データの保存を実行する
 * @param {boolean} isAuto 自動保存フラグ（trueの場合は音とトーストを抑制）
 */
async function saveData(isAuto = false) {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    saveCurrentInput();
    
    // 手動保存時のみ音を鳴らす
    if (!isAuto) {
        const sound = document.getElementById('save-sound');
        if (sound) { sound.currentTime = 0; sound.play().catch(() => {}); }
    }

    const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
    });

    if (response.ok) {
        if (!isAuto) {
            showToast("保存しました！");
        } else {
            showAutoSaveIndicator();
        }
    }
}

function showAutoSaveIndicator() {
    const status = document.getElementById('autosave-status');
    if (status) {
        status.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">cloud_done</span> 自動保存済み';
        status.classList.add('visible');
        setTimeout(() => {
            status.classList.remove('visible');
        }, 2000);
    }
}

function triggerAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveData(true);
    }, 2500); // 2.5秒後に実行
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
        if (big.startsWith('_')) return false;
        if (!isFilterActive) return true;
        return Object.values(appData[big]).some(item => item.important);
    };

    Object.keys(appData).forEach(big => {
        if (!hasImportantInBig(big)) return;
        const tab = document.createElement('div');
        tab.className = `tab ${big === currentTab ? 'active' : ''}`;
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

        tab.onclick = () => { saveCurrentInput(); currentTab = big; currentItem = Object.keys(appData[big])[0] || ""; updateAllUI(); };
        container.appendChild(tab);
    });
}

function renderItemSelect() {
    const select = document.getElementById('item-select');
    select.innerHTML = "";

    Object.keys(appData[currentTab]).forEach(itemKey => {
        if (isFilterActive && !appData[currentTab][itemKey].important) return;

        const opt = new Option(itemKey, itemKey);
        if (itemKey === currentItem) opt.selected = true;
        select.add(opt);
    });
}

function renderBreadcrumb() {
    const container = document.getElementById('breadcrumb');
    container.innerHTML = "";
    
    const folderSpan = document.createElement('span');
    folderSpan.innerText = currentTab;
    folderSpan.onclick = openTocModal;

    const separator = document.createTextNode(' ＞ ');
    
    const itemSpan = document.createElement('span');
    itemSpan.innerText = currentItem;

    container.appendChild(folderSpan);
    container.appendChild(separator);
    container.appendChild(itemSpan);
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

    items = Object.keys(appData[currentTab]);
    if (isFilterActive) {
        items = items.filter(i => appData[currentTab][i].important);
    }
    currentActive = currentItem;
    onSelect = (val) => {
        currentItem = val;
    };

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

function changeItem() {
    saveCurrentInput();
    currentItem = document.getElementById('item-select').value;
    renderContent();
}

function addTab() { // フォルダ(タブ)の追加
    const name = prompt("新しいフォルダの名前:");
    if (name && !appData[name]) {
        saveCurrentInput();
        appData[name] = { "新規項目": { "question": "", "answer": "", "memo": "" } };
        currentTab = name; currentItem = "新規項目";
        updateAllUI();
        saveData();
        document.getElementById('question').focus();
    }
}

function addItem() {
    const name = prompt("新しい項目の名前:");
    if (name && !appData[currentTab][name]) {
        saveCurrentInput();
        appData[currentTab][name] = { "question": "", "answer": "", "memo": "" };
        currentItem = name;
        updateAllUI();
        saveData();
        document.getElementById('question').focus();
    }
}

function renameTab() { // フォルダ(タブ)のリネーム
    const newName = prompt(`フォルダ「${currentTab}」の新しい名前:`, currentTab);
    if (newName && newName !== currentTab && !appData[newName]) {
        appData[newName] = appData[currentTab];
        delete appData[currentTab];
        currentTab = newName;
        updateAllUI();
        saveData();
    }
}

function deleteTab() { // フォルダ(タブ)の削除
    const folderKeys = Object.keys(appData).filter(k => !k.startsWith('_'));
    if (folderKeys.length <= 1) { alert("最低1つのフォルダが必要です。"); return; }
    if (confirm(`フォルダ「${currentTab}」を削除しますか？`)) {
        archiveCurrentData();
        delete appData[currentTab];
        currentTab = Object.keys(appData).filter(k => !k.startsWith('_'))[0];
        currentItem = Object.keys(appData[currentTab])[0];
        updateAllUI();
        saveData();
    }
}

function renameItem() {
    const newName = prompt(`項目「${currentItem}」の新しい名前:`, currentItem);
    if (newName && newName !== currentItem && !appData[currentTab][newName]) {
        appData[currentTab][newName] = appData[currentTab][currentItem];
        delete appData[currentTab][currentItem];
        currentItem = newName;
        updateAllUI();
        saveData();
    }
}

function deleteItem() {
    if (Object.keys(appData[currentTab]).length <= 1) { alert("最低1つの項目が必要です。"); return; }
    if (confirm(`項目「${currentItem}」を削除しますか？`)) {
        archiveCurrentData();
        delete appData[currentTab][currentItem];
        currentItem = Object.keys(appData[currentTab])[0];
        updateAllUI();
        saveData();
    }
}

async function resetAllData() {
    if (confirm("全てのデータを初期状態に戻しますか？")) {
        archiveCurrentData();
        const res = await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        if (res.ok) {
            appData = {}; // クライアント側のデータもクリア
            await setupDefaultTemplates(); // 初期テンプレートを再セットアップ
        }
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

    Object.keys(appData).forEach(folder => {
        if (folder.startsWith('_')) return;
        if (!appData[folder] || Object.keys(appData[folder]).length === 0) return;

        const itemsToShow = Object.keys(appData[folder]).filter(itemKey => {
            return !isFilterActive || appData[folder][itemKey].important;
        });

        if (itemsToShow.length === 0) return;

        // フォルダタイトル
        const bigDiv = document.createElement('div');
        bigDiv.className = 'toc-big-title';
        bigDiv.innerText = folder;
        container.appendChild(bigDiv);

        itemsToShow.forEach(itemKey => {
            const item = appData[folder][itemKey];
            const smallDiv = document.createElement('div');
            const isActive = (folder === currentTab && itemKey === currentItem);
            smallDiv.className = 'toc-small-item' + (isActive ? ' active' : '');

            const label = item.question || itemKey;
            smallDiv.innerHTML = `
                <span>${label}</span>
                ${item.important ? '<span class="material-symbols-outlined toc-star">star</span>' : ''}
            `;

            smallDiv.onclick = () => {
                saveCurrentInput();
                currentTab = folder;
                currentItem = itemKey;
                updateAllUI();
                document.getElementById('toc-modal').style.display = 'none';
            };
            container.appendChild(smallDiv);
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

    for (const folder in appData) {
        if (folder.startsWith('_')) continue;
        for (const itemKey in appData[folder]) {
            const item = appData[folder][itemKey];
            if (itemKey.toLowerCase().includes(q) || 
                item.question.toLowerCase().includes(q) || 
                item.answer.toLowerCase().includes(q)) {
                results.push({ folder, itemKey, question: item.question || itemKey });
            }
        }
    }

    resultsContainer.innerHTML = "";
    if (results.length > 0) {
        results.forEach(res => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `
                <div class="item-path">${res.folder}</div>
                <div class="item-text">${res.question}</div>
            `;
            div.onclick = () => {
                saveCurrentInput();
                currentTab = res.folder;
                currentItem = res.itemKey;
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
    document.getElementById('question').addEventListener('input', () => {
        autoResizeQuestion();
        triggerAutoSave();
    });
    document.getElementById('answer').addEventListener('input', () => {
        updateCharCount();
        triggerAutoSave();
    });
    document.getElementById('memo').addEventListener('input', triggerAutoSave);

    // スマホ入力中にキーボードが表示された際、フッターやFABを隠す処理
    const inputs = document.querySelectorAll('#question, #answer, #memo, #motivation-input'); // 特定の入力フィールドのみ対象
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
        if (e.key === 'Escape') {
            // 1. モーダル類をすべて隠す
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(m => m.style.display = 'none');
            const timer = document.getElementById('timer-modal');
            if (timer) timer.style.display = 'none';

            // 2. 全画面解除
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }

            // 3. 本番モード解除
            if (isProductionMode) {
                toggleProductionWithFullscreen();
            }
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveData();
        }
    });

    // ドロップダウンやポップアップの外側をクリックしたら閉じる処理
    window.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            const dropdowns = document.getElementsByClassName("dropdown-content");
            for (let i = 0; i < dropdowns.length; i++) {
                if (dropdowns[i].classList.contains('show')) {
                    dropdowns[i].classList.remove('show');
                }
            }
        }
        if (!e.target.closest('.search-wrapper')) {
            document.getElementById('search-results').classList.remove('active');
        }
    });
};

function toggleChecklist(el) {
    el.classList.toggle('checked');
}