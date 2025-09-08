class TrainingTracker {
    constructor() {
        this.data = {
            menus: [],
            records: {}
        };
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupTabs();
        this.displayCurrentDate();
        this.renderDailyView();
        this.renderMenuManagement();
    }

    // ローカルストレージ関連
    loadData() {
        const savedData = localStorage.getItem('trainingData');
        if (savedData) {
            this.data = JSON.parse(savedData);
        }
    }

    saveData() {
        localStorage.setItem('trainingData', JSON.stringify(this.data));
    }

    // 日付関連
    getCurrentDateString() {
        return new Date().toISOString().split('T')[0];
    }

    displayCurrentDate() {
        const today = new Date();
        const dateString = today.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        document.getElementById('currentDate').textContent = dateString;
    }

    // タブ切り替え
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                button.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
                
                if (tabId === 'history') {
                    this.setupHistoryView();
                }
            });
        });
    }

    // イベントリスナー設定
    setupEventListeners() {
        // メニュー追加
        document.getElementById('addMenu').addEventListener('click', () => {
            this.addPredefinedMenu();
        });

        // カスタム記録追加
        document.getElementById('addCustomRecord').addEventListener('click', () => {
            this.addCustomRecord();
        });

        // データ管理
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('clearData').addEventListener('click', () => {
            if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
                this.clearAllData();
            }
        });

        // 履歴表示
        document.getElementById('showHistory').addEventListener('click', () => {
            this.showHistoryForDate();
        });
    }

    // 定期メニュー追加
    addPredefinedMenu() {
        const name = document.getElementById('newMenuName').value.trim();
        const type = document.getElementById('newMenuType').value;
        const unit = document.getElementById('newMenuUnit').value.trim();

        if (!name) {
            alert('メニュー名を入力してください');
            return;
        }

        const menu = {
            id: Date.now().toString(),
            name,
            type,
            unit: unit || ''
        };

        this.data.menus.push(menu);
        this.saveData();
        this.renderMenuManagement();
        this.renderDailyView();

        // フォームクリア
        document.getElementById('newMenuName').value = '';
        document.getElementById('newMenuUnit').value = '';
    }

    // 定期メニュー削除
    deletePredefinedMenu(menuId) {
        if (confirm('このメニューを削除しますか？')) {
            this.data.menus = this.data.menus.filter(menu => menu.id !== menuId);
            this.saveData();
            this.renderMenuManagement();
            this.renderDailyView();
        }
    }

    // カスタム記録追加
    addCustomRecord() {
        const name = document.getElementById('customMenuName').value.trim();
        const type = document.getElementById('recordType').value;
        const value = document.getElementById('recordValue').value;
        const unit = document.getElementById('recordUnit').value.trim();

        if (!name || !value) {
            alert('メニュー名と値を入力してください');
            return;
        }

        const today = this.getCurrentDateString();
        if (!this.data.records[today]) {
            this.data.records[today] = { predefined: {}, custom: [] };
        }

        const record = {
            id: Date.now().toString(),
            name,
            type,
            value: parseFloat(value),
            unit: unit || '',
            timestamp: new Date().toLocaleTimeString()
        };

        this.data.records[today].custom.push(record);
        this.saveData();
        this.renderDailyView();

        // フォームクリア
        document.getElementById('customMenuName').value = '';
        document.getElementById('recordValue').value = '';
        document.getElementById('recordUnit').value = '';
    }

    // 定期メニューの記録更新
    updatePredefinedRecord(menuId, value, isChecked) {
        const today = this.getCurrentDateString();
        if (!this.data.records[today]) {
            this.data.records[today] = { predefined: {}, custom: [] };
        }

        if (isChecked !== undefined) {
            this.data.records[today].predefined[menuId] = { checked: isChecked };
        } else if (value !== undefined && value !== '') {
            this.data.records[today].predefined[menuId] = { value: parseFloat(value) };
        } else {
            delete this.data.records[today].predefined[menuId];
        }

        this.saveData();
    }

    // カスタム記録削除
    deleteCustomRecord(recordId) {
        const today = this.getCurrentDateString();
        if (this.data.records[today] && this.data.records[today].custom) {
            this.data.records[today].custom = this.data.records[today].custom.filter(
                record => record.id !== recordId
            );
            this.saveData();
            this.renderDailyView();
        }
    }

    // 今日の記録表示
    renderDailyView() {
        this.renderPredefinedList();
        this.renderCustomRecords();
    }

    renderPredefinedList() {
        const container = document.getElementById('predefinedList');
        const today = this.getCurrentDateString();
        const todayRecords = this.data.records[today]?.predefined || {};

        if (this.data.menus.length === 0) {
            container.innerHTML = '<p class="empty-state">定期メニューがありません。メニュー管理から追加してください。</p>';
            return;
        }

        container.innerHTML = this.data.menus.map(menu => {
            const record = todayRecords[menu.id];
            let inputElement = '';

            switch (menu.type) {
                case 'checkbox':
                    const checked = record?.checked ? 'checked' : '';
                    inputElement = `
                        <input type="checkbox" id="menu-${menu.id}" ${checked}
                               onchange="app.updatePredefinedRecord('${menu.id}', undefined, this.checked)">
                        <label for="menu-${menu.id}">完了</label>
                    `;
                    break;
                case 'reps':
                case 'time':
                case 'weight':
                    const value = record?.value || '';
                    inputElement = `
                        <input type="number" value="${value}" placeholder="値を入力"
                               onchange="app.updatePredefinedRecord('${menu.id}', this.value)">
                        <span class="unit">${menu.unit}</span>
                    `;
                    break;
            }

            return `
                <div class="menu-item">
                    <div class="menu-name">${menu.name}</div>
                    <div class="menu-input">
                        ${inputElement}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCustomRecords() {
        const container = document.getElementById('customRecords');
        const today = this.getCurrentDateString();
        const customRecords = this.data.records[today]?.custom || [];

        if (customRecords.length === 0) {
            container.innerHTML = '<p class="empty-state">カスタム記録がありません。</p>';
            return;
        }

        container.innerHTML = customRecords.map(record => `
            <div class="custom-record">
                <div class="record-info">
                    <span class="record-name">${record.name}</span>
                    <span class="record-value">${record.value} ${record.unit}</span>
                    <span class="record-time">${record.timestamp}</span>
                </div>
                <button class="delete-btn" onclick="app.deleteCustomRecord('${record.id}')">削除</button>
            </div>
        `).join('');
    }

    // メニュー管理表示
    renderMenuManagement() {
        const container = document.getElementById('menuList');
        
        if (this.data.menus.length === 0) {
            container.innerHTML = '<p class="empty-state">定期メニューがありません。</p>';
            return;
        }

        container.innerHTML = this.data.menus.map(menu => `
            <div class="menu-management-item">
                <div class="menu-info">
                    <span class="menu-name">${menu.name}</span>
                    <span class="menu-type">${this.getTypeLabel(menu.type)}</span>
                    ${menu.unit ? `<span class="menu-unit">${menu.unit}</span>` : ''}
                </div>
                <button class="delete-btn" onclick="app.deletePredefinedMenu('${menu.id}')">削除</button>
            </div>
        `).join('');
    }

    getTypeLabel(type) {
        const labels = {
            checkbox: 'チェック',
            reps: '回数',
            time: '時間',
            weight: '重量'
        };
        return labels[type] || type;
    }

    // 履歴表示
    setupHistoryView() {
        const dateInput = document.getElementById('historyDate');
        if (!dateInput.value) {
            dateInput.value = this.getCurrentDateString();
        }
    }

    showHistoryForDate() {
        const date = document.getElementById('historyDate').value;
        const container = document.getElementById('historyDisplay');

        if (!date) {
            alert('日付を選択してください');
            return;
        }

        const records = this.data.records[date];
        if (!records) {
            container.innerHTML = '<p class="empty-state">この日の記録はありません。</p>';
            return;
        }

        let html = '';

        // 定期メニューの記録
        if (records.predefined && Object.keys(records.predefined).length > 0) {
            html += '<h3>定期メニュー</h3><div class="history-section">';
            Object.entries(records.predefined).forEach(([menuId, record]) => {
                const menu = this.data.menus.find(m => m.id === menuId);
                if (menu) {
                    const value = record.checked ? '完了' : record.value ? `${record.value} ${menu.unit}` : '';
                    html += `
                        <div class="history-item">
                            <span class="menu-name">${menu.name}</span>
                            <span class="record-value">${value}</span>
                        </div>
                    `;
                }
            });
            html += '</div>';
        }

        // カスタム記録
        if (records.custom && records.custom.length > 0) {
            html += '<h3>カスタム記録</h3><div class="history-section">';
            records.custom.forEach(record => {
                html += `
                    <div class="history-item">
                        <span class="menu-name">${record.name}</span>
                        <span class="record-value">${record.value} ${record.unit}</span>
                        <span class="record-time">${record.timestamp}</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        container.innerHTML = html || '<p class="empty-state">この日の記録はありません。</p>';
    }

    // データエクスポート
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-data-${this.getCurrentDateString()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // データインポート
    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (confirm('現在のデータを置き換えますか？この操作は取り消せません。')) {
                    this.data = importedData;
                    this.saveData();
                    this.renderDailyView();
                    this.renderMenuManagement();
                    alert('データをインポートしました。');
                }
            } catch (error) {
                alert('無効なファイルです。');
            }
        };
        reader.readAsText(file);
    }

    // 全データクリア
    clearAllData() {
        this.data = { menus: [], records: {} };
        localStorage.removeItem('trainingData');
        this.renderDailyView();
        this.renderMenuManagement();
        alert('すべてのデータをクリアしました。');
    }
}

// アプリ初期化
const app = new TrainingTracker();