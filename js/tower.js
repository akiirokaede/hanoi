/**
 * 汉诺塔塔座类
 * 处理塔和圆盘的逻辑
 */
class Tower {
    constructor(id, totalTowers = 3, specialConfig = {}) {
        this.id = id;
        // 需要动态创建塔座元素
        this.element = document.createElement('div');
        this.element.id = `tower-${id}`;
        this.element.className = 'tower';
        
        // 创建柱子
        this.pole = document.createElement('div');
        this.pole.className = 'pole';
        
        // 根据柱子总数调整柱子宽度
        const poleWidthPercent = Math.max(8, 14 - (totalTowers - 3) * 1.5); // 从14%开始，每多一个柱子减少1.5%，下限为8%
        this.pole.style.width = `${poleWidthPercent}%`;
        
        // 应用迷你塔效果
        if (specialConfig.towerHeightMultiplier) {
            this.pole.style.height = `${specialConfig.towerHeightMultiplier * 100}%`;
        }
        
        this.element.appendChild(this.pole);
        
        // 创建基座
        this.base = document.createElement('div');
        this.base.className = 'base';
        
        // 根据柱子总数调整基座宽度
        const baseWidthPercent = Math.max(60, 80 - (totalTowers - 3) * 5); // 从80%开始，每多一个柱子减少5%，下限为60%
        this.base.style.width = `${baseWidthPercent}%`;
        
        this.element.appendChild(this.base);
        
        this.discs = [];
        
        // 如果是双目标，为目标塔添加特殊标记
        if (specialConfig.dualTargets && (id === totalTowers || id === totalTowers - 1)) {
            const marker = document.createElement('div');
            marker.className = 'target-marker';
            marker.textContent = '目标';
            marker.style.position = 'absolute';
            marker.style.bottom = '-25px';
            marker.style.left = '50%';
            marker.style.transform = 'translateX(-50%)';
            marker.style.color = '#e74c3c';
            marker.style.fontWeight = 'bold';
            marker.style.fontSize = '14px';
            this.element.appendChild(marker);
        }
        
        // 如果是宝藏关卡，为基座添加特殊样式
        if (specialConfig.treasureLevel) {
            this.base.classList.add('treasure');
            // 添加金色闪光效果
            const shimmer = document.createElement('div');
            shimmer.className = 'shimmer';
            // 确保shimmer元素与base元素尺寸一致
            shimmer.style.position = 'absolute';
            shimmer.style.top = '0';
            shimmer.style.left = '0';
            shimmer.style.width = '100%';
            shimmer.style.height = '100%';
            this.base.appendChild(shimmer);
        }
    }

    // 添加圆盘到塔座上
    addDisc(disc) {
        // 只有当这个圆盘比塔顶的小或者塔是空的时候才能添加
        if (this.discs.length === 0 || disc.size < this.discs[this.discs.length - 1].size) {
            // 计算圆盘在塔上的位置
            const position = this.discs.length;
            this.discs.push(disc);
            this.element.appendChild(disc.element);
            disc.setPosition(position, this.element.offsetHeight);
            return true;
        }
        return false;
    }

    // 强制添加圆盘（用于道具效果）
    forceAddDisc(disc) {
        const position = this.discs.length;
        this.discs.push(disc);
        this.element.appendChild(disc.element);
        disc.setPosition(position, this.element.offsetHeight);
        return true;
    }

    // 从塔座移除顶部圆盘
    removeTopDisc() {
        if (this.discs.length > 0) {
            const disc = this.discs.pop();
            if (disc.element.parentNode === this.element) {
                this.element.removeChild(disc.element);
            }
            return disc;
        }
        return null;
    }

    // 获取顶部圆盘
    getTopDisc() {
        return this.discs.length > 0 ? this.discs[this.discs.length - 1] : null;
    }

    // 检查塔是否为空
    isEmpty() {
        return this.discs.length === 0;
    }

    // 获取塔上圆盘数量
    getDiscCount() {
        return this.discs.length;
    }

    // 高亮显示塔座
    highlight() {
        this.element.classList.add('selected');
    }

    // 取消高亮显示
    unhighlight() {
        this.element.classList.remove('selected');
    }

    // 添加提示动画
    addHint() {
        this.element.classList.add('hint');
    }

    // 移除提示动画
    removeHint() {
        this.element.classList.remove('hint');
    }
}

/**
 * 圆盘类
 */
