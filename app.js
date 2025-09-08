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
        // メニュー管理の種別変更イベント
        document.getElementById('newMenuType').addEventListener('change', () => {
            this.updateMenuFieldsConfig();
        });
        
        // カスタム記録の種別変更イベント
        document.getElementById('recordType').addEventListener('change', () => {
            this.updateCustomValueInputs();
        });
        
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

    // メニュー種別に応じた設定フィールド更新
    updateMenuFieldsConfig() {
        const type = document.getElementById('newMenuType').value;
        const container = document.getElementById('menuFieldsConfig');
        
        switch (type) {
            case 'checkbox':
                container.innerHTML = '<div class="single-field"><span>チェック形式のため設定は不要です</span></div>';
                break;
            case 'single':
                container.innerHTML = '<div class="single-field"><input type="text" id="newMenuUnit" placeholder="単位 (必要な場合)"></div>';
                break;
            case 'distance_time':
                container.innerHTML = `
                    <div class="multi-fields">
                        <input type="text" id="distanceUnit" placeholder="距離の単位 (例: km)" value="km">
                        <input type="text" id="timeUnit" placeholder="時間の単位 (例: 分)" value="分">
                    </div>
                `;
                break;
            case 'weight_reps':
                container.innerHTML = `
                    <div class="multi-fields">
                        <input type="text" id="weightUnit" placeholder="重量の単位 (例: kg)" value="kg">
                        <input type="text" id="repsUnit" placeholder="回数の単位 (例: 回)" value="回">
                    </div>
                `;
                break;
            case 'custom_multi':
                container.innerHTML = `
                    <div class="custom-fields">
                        <input type="text" id="customField1" placeholder="項目1の名前 (例: セット数)">
                        <input type="text" id="customUnit1" placeholder="単位1">
                        <input type="text" id="customField2" placeholder="項目2の名前 (例: 回数)">
                        <input type="text" id="customUnit2" placeholder="単位2">
                        <button type="button" onclick="app.addCustomField()">項目追加</button>
                    </div>
                `;
                break;
        }
    }
    
    // 定期メニュー追加
    addPredefinedMenu() {
        const name = document.getElementById('newMenuName').value.trim();
        const type = document.getElementById('newMenuType').value;
        
        if (!name) {
            alert('メニュー名を入力してください');
            return;
        }
        
        let fields = [];
        
        switch (type) {
            case 'checkbox':
                // チェック形式は特別扱い
                break;
            case 'single':
                const unit = document.getElementById('newMenuUnit')?.value.trim() || '';
                fields = [{ name: 'value', label: '値', unit }];
                break;
            case 'distance_time':
                const distanceUnit = document.getElementById('distanceUnit')?.value.trim() || 'km';
                const timeUnit = document.getElementById('timeUnit')?.value.trim() || '分';
                fields = [
                    { name: 'distance', label: '距離', unit: distanceUnit },
                    { name: 'time', label: '時間', unit: timeUnit }
                ];
                break;
            case 'weight_reps':
                const weightUnit = document.getElementById('weightUnit')?.value.trim() || 'kg';
                const repsUnit = document.getElementById('repsUnit')?.value.trim() || '回';
                fields = [
                    { name: 'weight', label: '重量', unit: weightUnit },
                    { name: 'reps', label: '回数', unit: repsUnit }
                ];
                break;
            case 'custom_multi':
                const field1 = document.getElementById('customField1')?.value.trim();
                const unit1 = document.getElementById('customUnit1')?.value.trim();
                const field2 = document.getElementById('customField2')?.value.trim();
                const unit2 = document.getElementById('customUnit2')?.value.trim();
                
                if (field1) fields.push({ name: 'custom1', label: field1, unit: unit1 || '' });
                if (field2) fields.push({ name: 'custom2', label: field2, unit: unit2 || '' });
                break;
        }

        const menu = {
            id: Date.now().toString(),
            name,
            type,
            fields
        };

        this.data.menus.push(menu);
        this.saveData();
        this.renderMenuManagement();
        this.renderDailyView();

        // フォームクリア
        document.getElementById('newMenuName').value = '';
        this.updateMenuFieldsConfig();
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

    // カスタム記録の入力フィールド更新
    updateCustomValueInputs() {
        const type = document.getElementById('recordType').value;
        const container = document.getElementById('customValueInputs');
        
        switch (type) {
            case 'single':
                container.innerHTML = `
                    <div class="single-input">
                        <input type="number" id="recordValue" placeholder="値">
                        <input type="text" id="recordUnit" placeholder="単位">
                    </div>
                `;
                break;
            case 'distance_time':
                container.innerHTML = `
                    <div class="multi-input">
                        <input type="number" id="distanceValue" placeholder="距離" step="0.1">
                        <span>km</span>
                        <input type="number" id="timeValue" placeholder="時間" step="0.1">
                        <span>分</span>
                    </div>
                `;
                break;
            case 'weight_reps':
                container.innerHTML = `
                    <div class="multi-input">
                        <input type="number" id="weightValue" placeholder="重量" step="0.1">
                        <span>kg</span>
                        <input type="number" id="repsValue" placeholder="回数" step="1">
                        <span>回</span>
                    </div>
                `;
                break;
            case 'custom_multi':
                container.innerHTML = `
                    <div class="custom-multi-input">
                        <input type="number" id="value1" placeholder="値1" step="0.1">
                        <input type="text" id="unit1" placeholder="単位1">
                        <input type="number" id="value2" placeholder="値2" step="0.1">
                        <input type="text" id="unit2" placeholder="単位2">
                    </div>
                `;
                break;
        }
    }
    
    // カスタム記録追加
    addCustomRecord() {
        const name = document.getElementById('customMenuName').value.trim();
        const type = document.getElementById('recordType').value;
        
        if (!name) {
            alert('メニュー名を入力してください');
            return;
        }
        
        let values = {};
        let hasValidValue = false;
        
        switch (type) {
            case 'single':
                const value = document.getElementById('recordValue')?.value;
                const unit = document.getElementById('recordUnit')?.value.trim();
                if (value) {
                    values = { value: parseFloat(value), unit: unit || '' };
                    hasValidValue = true;
                }
                break;
            case 'distance_time':
                const distance = document.getElementById('distanceValue')?.value;
                const time = document.getElementById('timeValue')?.value;
                if (distance || time) {
                    values = {
                        distance: distance ? parseFloat(distance) : null,
                        distanceUnit: 'km',
                        time: time ? parseFloat(time) : null,
                        timeUnit: '分'
                    };
                    hasValidValue = true;
                }
                break;
            case 'weight_reps':
                const weight = document.getElementById('weightValue')?.value;
                const reps = document.getElementById('repsValue')?.value;
                if (weight || reps) {
                    values = {
                        weight: weight ? parseFloat(weight) : null,
                        weightUnit: 'kg',
                        reps: reps ? parseInt(reps) : null,
                        repsUnit: '回'
                    };
                    hasValidValue = true;
                }
                break;
            case 'custom_multi':
                const val1 = document.getElementById('value1')?.value;
                const unit1 = document.getElementById('unit1')?.value.trim();
                const val2 = document.getElementById('value2')?.value;
                const unit2 = document.getElementById('unit2')?.value.trim();
                if (val1 || val2) {
                    values = {
                        value1: val1 ? parseFloat(val1) : null,
                        unit1: unit1 || '',
                        value2: val2 ? parseFloat(val2) : null,
                        unit2: unit2 || ''
                    };
                    hasValidValue = true;
                }
                break;
        }
        
        if (!hasValidValue) {
            alert('少なくとも1つの値を入力してください');
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
            values,
            timestamp: new Date().toLocaleTimeString()
        };

        this.data.records[today].custom.push(record);
        this.saveData();
        this.renderDailyView();

        // フォームクリア
        document.getElementById('customMenuName').value = '';
        this.updateCustomValueInputs();
    }

    // 定期メニューの記録更新（複数値対応）
    updatePredefinedRecord(menuId, fieldName, value, isChecked) {
        const today = this.getCurrentDateString();
        if (!this.data.records[today]) {
            this.data.records[today] = { predefined: {}, custom: [] };
        }

        if (!this.data.records[today].predefined[menuId]) {
            this.data.records[today].predefined[menuId] = {};
        }

        if (isChecked !== undefined) {
            this.data.records[today].predefined[menuId] = { checked: isChecked };
        } else if (fieldName && value !== undefined && value !== '') {
            this.data.records[today].predefined[menuId][fieldName] = parseFloat(value);
        } else if (fieldName && (value === undefined || value === '')) {
            delete this.data.records[today].predefined[menuId][fieldName];
            // 全てのフィールドが空になったら記録を削除
            if (Object.keys(this.data.records[today].predefined[menuId]).length === 0) {
                delete this.data.records[today].predefined[menuId];
            }
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
                case 'single':
                    const value = record?.value || '';
                    const unit = menu.fields?.[0]?.unit || '';
                    inputElement = `
                        <input type="number" value="${value}" placeholder="値を入力"
                               onchange="app.updatePredefinedRecord('${menu.id}', 'value', this.value)">
                        <span class="unit">${unit}</span>
                    `;
                    break;
                case 'distance_time':
                case 'weight_reps':
                case 'custom_multi':
                    inputElement = '<div class="multi-inputs">';
                    menu.fields?.forEach(field => {
                        const fieldValue = record?.[field.name] || '';
                        inputElement += `
                            <div class="field-input">
                                <input type="number" value="${fieldValue}" placeholder="${field.label}"
                                       onchange="app.updatePredefinedRecord('${menu.id}', '${field.name}', this.value)">
                                <span class="unit">${field.unit}</span>
                            </div>
                        `;
                    });
                    inputElement += '</div>';
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

        container.innerHTML = customRecords.map(record => {
            let valueDisplay = '';
            
            if (record.values) {
                switch (record.type) {
                    case 'single':
                        valueDisplay = `${record.values.value} ${record.values.unit}`;
                        break;
                    case 'distance_time':
                        const parts = [];
                        if (record.values.distance) parts.push(`${record.values.distance}${record.values.distanceUnit}`);
                        if (record.values.time) parts.push(`${record.values.time}${record.values.timeUnit}`);
                        valueDisplay = parts.join(' / ');
                        break;
                    case 'weight_reps':
                        const weightParts = [];
                        if (record.values.weight) weightParts.push(`${record.values.weight}${record.values.weightUnit}`);
                        if (record.values.reps) weightParts.push(`${record.values.reps}${record.values.repsUnit}`);
                        valueDisplay = weightParts.join(' × ');
                        break;
                    case 'custom_multi':
                        const customParts = [];
                        if (record.values.value1) customParts.push(`${record.values.value1}${record.values.unit1}`);
                        if (record.values.value2) customParts.push(`${record.values.value2}${record.values.unit2}`);
                        valueDisplay = customParts.join(' / ');
                        break;
                }
            } else {
                // 旧形式との互換性
                valueDisplay = `${record.value || ''} ${record.unit || ''}`;
            }
            
            return `
                <div class="custom-record">
                    <div class="record-info">
                        <span class="record-name">${record.name}</span>
                        <span class="record-value">${valueDisplay}</span>
                        <span class="record-time">${record.timestamp}</span>
                    </div>
                    <button class="delete-btn" onclick="app.deleteCustomRecord('${record.id}')">削除</button>
                </div>
            `;
        }).join('');
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
                    ${menu.fields && menu.fields.length > 0 ? 
                        menu.fields.map(field => `<span class="menu-unit">${field.label}: ${field.unit}</span>`).join(' ') : 
                        ''}
                </div>
                <button class="delete-btn" onclick="app.deletePredefinedMenu('${menu.id}')">削除</button>
            </div>
        `).join('');
    }

    getTypeLabel(type) {
        const labels = {
            checkbox: 'チェック',
            single: '単一値',
            distance_time: '距離と時間',
            weight_reps: '重量と回数',
            custom_multi: 'カスタム複数値'
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
                    let value = '';
                    if (record.checked) {
                        value = '完了';
                    } else if (menu.type === 'single' && record.value) {
                        const unit = menu.fields?.[0]?.unit || '';
                        value = `${record.value} ${unit}`;
                    } else if (menu.fields && menu.fields.length > 1) {
                        const parts = [];
                        menu.fields.forEach(field => {
                            if (record[field.name]) {
                                parts.push(`${record[field.name]}${field.unit}`);
                            }
                        });
                        value = parts.join(' / ');
                    }
                    
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
                let valueDisplay = '';
                
                if (record.values) {
                    switch (record.type) {
                        case 'single':
                            valueDisplay = `${record.values.value} ${record.values.unit}`;
                            break;
                        case 'distance_time':
                            const parts = [];
                            if (record.values.distance) parts.push(`${record.values.distance}${record.values.distanceUnit}`);
                            if (record.values.time) parts.push(`${record.values.time}${record.values.timeUnit}`);
                            valueDisplay = parts.join(' / ');
                            break;
                        case 'weight_reps':
                            const weightParts = [];
                            if (record.values.weight) weightParts.push(`${record.values.weight}${record.values.weightUnit}`);
                            if (record.values.reps) weightParts.push(`${record.values.reps}${record.values.repsUnit}`);
                            valueDisplay = weightParts.join(' × ');
                            break;
                        case 'custom_multi':
                            const customParts = [];
                            if (record.values.value1) customParts.push(`${record.values.value1}${record.values.unit1}`);
                            if (record.values.value2) customParts.push(`${record.values.value2}${record.values.unit2}`);
                            valueDisplay = customParts.join(' / ');
                            break;
                    }
                } else {
                    // 旧形式との互換性
                    valueDisplay = `${record.value || ''} ${record.unit || ''}`;
                }
                
                html += `
                    <div class="history-item">
                        <span class="menu-name">${record.name}</span>
                        <span class="record-value">${valueDisplay}</span>
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