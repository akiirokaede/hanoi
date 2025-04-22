/**
 * 道具系统
 * 管理游戏中的各种道具及其效果
 */

// 道具类型定义
const ItemTypes = {
    TIME_GEM: 'time_gem',         // 时间宝石 - 增加关卡时间
    MOVE_AMULET: 'move_amulet',   // 移动护符 - 增加允许的移动次数
    TELEPORT_STONE: 'teleport_stone', // 传送石 - 允许一次违反规则的移动
    DOUBLE_SCORE: 'double_score', // 双倍符 - 下一关的分数翻倍
    INSIGHT_EYE: 'insight_eye',   // 洞察之眼 - 显示最优移动路径
    SHIELD: 'shield',             // 护盾 - 保护玩家一次失败
    MAGIC_WAND: 'magic_wand'      // 魔法棒 - 自动完成一次移动
};

class Item {
    constructor(type, name, description, icon, rarity, effect) {
        this.type = type;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.rarity = rarity; // 1-5，数字越高越稀有
        this.effect = effect; // 道具使用时触发的函数
        this.count = 1;      // 新增：道具数量，默认为1
    }
}

class ItemSystem {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.items = [];
        this.itemPool = [];
        this.initializeItemPool();
        this.itemsList = document.getElementById('items-list');
        this.notification = document.getElementById('item-notification');
        this.activeEffects = {
            doubleScore: false
        };
    }

    // 初始化道具池
    initializeItemPool() {
        this.itemPool = [
            new Item(
                ItemTypes.TIME_GEM, 
                '时间宝石', 
                '增加30秒时间', 
                createItemIcon('⏱️', '#3498db'),
                1,
                () => this.game.addTime(30)
            ),
            new Item(
                ItemTypes.MOVE_AMULET,
                '移动护符',
                '增加5次移动机会',
                createItemIcon('🔄', '#9b59b6'),
                2,
                () => this.game.addMoves(5)
            ),
            new Item(
                ItemTypes.TELEPORT_STONE,
                '传送石',
                '允许一次违反规则的移动',
                createItemIcon('✨', '#e74c3c'),
                3,
                () => this.game.enableTeleport()
            ),
            new Item(
                ItemTypes.DOUBLE_SCORE,
                '双倍符',
                '下一关的分数翻倍',
                createItemIcon('2️⃣', '#f1c40f'),
                3,
                () => this.activeEffects.doubleScore = true
            ),
            new Item(
                ItemTypes.INSIGHT_EYE,
                '洞察之眼',
                '显示最优移动路径',
                createItemIcon('👁️', '#2ecc71'),
                4,
                () => this.game.showHint()
            ),
            new Item(
                ItemTypes.SHIELD,
                '护盾',
                '保护玩家一次失败',
                createItemIcon('🛡️', '#e67e22'),
                4,
                () => this.game.activateShield()
            ),
            new Item(
                ItemTypes.MAGIC_WAND,
                '魔法棒',
                '自动完成一次最优移动',
                createItemIcon('🪄', '#1abc9c'),
                5,
                () => this.game.autoMove()
            )
        ];
    }

    // 根据关卡难度和触发类型生成道具
    generateItem(level, triggerType) {
        // 降低道具生成概率
        if (Math.random() > 0.7) { // 30%的概率不生成道具
            return null;
        }
        
        // 根据关卡和触发类型调整道具稀有度权重
        let rarityWeights = [50, 30, 15, 4, 1]; // 默认权重
        
        if (level > 5) {
            // 调整权重以适应更高关卡
            rarityWeights = [30, 35, 20, 10, 5];
        }
        
        if (level > 10) {
            rarityWeights = [20, 25, 30, 15, 10];
        }
        
        // 特定触发类型可能给予特殊道具
        if (triggerType === 'optimality') {
            // 以最优解移动时增加获得洞察之眼的几率
            rarityWeights[3] += 10;
            rarityWeights[4] += 5;
        }
        
        if (triggerType === 'speed') {
            // 快速移动时增加获得时间宝石的几率
            rarityWeights[0] += 15;
        }
        
        if (triggerType === 'balance') {
            // 所有塔都有圆盘时增加获得传送石的几率
            rarityWeights[2] += 15;
        }
        
        // 根据权重选择稀有度
        const totalWeight = rarityWeights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let selectedRarity = 1;
        
        for (let i = 0; i < rarityWeights.length; i++) {
            if (random < rarityWeights[i]) {
                selectedRarity = i + 1;
                break;
            }
            random -= rarityWeights[i];
        }
        
        // 从道具池中筛选匹配稀有度的道具
        const possibleItems = this.itemPool.filter(item => item.rarity === selectedRarity);
        if (possibleItems.length === 0) return null;
        
        // 随机选择一个道具
        return JSON.parse(JSON.stringify(possibleItems[Math.floor(Math.random() * possibleItems.length)]));
    }

    // 添加道具到玩家背包
    addItem(item) {
        if (!item) return;
        
        // 检查是否已有同类道具
        const existingItemIndex = this.items.findIndex(i => i.type === item.type);
        
        if (existingItemIndex >= 0) {
            // 已有同类道具，增加数量
            this.items[existingItemIndex].count++;
        } else {
            // 没有同类道具，添加新道具
            this.items.push(item);
        }
        
        this.showItemNotification(item);
        this.updateItemsDisplay();
    }

    // 使用道具
    useItem(index) {
        if (index < 0 || index >= this.items.length) return;
        
        const item = this.items[index];
        
        // 获取道具效果函数
        const effectFunction = this.getItemEffect(item);
        
        // 使用道具效果
        if (effectFunction) {
            effectFunction();
            playSound('item');
            
            // 减少道具数量
            item.count--;
            
            // 如果道具数量为0，从背包中移除
            if (item.count <= 0) {
                this.items.splice(index, 1);
            }
            
            this.updateItemsDisplay();
            return true;
        }
        
        return false;
    }

    // 获取道具效果实现
    getItemEffect(item) {
        // 找到与该道具类型匹配的原始道具定义
        const originalItem = this.itemPool.find(poolItem => poolItem.type === item.type);
        return originalItem ? originalItem.effect : null;
    }

    // 更新道具栏显示 - 完全重写以支持道具合并和数量显示
    updateItemsDisplay() {
        // 清空当前显示
        this.itemsList.innerHTML = '';
        
        if (this.items.length === 0) {
            const emptyText = document.createElement('p');
            emptyText.textContent = '无道具';
            emptyText.className = 'empty-items';
            this.itemsList.appendChild(emptyText);
            return;
        }
        
        // 为每个道具创建显示元素
        this.items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            
            // 创建道具图标
            const iconElement = document.createElement('div');
            iconElement.className = 'item-icon';
            iconElement.style.backgroundImage = `url(${item.icon})`;
            
            // 创建道具数量标记
            if (item.count > 1) {
                const countBadge = document.createElement('div');
                countBadge.className = 'item-count';
                countBadge.textContent = item.count;
                itemElement.appendChild(countBadge);
            }
            
            // 创建提示框
            const tooltip = document.createElement('div');
            tooltip.className = 'item-tooltip';
            tooltip.innerHTML = `<strong>${item.name}</strong><br>${item.description}`;
            if (item.count > 1) {
                tooltip.innerHTML += `<br>拥有: ${item.count}个`;
            }
            
            itemElement.appendChild(iconElement);
            itemElement.appendChild(tooltip);
            
            // 添加点击事件
            itemElement.addEventListener('click', () => {
                this.useItem(index);
            });
            
            this.itemsList.appendChild(itemElement);
        });
    }

    // 显示获得道具的通知
    showItemNotification(item) {
        document.getElementById('item-icon').style.backgroundImage = `url(${item.icon})`;
        document.getElementById('item-name').textContent = item.name;
        document.getElementById('item-description').textContent = item.description;
        
        this.notification.classList.remove('hidden');
        
        // 5秒后自动隐藏通知
        setTimeout(() => {
            this.hideItemNotification();
        }, 5000);
        
        playSound('item_found');
    }

    // 隐藏道具通知
    hideItemNotification() {
        this.notification.classList.add('hidden');
    }

    // 生成关卡奖励
    generateLevelRewards(level, performance) {
        const rewards = [];
        
        // 根据关卡和表现决定奖励数量和质量
        let rewardCount = 1; // 默认至少1个奖励
        
        if (performance > 0.85) { // 提高获得额外道具的门槛
            rewardCount++; // 优秀表现增加奖励
        }
        
        if (level % 5 === 0) {
            rewardCount++; // 每5关额外奖励
        }
        
        // 生成奖励
        for (let i = 0; i < rewardCount; i++) {
            const triggerType = i === 0 ? 'level_reward' : 'performance_reward';
            const reward = this.generateItem(level, triggerType);
            if (reward) {
                rewards.push(reward);
            }
        }
        
        return rewards;
    }

    // 重置系统
    reset() {
        this.items = [];
        this.activeEffects = {
            doubleScore: false
        };
        this.updateItemsDisplay();
    }
}