class Disc {
    constructor(size, totalDiscs, towerCount = 3, specialConfig = {}) {
        this.size = size;
        this.element = document.createElement('div');
        this.element.className = 'disc';
        
        // 根据塔数量动态调整圆盘宽度基础值
        // 塔越多，圆盘基础宽度越小
        const baseWidthPercentage = Math.max(20, 40 - (towerCount - 3) * 5); // 从40%开始，每多一个塔减少5%
        
        // 应用特大圆盘效果
        let sizeMultiplier = 1;
        if (specialConfig.specialDisc && size === totalDiscs) {
            sizeMultiplier = specialConfig.discSizeMultiplier || 1.2;
            this.element.classList.add('special-disc'); // 添加特殊圆盘类以应用视觉效果
            
            // 创建光环效果
            const aura = document.createElement('div');
            aura.className = 'disc-aura';
            this.element.appendChild(aura);
        }
        
        // 设置圆盘宽度 - 保持原有的彩虹效果
        const widthPercentage = (baseWidthPercentage + (size / totalDiscs) * 40) * sizeMultiplier; // 圆盘宽度范围根据塔数量调整
        this.element.style.width = `${widthPercentage}%`;
        
        // 动态计算圆盘高度 - 根据圆盘总数调整
        // 随着圆盘数量增加，单个圆盘高度减小，以适应柱体
        const MAX_DISC_HEIGHT = 40; // 最大圆盘高度(px)
        const MIN_DISC_HEIGHT = 15; // 最小圆盘高度(px)
        const heightRange = MAX_DISC_HEIGHT - MIN_DISC_HEIGHT;
        
        // 使用非线性公式计算高度：圆盘越多，高度越小
        let discHeight;
        if (totalDiscs <= 3) {
            discHeight = MAX_DISC_HEIGHT; // 少量圆盘时使用最大高度
        } else if (totalDiscs <= 7) {
            // 3-7个圆盘线性减少高度
            discHeight = MAX_DISC_HEIGHT - ((totalDiscs - 3) / 4) * heightRange * 0.7;
        } else {
            // 高级关卡，更小的圆盘高度
            discHeight = MIN_DISC_HEIGHT + (heightRange * 0.3 / (1 + 0.2 * (totalDiscs - 7)));
        }
        
        // 应用特大圆盘效果到高度
        if (specialConfig.specialDisc && size === totalDiscs) {
            discHeight *= sizeMultiplier;
        }
        
        this.height = Math.round(discHeight); // 保存高度值以供后续使用
        this.element.style.height = `${this.height}px`;
        this.element.style.borderRadius = `${this.height / 2}px`; // 保持圆润的边缘
        
        // 使用HSL颜色模型创建彩虹渐变效果
        const hue = (size / totalDiscs) * 360;
        this.element.style.backgroundColor = `hsl(${hue}, 80%, 60%)`;
        
        // 添加阴影效果
        this.element.style.boxShadow = `0 3px 6px rgba(0, 0, 0, 0.3), 0 3px 6px rgba(0, 0, 0, 0.3)`;
        
        // 当圆盘较小时显示圆盘大小，以便玩家区分
        if (totalDiscs > 7) {
            this.element.style.fontSize = '10px';
            this.element.textContent = size;
        }
        
        // 应用隐形圆盘效果
        if (specialConfig.invisibleDiscs && Math.random() < 0.4) { // 40%的圆盘会变成半透明
            this.element.classList.add('invisible-disc');
            this.isInvisible = true;
        }
        
        // 为诅咒效果准备数据属性
        this.element.dataset.discSize = size;
        this.element.dataset.totalDiscs = totalDiscs;
    }

    // 设置圆盘位置 - 考虑动态高度
    setPosition(position, towerHeight) {
        // 使用圆盘自身高度进行计算
        const DISC_MARGIN = 2;  // 圆盘之间的间距
        
        // 计算圆盘到塔底部的距离
        const bottomOffset = 30; // 距离底座顶部的固定偏移量
        
        // 计算当前圆盘下方所有圆盘的总高度
        let totalStackHeight = 0;
        for (let i = 0; i < position; i++) {
            // 假设我们没有直接访问下方圆盘的高度信息
            // 对于同一关卡，大致可以假设每个圆盘高度相似
            totalStackHeight += this.height + DISC_MARGIN;
        }
        
        const finalBottom = bottomOffset + totalStackHeight;
        
        // 设置圆盘绝对定位
        this.element.style.position = 'absolute';
        this.element.style.bottom = `${finalBottom}px`; // 从底部算起的距离
        this.element.style.left = '50%'; // 水平居中
        this.element.style.transform = 'translateX(-50%)'; // 使用单引号而不是反引号
    }
    
    // 应用晕眩诅咒效果
    applyDizziness() {
        this.element.classList.add('dizzy');
    }
    
    // 移除晕眩诅咒效果
    removeDizziness() {
        this.element.classList.remove('dizzy');
    }
    
    // 临时闪烁隐形圆盘（使其可见一小段时间）
    temporaryReveal() {
        if (this.isInvisible) {
            this.element.style.opacity = '0.8'; // 暂时提高不透明度
            
            // 添加额外的视觉效果
            this.element.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.8)';
            
            // 2秒后恢复
            setTimeout(() => {
                this.element.style.opacity = '0.3';
                this.element.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.3), 0 3px 6px rgba(0, 0, 0, 0.3)';
            }, 2000);
        }
    }
}

/**
 * 汉诺塔游戏管理类
 */
class TowerGame {
    constructor() {
        this.towers = [];
        this.selectedTower = null;
        this.moveCount = 0;
        this.discs = [];
        this.discCount = 0;
        this.movesGoal = 0;
        this.optimalMoves = 0;
        this.gameStarted = false;
        this.levelCompleted = false;
        this.targetTower = 0; // 目标塔的索引，默认是最后一个塔
        
        // 不再在构造函数中初始化塔座，改为在setLevel方法中动态创建
    }

    // 添加塔座点击事件
    addTowerEventListeners() {
        for (const tower of this.towers) {
            tower.element.addEventListener('click', () => {
                if (!this.gameStarted || this.levelCompleted) return;
                
                // 如果没有选中塔座，选择当前点击的塔座
                if (this.selectedTower === null) {
                    // 只有当塔座有圆盘时才能选择
                    if (!tower.isEmpty()) {
                        tower.highlight();
                        this.selectedTower = tower;
                        playSound('select');
                    }
                } else {
                    // 如果点击的是已选中的塔座，取消选择
                    if (this.selectedTower === tower) {
                        tower.unhighlight();
                        this.selectedTower = null;
                        playSound('deselect');
                    } else {
                        // 尝试将圆盘从选中塔座移动到当前点击的塔座
                        this.moveDisc(this.selectedTower, tower);
                    }
                }
            });
        }
    }

