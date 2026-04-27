from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)
DATA_FILE = 'kanpe_data.json'

default_data = {
    "志望動機": {
        "業界について": {
            "なぜITか": {"question": "IT業界を選んだ理由は？", "answer": "私がIT業界を志望する理由は...", "memo": "情熱を伝える！", "color": "#fff9c4", "top": "80px", "left": "740px"},
            "他業界との比較": {"question": "他の業界は見なかったのですか？", "answer": "はい、実は...", "memo": "", "color": "#fff9c4", "top": "80px", "left": "740px"}
        },
        "自社について": {
            "なぜ当社か": {"question": "数ある中でなぜ当社ですか？", "answer": "御社の〇〇という理念に共感し...", "memo": "", "color": "#fff9c4", "top": "80px", "left": "740px"}
        }
    },
    "自己PR": {
        "強み": {
            "継続力": {"question": "あなたの強みは何ですか？", "answer": "私の強みは継続力です。", "memo": "具体的なエピソードを準備", "color": "#fff9c4", "top": "80px", "left": "740px"}
        }
    }
}

def load_data():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_data, f, ensure_ascii=False, indent=4)
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data', methods=['GET', 'POST'])
def api_data():
    if request.method == 'POST':
        data = request.json
        save_data(data)
        return jsonify({"status": "success"})
    return jsonify(load_data())

@app.route('/api/reset', methods=['POST'])
def api_reset():
    save_data(default_data)
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True)