    // 设置当前关卡
    setLevel(discCount, movesGoal, towerCount = 3, specialConfig = {}) {
        // 日志调试: 验证传入的圆盘数量是否正确
        console.log(`TowerGame.setLevel 被调用 - 圆盘数量: ${discCount}, 移动目标: ${movesGoal}, 塔数: ${towerCount}`);
        
        // 调试教学关卡配置
        if (specialConfig && specialConfig.isTutorial) {
            console.log(`初始化教学关卡: 关卡 ${specialConfig.level}, 圆盘 ${discCount}`);
            console.log(`教学关卡完整配置:`, specialConfig);
        }
        
        this.reset();
        this.discCount = discCount;
        this.movesGoal = movesGoal;
        this.specialConfig = specialConfig || {}; // 存储特殊事件配置
        
        // 保存关卡的目标配置
        this.levelGoals = {
            discCount,
            movesGoal,
            towerCount
        };
        
        // 动态创建塔座，并传入特殊配置
        this.createTowers(towerCount, specialConfig);
        
        // 计算最优移动次数
        this.optimalMoves = towerCount === 3 ? 
            Math.pow(2, discCount) - 1 : 
            Math.floor((Math.pow(2, discCount) - 1) * 0.8);
        
        // 创建圆盘，并传入 towerCount 和特殊配置参数
        for (let i = discCount; i >= 1; i--) {
            const disc = new Disc(i, discCount, towerCount, specialConfig);
            this.discs.push(disc);
            this.towers[0].addDisc(disc); // 所有圆盘初始放在第一个塔座
        }
        
        // 设置目标塔 - 通常是最后一个塔，除非有特殊配置
        if (specialConfig.dualTargets) {
            // 双目标情况：可以选择最后两个塔中的任何一个作为目标
            this.targetTowers = [towerCount - 2, towerCount - 1];
            this.targetTower = this.targetTowers[1]; // 默认使用最后一个塔作为主要目标
        } else {
            this.targetTower = towerCount - 1;
            this.targetTowers = [this.targetTower];
        }
        
        // 应用特殊布局（如果有）
        if (specialConfig.specialLayout) {
            this.applySpecialLayout(specialConfig);
        }
        
        // 如果是宝藏关卡，添加视觉效果
        if (specialConfig.treasureLevel) {
            document.getElementById('game-screen').classList.add('treasure-level');
            
            // 显示宝藏关卡提示
            const message = document.getElementById('message');
            message.textContent = '宝藏关卡！完成可获得额外奖励！';
            message.classList.add('treasure-message');
            setTimeout(() => {
                message.classList.remove('treasure-message');
                setTimeout(() => message.textContent = '', 1000);
            }, 3000);
        }
        
        // 应用诅咒效果
        if (specialConfig.variation && specialConfig.variation.curses && specialConfig.variation.curses.length > 0) {
            this.applyCurses(specialConfig.variation.curses);
        }
        
        // 应用祝福效果
        if (specialConfig.variation && specialConfig.variation.blessings && specialConfig.variation.blessings.length > 0) {
            this.applyBlessings(specialConfig.variation.blessings);
        }
        
        this.gameStarted = true;
        this.levelCompleted = false;
        
        // 日志调试: 确认塔和圆盘创建完成
        console.log(`关卡设置完成 - 创建了 ${this.discs.length} 个圆盘，塔数: ${this.towers.length}`);
    }

    // 动态创建塔座 - 更新方法
    createTowers(towerCount, specialConfig = {}) {
        // 获取塔座容器
        const container = document.getElementById('towers-container');
        
        // 清空之前的塔座
        container.innerHTML = '';
        this.towers = [];
        
        // 应用特殊布局
        let layout = 'standard'; // 标准布局
        if (specialConfig.specialLayout) {
            // 可以根据不同关卡设置不同布局
            // 例如：圆形布局、三角形布局等
            layout = specialConfig.layoutType || 'circular';
        }
        
        // 创建新的塔座
        for (let i = 1; i <= towerCount; i++) {
            const tower = new Tower(i, towerCount, specialConfig);
            this.towers.push(tower);
            container.appendChild(tower.element);
            
            // 应用布局样式
            if (layout === 'circular' && towerCount > 3) {
                const angle = ((i - 1) / towerCount) * 2 * Math.PI;
                const radius = 35; // 圆形布局的半径（百分比）
                const centerX = 50;
                const centerY = 50;
                
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                
                tower.element.style.position = 'absolute';
                tower.element.style.left = `${x}%`;
                tower.element.style.top = `${y}%`;
                tower.element.style.transform = 'translate(-50%, -50%)';
            }
        }
        
        // 为新塔座添加点击事件
        this.addTowerEventListeners();
        
        // 调整塔座宽度以适应不同数量
        if (layout === 'standard') {
            const towerWidth = `${Math.min(25, 90 / towerCount)}%`;
            document.querySelectorAll('.tower').forEach(tower => {
                tower.style.width = towerWidth;
            });
        }
    }

    // 应用特殊布局
    applySpecialLayout(config) {
        // 现有代码...
        
        // 新增：处理前三关的特殊事件
        if (config.colorEnhancement) {
            // 增强圆盘颜色对比度
            for (const disc of this.discs) {
                disc.enhanceColor();
            }
            console.log("应用颜色强化效果");
        }
        
        if (config.initialHints && config.initialHints > 0) {
            // 设置初始提示次数
            this.availableHints = config.initialHints;
            this.showHintMessage();
            console.log(`设置初始提示次数: ${config.initialHints}`);
        }
    }
    
    // 显示提示信息
    showHintMessage() {
        if (this.availableHints > 0) {
            const message = document.getElementById('message');
            message.textContent = `可用提示: ${this.availableHints} (点击"提示"按钮)`;
            message.classList.add('hint-message');
            setTimeout(() => {
                message.classList.remove('hint-message');
                setTimeout(() => {
                    if (message.textContent.includes('可用提示')) {
                        message.textContent = '';
                    }
                }, 1000);
            }, 3000);
            
            // 如果没有提示按钮，创建一个
            if (!document.getElementById('hint-button')) {
                const hintButton = document.createElement('button');
                hintButton.id = 'hint-button';
                hintButton.className = 'game-button';
                hintButton.textContent = '提示';
                hintButton.onclick = () => this.showHint();
                
                const controlsDiv = document.querySelector('.game-controls');
                if (controlsDiv) {
                    controlsDiv.appendChild(hintButton);
                }
            }
        }
    }
    
    // 显示提示
    showHint() {
        if (this.availableHints <= 0) {
            const message = document.getElementById('message');
            message.textContent = '没有可用的提示了!';
            message.classList.add('error-message');
            setTimeout(() => {
                message.classList.remove('error-message');
                setTimeout(() => message.textContent = '', 1000);
            }, 2000);
            return;
        }
        
        this.availableHints--;
        
        // 计算最优解的下一步移动
        const hint = this.calculateOptimalNextMove();
        if (hint) {
            const {fromTower, toTower} = hint;
            
            // 高亮显示提示的塔座
            this.towers[fromTower].highlightTower();
            this.towers[toTower].highlightTower('target');
            
            const message = document.getElementById('message');
            message.textContent = `提示: 将圆盘从塔${fromTower + 1}移动到塔${toTower + 1}`;
            message.classList.add('hint-message');
            
            // 更新提示按钮文本
            const hintButton = document.getElementById('hint-button');
            if (hintButton) {
                hintButton.textContent = `提示 (${this.availableHints})`;
            }
            
            // 3秒后取消高亮和消息
            setTimeout(() => {
                this.towers[fromTower].unhighlightTower();
                this.towers[toTower].unhighlightTower();
                message.classList.remove('hint-message');
                setTimeout(() => {
                    if (message.textContent.includes('提示:')) {
                        message.textContent = '';
                    }
                }, 1000);
            }, 3000);
        }
    }
    
    // 计算最优解的下一步移动
    calculateOptimalNextMove() {
        // 这是一个简化版的计算，实际最优解需要实现汉诺塔算法
        // 找出可移动的最小圆盘
        let fromTower = -1;
        let smallestDisc = null;
        
        // 找到最小圆盘所在的塔
        for (let i = 0; i < this.towers.length; i++) {
            const topDisc = this.towers[i].getTopDisc();
            if (topDisc) {
                if (!smallestDisc || topDisc.size < smallestDisc.size) {
                    smallestDisc = topDisc;
                    fromTower = i;
                }
            }
        }
        
        if (fromTower === -1 || !smallestDisc) return null;
        
        // 确定目标塔 - 简单策略：
        // 如果是偶数圆盘，尝试向右移动；如果是奇数，尝试向左移动
        // 这不是完美的汉诺塔解法，但对于提示已足够
        let toTower;
        if (this.discCount % 2 === 0) {
            // 尝试向右移动（或环绕到第一个塔）
            toTower = (fromTower + 1) % this.towers.length;
            // 如果右边塔不能放置，尝试另一个方向
            if (!this.towers[toTower].canPlaceDisc(smallestDisc)) {
                toTower = (fromTower + this.towers.length - 1) % this.towers.length;
            }
        } else {
            // 尝试向左移动（或环绕到最后一个塔）
            toTower = (fromTower + this.towers.length - 1) % this.towers.length;
            // 如果左边塔不能放置，尝试另一个方向
            if (!this.towers[toTower].canPlaceDisc(smallestDisc)) {
                toTower = (fromTower + 1) % this.towers.length;
            }
        }
        
        // 检查目标塔是否可以放置该圆盘
        if (this.towers[toTower].canPlaceDisc(smallestDisc)) {
            return { fromTower, toTower };
        }
        
        // 如果以上策略都不可行，找出任何可以放置的塔
        for (let i = 0; i < this.towers.length; i++) {
            if (i !== fromTower && this.towers[i].canPlaceDisc(smallestDisc)) {
                return { fromTower, toTower: i };
            }
        }
        
        return null; // 无法找到合法移动
    }

    // 移动圆盘
    moveDisc(fromTower, toTower) {
        const disc = fromTower.getTopDisc();
        if (disc) {
            if (toTower.isEmpty() || disc.size < toTower.getTopDisc().size) {
                const movedDisc = fromTower.removeTopDisc();
                
                // 创建自然掉落动画，首先将圆盘移动到目标塔的顶部
                // 然后通过动画让它落到正确的位置
                this.animateDiscMove(movedDisc, toTower);
                
                fromTower.unhighlight();
                this.selectedTower = null;
                
            } else {
                playSound('error');
                document.getElementById('message').textContent = '不能将大圆盘放在小圆盘上！';
                setTimeout(() => {
                    document.getElementById('message').textContent = '';
                }, 2000);
            }
        }
    }
    
    // 添加自然掉落动画
    animateDiscMove(disc, toTower) {
        // 创建一条虚拟移动路径 - 增强视觉效果
        this.createMovePath(disc, toTower);
        
        // 添加移动标记类
        disc.element.classList.add('moving');
        
        // 首先将圆盘添加到目标塔
        toTower.element.appendChild(disc.element);
        
        // 将圆盘定位在塔的顶部上方
        disc.element.style.transition = 'none'; // 暂时关闭过渡动画
        disc.element.style.bottom = `${toTower.element.offsetHeight - 30}px`; // 塔的顶部位置
        
        // 触发重绘，确保圆盘先显示在顶部
        void disc.element.offsetWidth;
        
        // 开始掉落动画 - 使用更优美的曲线效果
        disc.element.style.transition = 'bottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'; // 弹跳效果
        
        // 计算圆盘最终位置
        const position = toTower.discs.length; // 圆盘将落在塔上现有圆盘之上
        toTower.discs.push(disc);
        
        // 正确设置圆盘的最终位置
        // 使用实际圆盘的高度和自定义间距
        const DISC_MARGIN = 2;
        const bottomOffset = 30; // 距离底座顶部的固定偏移量
        
        // 计算当前圆盘下方所有圆盘的总高度
        let totalStackHeight = 0;
        for (let i = 0; i < position; i++) {
            // 使用前面圆盘的实际高度，如果能获取
            if (toTower.discs[i] && toTower.discs[i].height) {
                totalStackHeight += toTower.discs[i].height + DISC_MARGIN;
            } else {
                // 后备方案，使用当前圆盘高度作为估计
                totalStackHeight += disc.height + DISC_MARGIN;
            }
        }
        
        const finalBottom = bottomOffset + totalStackHeight;
        
        // 启动动画，将圆盘移动到最终位置
        disc.element.style.bottom = `${finalBottom}px`;
        
        // 播放声音
        playSound('move');
        
        // 更新移动次数和游戏状态
        this.moveCount++;
        this.updateMoves();
        
        // 延迟检查游戏完成状态，等待动画结束
        setTimeout(() => {
            // 添加着陆动画效果
            disc.element.classList.remove('moving');
            disc.element.classList.add('landing');
            
            // 检查是否完成关卡
            this.checkCompletion();
            
            // 检查是否触发道具
            this.checkItemTrigger();
            
            // 移除着陆效果类
            setTimeout(() => {
                disc.element.classList.remove('landing');
            }, 500);
        }, 500); // 与动画时长匹配
    }
    
    // 创建圆盘移动路径可视化
    createMovePath(disc, toTower) {
        // 创建移动路径元素
        const path = document.createElement('div');
        path.className = 'disc-path';
        
        // 获取起始点和终点位置
        const discRect = disc.element.getBoundingClientRect();
        const towerRect = toTower.element.getBoundingClientRect();
        const gameAreaRect = document.querySelector('.game-area').getBoundingClientRect();
        
        // 计算路径宽度和位置
        const startX = discRect.left + discRect.width / 2 - gameAreaRect.left;
        const endX = towerRect.left + towerRect.width / 2 - gameAreaRect.left;
        const width = Math.abs(endX - startX);
        const left = Math.min(startX, endX);
        const top = discRect.top - gameAreaRect.top - 20;
        
        // 设置路径样式
        path.style.width = `${width}px`;
        path.style.left = `${left}px`;
        path.style.top = `${top}px`;
        
        // 添加路径到DOM
        document.querySelector('.game-area').appendChild(path);
        
        // 使路径可见，然后淡出
        setTimeout(() => {
            path.style.opacity = '1';
            
            setTimeout(() => {
                path.style.opacity = '0';
                
                // 最终移除路径元素
                setTimeout(() => {
                    if (path.parentNode) {
                        path.parentNode.removeChild(path);
                    }
                }, 300);
            }, 200);
        }, 10);
    }

    // 使用传送石道具 - 允许一次违反规则的移动
    useTeleportItem(fromTower, toTower) {
        const disc = fromTower.getTopDisc();
        if (disc) {
            const movedDisc = fromTower.removeTopDisc();
            
            // 使用动画效果
            toTower.element.appendChild(movedDisc.element);
            
            // 为传送石添加特殊动画效果
            movedDisc.element.classList.add('teleporting');
            
            // 计算最终位置
            const position = toTower.discs.length;
            toTower.discs.push(movedDisc);
            
            // 使用和圆盘类相同的位置计算逻辑
            const DISC_MARGIN = 2;
            const bottomOffset = 30;
            
            // 计算总高度
            let totalStackHeight = 0;
            for (let i = 0; i < position; i++) {
                if (toTower.discs[i] && toTower.discs[i].height) {
                    totalStackHeight += toTower.discs[i].height + DISC_MARGIN;
                } else {
                    totalStackHeight += movedDisc.height + DISC_MARGIN;
                }
            }
            
            const finalBottom = bottomOffset + totalStackHeight;
            
            // 播放声音
            playSound('teleport');
            
            // 添加粒子效果
            this.createTeleportParticles(movedDisc.element);
            
            // 等待动画完成
            setTimeout(() => {
                // 设置最终位置并移除动画类
                movedDisc.element.style.bottom = `${finalBottom}px`;
                movedDisc.element.classList.remove('teleporting');
                
                this.moveCount++;
                this.updateMoves();
                
                fromTower.unhighlight();
                this.selectedTower = null;
                
                // 检查是否完成关卡
                this.checkCompletion();
            }, 800);
        }
    }
    
    // 创建传送粒子效果
    createTeleportParticles(element) {
        const rect = element.getBoundingClientRect();
        const gameArea = document.querySelector('.game-area');
        
        // 创建10个粒子
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            
            // 设置粒子样式
            particle.style.position = 'absolute';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.borderRadius = '50%';
            particle.style.backgroundColor = `hsl(${Math.random() * 60 + 120}, 100%, 60%)`;
            particle.style.zIndex = '10';
            
            // 设置初始位置为圆盘中心
            const centerX = rect.left + rect.width / 2 - gameArea.getBoundingClientRect().left;
            const centerY = rect.top + rect.height / 2 - gameArea.getBoundingClientRect().top;
            
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            
            // 添加到游戏区域
            gameArea.appendChild(particle);
            
            // 设置随机方向的动画
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 50 + 20;
            const destinationX = centerX + Math.cos(angle) * distance;
            const destinationY = centerY + Math.sin(angle) * distance;
            
            // 应用动画
            particle.style.transition = 'all 0.8s ease-out';
            setTimeout(() => {
                particle.style.left = `${destinationX}px`;
                particle.style.top = `${destinationY}px`;
                particle.style.opacity = '0';
                
                // 动画结束后移除粒子
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 800);
            }, 10);
        }
    }

    // 更新移动次数显示
    updateMoves() {
        document.getElementById('moves-count').textContent = this.moveCount;
    }

    // 重写检查关卡是否完成方法以支持双目标
    checkCompletion() {
        // 如果有多个目标塔（双目标）
        if (this.targetTowers && this.targetTowers.length > 1) {
            // 检查任意一个目标塔是否包含全部圆盘
            const completed = this.targetTowers.some(targetIndex => 
                this.towers[targetIndex].getDiscCount() === this.discCount);
                
            if (completed) {
                this.levelCompleted = true;
                this.gameStarted = false;
                
                playSound('complete');
                document.getElementById('message').textContent = '恭喜！关卡完成！';
                
                // 触发关卡完成事件
                const event = new CustomEvent('levelCompleted', {
                    detail: {
                        moveCount: this.moveCount,
                        movesGoal: this.movesGoal,
                        optimalMoves: this.optimalMoves
                    }
                });
                document.dispatchEvent(event);
            }
        } else {
            // 标准单一目标塔检查
            if (this.towers[this.targetTower].getDiscCount() === this.discCount) {
                this.levelCompleted = true;
                this.gameStarted = false;
                
                playSound('complete');
                document.getElementById('message').textContent = '恭喜！关卡完成！';
                
                // 触发关卡完成事件
                const event = new CustomEvent('levelCompleted', {
                    detail: {
                        moveCount: this.moveCount,
                        movesGoal: this.movesGoal,
                        optimalMoves: this.optimalMoves
                    }
                });
                document.dispatchEvent(event);
            }
        }
    }

    // 修改检查道具触发方法以支持幸运祝福
    checkItemTrigger() {
        // 降低道具触发频率
        let BASE_CHANCE = 15; // 基础触发几率为15%
        
        // 应用幸运祝福效果（如果有）
        if (this.itemChanceBonus) {
            BASE_CHANCE += this.itemChanceBonus * 100; // 将小数转换为百分比加成
        }
        
        // 1. 如果玩家接近最优解，有几率获得道具
        if (this.moveCount === Math.floor(this.optimalMoves * 0.7) && chance(BASE_CHANCE)) {
            this.triggerItemSpawn('optimality');
        }
        
        // 2. 玩家在特定塔座配置时获得道具
        const allTowersHaveDiscs = this.towers.every(tower => !tower.isEmpty());
        if (allTowersHaveDiscs && chance(BASE_CHANCE)) {
            this.triggerItemSpawn('balance');
        }
        
        // 3. 关卡首次移动时，有小几率获得"新手幸运"道具
        if (this.moveCount === 5 && chance(BASE_CHANCE)) {
            this.triggerItemSpawn('beginner_luck');
        }
        
        // 时间祝福效果：每次移动增加1秒
        if (this.hasBlessingTimeBonus) {
            // 触发时间增加事件
            const timeEvent = new CustomEvent('timeBlessing', {
                detail: { bonusSeconds: 1 }
            });
            document.dispatchEvent(timeEvent);
        }
    }

    // 触发道具生成
    triggerItemSpawn(triggerType) {
        const event = new CustomEvent('itemSpawned', {
            detail: { triggerType, level: this.discCount }
        });
        document.dispatchEvent(event);
    }

    // 重置游戏
    reset() {
        // 清空所有塔座
        for (const tower of this.towers) {
            while (tower && !tower.isEmpty()) {
                tower.removeTopDisc();
            }
            if (tower) tower.unhighlight();
        }
        
        // 重置状态
        this.discs = [];
        this.selectedTower = null;
        this.moveCount = 0;
        this.updateMoves();
        document.getElementById('message').textContent = '';
        this.gameStarted = false;
        this.levelCompleted = false;
    }
    
    // 自动求解 (供洞察之眼道具使用)
    showHint() {
        const hintMove = this.getNextOptimalMove();
        if (hintMove) {
            this.towers[hintMove.from].addHint();
            setTimeout(() => {
                this.towers[hintMove.from].removeHint();
                if (this.gameStarted && !this.levelCompleted) {
                    this.towers[hintMove.to].addHint();
                    setTimeout(() => {
                        this.towers[hintMove.to].removeHint();
                    }, 1000);
                }
            }, 1000);
        }
    }
    
    // 计算最优下一步移动
    getNextOptimalMove() {
        const towerCount = this.towers.length;
        
        // ======= 标准3塔汉诺塔处理（保留原有代码） =======
        if (towerCount === 3) {
            // 如果是游戏开始，提示从第一个塔移动到目标塔或中间塔
            if (this.moveCount === 0) {
                return { from: 0, to: this.discCount % 2 === 0 ? 1 : 2 };
            }
            
            // 寻找可以移动的最小圆盘
            let smallestDiscTower = -1;
            let smallestDiscSize = Infinity;
            
            for (let i = 0; i < this.towers.length; i++) {
                const topDisc = this.towers[i].getTopDisc();
                if (topDisc && topDisc.size < smallestDiscSize) {
                    smallestDiscSize = topDisc.size;
                    smallestDiscTower = i;
                }
            }
            
            if (smallestDiscTower >= 0) {
                // 找到最小圆盘可以移动的塔座
                const parity = this.discCount % 2;
                let targetTower;
                
                if (parity === 0) { // 圆盘数为偶数
                    targetTower = (smallestDiscTower + 1) % 3;
                } else { // 圆盘数为奇数
                    targetTower = (smallestDiscTower + 2) % 3;
                }
                
                // 检查目标塔是否可以放置该圆盘
                const targetTopDisc = this.towers[targetTower].getTopDisc();
                if (!targetTopDisc || smallestDiscSize < targetTopDisc.size) {
                    return { from: smallestDiscTower, to: targetTower };
                } else {
                    // 如果不能放在首选目标塔，尝试第三个塔
                    const thirdTower = 3 - smallestDiscTower - targetTower;
                    const thirdTopDisc = this.towers[thirdTower].getTopDisc();
                    if (!thirdTopDisc || smallestDiscSize < thirdTopDisc.size) {
                        return { from: smallestDiscTower, to: thirdTower };
                    }
                }
            }
        } 
        // ======= 多塔汉诺塔处理（全新实现） =======
        else {
            // 多塔汉诺塔需要进行状态分析，基于Frame-Stewart算法的变体
            
            // 1. 首先分析当前游戏状态
            const gameState = this.analyzeGameState();
            
            // 2. 如果是游戏开始状态，使用Frame-Stewart算法的起始规则
            if (this.moveCount === 0) {
                // 在多塔情况下，最佳策略通常是将除了最大的几个圆盘外的其他圆盘
                // 先移动到中间塔，所以从第一个圆盘开始移动
                return { from: 0, to: 1 };
            }
            
            // 3. 检查是否接近完成状态
            if (gameState.isNearingCompletion) {
                return this.getMoveForCompletionPhase(gameState);
            }
            
            // 4. 尝试使用Frame-Stewart启发式规则
            const frameStewartMove = this.getFrameStewartMove(gameState);
            if (frameStewartMove) {
                return frameStewartMove;
            }
            
            // 5. 后备策略：找到最小圆盘并尝试向目标塔移动
            // 如果无法直接移到目标塔，则寻找任何可行移动
            return this.getFallbackMove(gameState);
        }
        
        return null;
    }
    
    // 分析当前游戏状态
    analyzeGameState() {
        const state = {
            towerStates: [],
            smallestDiscLocation: -1,
            smallestDiscSize: Infinity,
            largestDiscCorrectlyPlaced: false,
            discsOnTargetTower: 0,
            isNearingCompletion: false
        };
        
        // 获取每个塔的状态
        for (let i = 0; i < this.towers.length; i++) {
            const tower = this.towers[i];
            const discs = tower.discs;
            
            // 记录塔的状态
            state.towerStates.push({
                index: i,
                isEmpty: tower.isEmpty(),
                topDiscSize: tower.isEmpty() ? Infinity : tower.getTopDisc().size,
                discCount: discs.length,
                isOrdered: this.isTowerOrdered(tower),
                discs: [...discs]
            });
            
            // 找到最小圆盘位置
            if (!tower.isEmpty() && tower.getTopDisc().size < state.smallestDiscSize) {
                state.smallestDiscSize = tower.getTopDisc().size;
                state.smallestDiscLocation = i;
            }
            
            // 检查目标塔状态
            if (i === this.targetTower) {
                state.discsOnTargetTower = discs.length;
                
                // 检查最大圆盘是否在目标塔底部
                if (discs.length > 0 && discs[0].size === this.discCount) {
                    state.largestDiscCorrectlyPlaced = true;
                }
            }
        }
        
        // 确定是否接近完成状态（超过一半的圆盘已在目标塔上）
        state.isNearingCompletion = (state.discsOnTargetTower > this.discCount / 2) || 
                                  (state.largestDiscCorrectlyPlaced && state.discsOnTargetTower > 1);
        
        return state;
    }
    
    // 检查塔上的圆盘是否有序（从大到小）
    isTowerOrdered(tower) {
        const discs = tower.discs;
        if (discs.length <= 1) return true;
        
        for (let i = 0; i < discs.length - 1; i++) {
            if (discs[i].size < discs[i + 1].size) {
                return false;
            }
        }
        return true;
    }
    
    // 获取接近完成阶段的最佳移动
    getMoveForCompletionPhase(gameState) {
        // 当大部分圆盘已在目标塔时，专注于将剩余圆盘移至目标塔
        
        const targetTowerState = gameState.towerStates[this.targetTower];
        
        // 计算出下一个应该移动到目标塔的圆盘大小
        const nextExpectedSize = this.discCount - targetTowerState.discCount;
        if (nextExpectedSize <= 0) return null;
        
        // 寻找包含下一个要移动圆盘的塔
        for (let i = 0; i < gameState.towerStates.length; i++) {
            if (i === this.targetTower) continue;
            
            const towerState = gameState.towerStates[i];
            if (towerState.isEmpty) continue;
            
            const topDisc = this.towers[i].getTopDisc();
            
            // 如果找到了下一个应该移动的圆盘，且可以直接移动到目标塔
            if (topDisc.size === nextExpectedSize && 
                (targetTowerState.isEmpty || topDisc.size < targetTowerState.topDiscSize)) {
                return { from: i, to: this.targetTower };
            }
        }
        
        // 如果找不到直接移动，尝试整理其他塔以便后续移动
        return this.getPreparatoryMove(gameState, nextExpectedSize);
    }
    
    // 为后续移动做准备的移动
    getPreparatoryMove(gameState, targetSize) {
        // 首先尝试移动阻碍目标圆盘的圆盘
        for (let i = 0; i < gameState.towerStates.length; i++) {
            const towerState = gameState.towerStates[i];
            if (towerState.isEmpty) continue;
            
            // 检查这个塔是否包含目标圆盘但被其他圆盘阻挡
            const hasTargetDisc = towerState.discs.some(disc => disc.size === targetSize);
            if (hasTargetDisc && towerState.topDiscSize !== targetSize) {
                // 找一个可以接收顶部圆盘的塔
                const topDisc = this.towers[i].getTopDisc();
                for (let j = 0; j < gameState.towerStates.length; j++) {
                    if (j === i) continue;
                    if (j === this.targetTower && !gameState.isNearingCompletion) continue; // 避免使用目标塔作为中转
                    
                    const destTowerState = gameState.towerStates[j];
                    if (destTowerState.isEmpty || topDisc.size < destTowerState.topDiscSize) {
                        return { from: i, to: j };
                    }
                }
            }
        }
        
        // 如果没有找到特定的准备移动，使用最小圆盘移动策略
        return this.getMoveForSmallestDisc(gameState);
    }
    
    // 基于Frame-Stewart算法的移动策略
    getFrameStewartMove(gameState) {
        // Frame-Stewart算法的核心思想是将问题分解为更小的子问题
        
        // 1. 如果最大圆盘还没有移动到目标塔，优先为其清理路径
        if (!gameState.largestDiscCorrectlyPlaced) {
            // 检查源塔（通常是第一个塔）是否只剩下最大圆盘
            const sourceTower = this.towers[0];
            if (sourceTower.getDiscCount() === 1 && sourceTower.getTopDisc().size === this.discCount) {
                // 现在可以将最大圆盘直接移动到目标塔
                return { from: 0, to: this.targetTower };
            }
            
            // 如果源塔有多个圆盘，需要先移走上面的小圆盘
            if (sourceTower.getDiscCount() > 1 && sourceTower.discs[0].size === this.discCount) {
                // 移动顶部圆盘到任何可行的中间塔
                const topDisc = sourceTower.getTopDisc();
                for (let i = 1; i < this.towers.length; i++) {
                    if (i === this.targetTower && gameState.towerStates[i].discCount > 0) continue; // 避免阻塞目标塔
                    
                    const tower = this.towers[i];
                    if (tower.isEmpty() || topDisc.size < tower.getTopDisc().size) {
                        return { from: 0, to: i };
                    }
                }
            }
        }
        
        // 2. 对于多塔情况，尝试避免来回移动同一个圆盘
        // 分析最近几步的移动，避免来回移动
        return null; // 如果没有特定的Frame-Stewart移动，返回null以便使用后备策略
    }
    
    // 获取最小圆盘的移动方案
    getMoveForSmallestDisc(gameState) {
        if (gameState.smallestDiscLocation < 0) return null;
        
        const smallestDiscTower = gameState.smallestDiscLocation;
        const smallestDiscSize = gameState.smallestDiscSize;
        
        // 计算移动方向：多塔汉诺塔的策略是使最小圆盘沿特定方向移动
        let direction = 1;
        if (this.discCount % 2 === 0) {
            // 偶数圆盘：最小圆盘顺时针移动
            direction = 1;
        } else {
            // 圆盘数为奇数：最小圆盘逆时针移动
            direction = this.towers.length - 1;
        }
        
        // 计算目标塔索引
        let targetTowerIndex = (smallestDiscTower + direction) % this.towers.length;
        
        // 检查目标塔是否可以接收最小圆盘
        const targetTower = this.towers[targetTowerIndex];
        if (targetTower.isEmpty() || smallestDiscSize < targetTower.getTopDisc().size) {
            return { from: smallestDiscTower, to: targetTowerIndex };
        }
        
        // 如果首选方向不可行，尝试反方向或其他可行塔
        for (let i = 0; i < this.towers.length; i++) {
            if (i !== smallestDiscTower) {
                const tower = this.towers[i];
                if (tower.isEmpty() || smallestDiscSize < tower.getTopDisc().size) {
                    return { from: smallestDiscTower, to: i };
                }
            }
        }
        
        return null;
    }
    
    // 后备移动策略
    getFallbackMove(gameState) {
        // 1. 尝试找到任何可以移动到目标塔的圆盘
        for (let i = 0; i < this.towers.length; i++) {
            if (i === this.targetTower) continue;
            if (gameState.towerStates[i].isEmpty) continue;
            
            const topDisc = this.towers[i].getTopDisc();
            const targetTower = this.towers[this.targetTower];
            
            if (targetTower.isEmpty() || topDisc.size < targetTower.getTopDisc().size) {
                return { from: i, to: this.targetTower };
            }
        }
        
        // 2. 尝试任何合法的移动
        for (let i = 0; i < this.towers.length; i++) {
            if (gameState.towerStates[i].isEmpty) continue;
            
            const topDisc = this.towers[i].getTopDisc();
            
            for (let j = 0; j < this.towers.length; j++) {
                if (j === i) continue;
                
                const destTower = this.towers[j];
                if (destTower.isEmpty() || topDisc.size < destTower.getTopDisc().size) {
                    return { from: i, to: j };
                }
            }
        }
        
        return null; // 如果没有找到合法移动（不应该发生）
    }
}