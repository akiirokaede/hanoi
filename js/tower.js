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
    addHint(type = 'source') {
        this.element.classList.add('hint', type);
    }

    // 移除提示动画
    removeHint() {
        this.element.classList.remove('hint', 'source', 'target');
    }

    // 检查是否可以放置圆盘
    canPlaceDisc(disc) {
        return this.isEmpty() || disc.size < this.getTopDisc().size;
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
    
    // 应用晕眩诅咙效果
    applyDizziness() {
        this.element.classList.add('dizzy');
    }
    
    // 移除晕眩诅咙效果
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
        this.isDiscMoving = false; // 添加状态标记，跟踪是否有圆盘正在移动
        this.hasSlownessCurse = false; // 添加标记，跟踪是否受到迟缓诅咒
        this.moveHistory = []; // 添加移动历史记录
        
        // 不再在构造函数中初始化塔座，改为在setLevel方法中动态创建
    }

    // 添加塔座点击事件
    addTowerEventListeners() {
        for (const tower of this.towers) {
            tower.element.addEventListener('click', () => {
                // 检查游戏状态
                if (!this.gameStarted || this.levelCompleted) return;
                
                // 如果有圆盘正在移动中且玩家受到迟缓诅咒，忽略点击
                if (this.hasSlownessCurse && this.isDiscMoving) {
                    // 添加视觉或声音提示，表明需要等待
                    playSound('error');
                    const message = document.getElementById('message');
                    if (!message.textContent.includes('请等待')) {
                        message.textContent = '请等待当前移动完成...';
                        setTimeout(() => {
                            if (message.textContent.includes('请等待')) {
                                message.textContent = '';
                            }
                        }, 1000);
                    }
                    return;
                }
                
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
    
    // 统一的提示功能入口
    showHint(forceShow = false) {
        // 如果不是强制显示（如洞察之眼道具），则检查提示次数
        if (!forceShow && this.availableHints <= 0) {
            const message = document.getElementById('message');
            message.textContent = '没有可用的提示了';
            message.classList.add('hint-message');
            setTimeout(() => {
                message.classList.remove('hint-message');
                message.textContent = '';
            }, 2000);
            return;
        }
        
        // 清除之前的提示
        this.towers.forEach(tower => tower.removeHint());
        
        // 获取下一个最优移动
        const hintMove = this.getNextOptimalMove();
        if (hintMove) {
            // 添加新的提示
            this.towers[hintMove.from].addHint('source');
            this.towers[hintMove.to].addHint('target');

            // 如果不是强制显示，则更新提示次数
            if (!forceShow) {
                this.availableHints--;
            const message = document.getElementById('message');
                message.textContent = `将圆盘从第${hintMove.from + 1}个塔移动到第${hintMove.to + 1}个塔`;
            message.classList.add('hint-message');
            
            // 更新提示按钮文本
            const hintButton = document.getElementById('hint-button');
            if (hintButton) {
                hintButton.textContent = `提示 (${this.availableHints})`;
                    if (this.availableHints <= 0) {
                        hintButton.disabled = true;
                    }
                }
            }

            // 播放提示音效
            playHintSound();
        } else {
            const message = document.getElementById('message');
            message.textContent = '无法提供提示';
            message.classList.add('hint-message');
        }

        // 3秒后清除提示消息
            setTimeout(() => {
            const message = document.getElementById('message');
                message.classList.remove('hint-message');
                        message.textContent = '';
            
            // 清除高亮效果
            this.towers.forEach(tower => tower.removeHint());
            }, 3000);
    }
    
    // 计算最优下一步移动
    getNextOptimalMove() {
        const gameState = this.analyzeGameState();
        
        if (this.towers.length === 3) {
            return this.solveStandardHanoi(gameState);
        } else {
            // 对于多塔，最优解非常复杂 (Frame-Stewart 算法)
            // 这里采用一个启发式策略，旨在优先完成目标，减少卡顿
            return this.solveMultiTowerHanoiHeuristic(gameState);
        }
    }
    
    // 标准3塔汉诺塔问题求解 (迭代方法)
    solveStandardHanoi(gameState) {
        const n = this.discCount;
        // const totalMoves = Math.pow(2, n) - 1; // 总步数，可能用于其他逻辑，暂时保留
        const currentMoveNumber = this.moveCount + 1; // 下一步是第几次移动

        // 检查是否已完成
        if (this.towers[this.targetTower].getDiscCount() === n && this.isTowerOrdered(this.towers[this.targetTower])) {
            return null;
        }

        // 根据当前移动次数的奇偶性决定移动哪个圆盘
        if (currentMoveNumber % 2 !== 0) {
            // 奇数次移动：移动最小圆盘 (size 1)
            const smallestDiscLocation = gameState.smallestDiscLocation;
            if (smallestDiscLocation === -1) {
                console.error("solveStandardHanoi: Cannot find smallest disc!");
                return null; // 找不到最小圆盘，状态错误
            }

            const smallestDisc = this.towers[smallestDiscLocation].getTopDisc();
            let target;

            // 目标塔根据圆盘总数奇偶性不同
            if (n % 2 !== 0) { // 奇数个圆盘: 0 -> target(2) -> 1 -> 0 (目标塔是 this.targetTower)
                target = (smallestDiscLocation + 1) % 3;
            } else { // 偶数个圆盘: 0 -> 1 -> target(2) -> 0
                target = (smallestDiscLocation - 1 + 3) % 3; // 逆时针
            }
            
            // 标准算法中，目标塔索引应该是计算出来的，而不是固定的 this.targetTower
            // 例如，3盘奇数： 0->2, 2->1, 1->0
            // 例如，4盘偶数： 0->1, 1->2, 2->0

            // 检查预定移动是否合法且非重复
            if (this.towers[target].canPlaceDisc(smallestDisc) && !this.isRepeatedMove(smallestDiscLocation, target)) {
                 return { from: smallestDiscLocation, to: target };
            } else {
                 // 如果预定移动不可行（通常是因为 isRepeatedMove），严格算法下应该停止或表明卡住
                 // 不再尝试 alternativeTarget 或调用 findNonSmallestDiscMove
                 console.warn(`solveStandardHanoi (奇数步 ${currentMoveNumber}): 预定移动 ${smallestDiscLocation}->${target} 被阻止 (重复? ${this.isRepeatedMove(smallestDiscLocation, target)})`);
                 return null; 
            }

        } else {
            // 偶数次移动：在非最小圆盘所在的两个塔之间进行唯一可能的移动
            return this.findNonSmallestDiscMove(gameState);
        }
    }

    // 寻找非最小圆盘的移动 (用于3塔)
    findNonSmallestDiscMove(gameState) {
        const smallestDiscLocation = gameState.smallestDiscLocation;
        if (smallestDiscLocation === -1) return null; // 确保最小盘位置有效
        
        let tower1 = -1, tower2 = -1;

        // 找到两个不包含最小圆盘的塔
        for (let i = 0; i < 3; i++) {
            if (i !== smallestDiscLocation) {
                if (tower1 === -1) {
                    tower1 = i;
                } else {
                    tower2 = i;
                    break;
                }
            }
        }
        
        if (tower1 === -1 || tower2 === -1) {
             console.error("findNonSmallestDiscMove: Couldn't find two towers without smallest disc!");
             return null; // 状态错误
        }

        const tower1Obj = this.towers[tower1];
        const tower2Obj = this.towers[tower2];

        // 检查从 tower1 移动到 tower2 是否可能且非重复
        if (!tower1Obj.isEmpty() && tower2Obj.canPlaceDisc(tower1Obj.getTopDisc()) && !this.isRepeatedMove(tower1, tower2)) {
             return { from: tower1, to: tower2 };
        }

        // 检查从 tower2 移动到 tower1 是否可能且非重复
        if (!tower2Obj.isEmpty() && tower1Obj.canPlaceDisc(tower2Obj.getTopDisc()) && !this.isRepeatedMove(tower2, tower1)) {
              return { from: tower2, to: tower1 };
        }

        // 如果两个方向都不可行（因为重复或其他原因），严格算法下应返回 null
        console.warn(`findNonSmallestDiscMove (偶数步): 两个非最小盘塔 (${tower1}, ${tower2}) 之间无合法非重复移动。`);
        return null; 

    }
    
    // 多塔汉诺塔问题的启发式求解策略
    solveMultiTowerHanoiHeuristic(gameState) {
        const n = this.discCount;
        const targetTowerIndex = this.targetTower;

        // 0. 如果已完成，返回 null
        if (this.towers[targetTowerIndex].getDiscCount() === n && this.isTowerOrdered(this.towers[targetTowerIndex])) {
             return null;
        }

        // 1. 优先：将任何塔顶圆盘移动到目标塔 (如果合法且有意义)
        for (let i = 0; i < this.towers.length; i++) {
            if (i === targetTowerIndex || this.towers[i].isEmpty()) continue;
            
            const sourceTower = this.towers[i];
            const targetTower = this.towers[targetTowerIndex];
            const topDisc = sourceTower.getTopDisc();

            if (targetTower.canPlaceDisc(topDisc)) {
                 // 检查移动是否有意义：
                 // - 目标塔为空
                 // - 或者，移动的圆盘比目标塔顶圆盘小1 (形成连续)
                 // - 或者，这是游戏后期，目标塔已经接近完成
                 const isMeaningful = targetTower.isEmpty() || 
                                      topDisc.size === targetTower.getTopDisc().size - 1 ||
                                      (gameState.isNearingCompletion && gameState.discsOnTargetTower > n / 2);

                 if (isMeaningful && !this.isRepeatedMove(i, targetTowerIndex)) {
                     console.log("Heuristic: Move to target", { from: i, to: targetTowerIndex });
                     return { from: i, to: targetTowerIndex };
                 }
            }
        }

        // 2. 次优先：如果最大圆盘 (size n) 不在目标塔，为其清路
        const largestDiscLocation = gameState.largestDiscLocation;
        if (largestDiscLocation !== targetTowerIndex) {
            const towerWithLargest = this.towers[largestDiscLocation];
            if (towerWithLargest.getTopDisc().size !== n) { // 最大圆盘不在顶部
                const blockingDisc = towerWithLargest.getTopDisc();
                
                // 寻找最佳目标塔来移动障碍圆盘
                // 优先选择空塔（非源塔、非目标塔）
                let bestTarget = -1;
                for (const emptyTowerIdx of gameState.emptyTowers) {
                     if (emptyTowerIdx !== largestDiscLocation && emptyTowerIdx !== targetTowerIndex) {
                          bestTarget = emptyTowerIdx;
                          break;
                     }
                }
                
                // 如果没有合适的空塔，选择一个可以放置且非目标塔的塔
                if (bestTarget === -1) {
                     for (let j = 0; j < this.towers.length; j++) {
                          if (j === largestDiscLocation || j === targetTowerIndex) continue;
                          if (this.towers[j].canPlaceDisc(blockingDisc) && !this.isRepeatedMove(largestDiscLocation, j)) {
                               bestTarget = j;
                               break;
                          }
                     }
                }

                // 如果找到目标，移动障碍圆盘
                if (bestTarget !== -1 && !this.isRepeatedMove(largestDiscLocation, bestTarget)) {
                     console.log("Heuristic: Clear path for largest disc", { from: largestDiscLocation, to: bestTarget });
                     return { from: largestDiscLocation, to: bestTarget };
                }
            } else { // 最大圆盘在顶部，尝试移动到目标塔
                 if (this.towers[targetTowerIndex].canPlaceDisc(towerWithLargest.getTopDisc()) && !this.isRepeatedMove(largestDiscLocation, targetTowerIndex)) {
                      console.log("Heuristic: Move largest disc to target", { from: largestDiscLocation, to: targetTowerIndex });
                      return { from: largestDiscLocation, to: targetTowerIndex };
                 }
            }
        }

        // 3. 再次尝试移动最小圆盘 (size 1)
        //    - 寻找一个能让它更接近目标塔的移动
        //    - 或者至少移动到一个非重复的位置
        const smallestDiscLocation = gameState.smallestDiscLocation;
        if (smallestDiscLocation !== -1) {
             const smallestDisc = this.towers[smallestDiscLocation].getTopDisc();
             let bestSmallestTarget = -1;
             
             // 优先移向目标塔（如果可能）
              if (this.towers[targetTowerIndex].canPlaceDisc(smallestDisc) && !this.isRepeatedMove(smallestDiscLocation, targetTowerIndex)) {
                  bestSmallestTarget = targetTowerIndex;
        } else {
                  // 否则，移动到任何其他合法的、非重复的塔
                   for (let j = 0; j < this.towers.length; j++) {
                        if (j === smallestDiscLocation) continue;
                        if (this.towers[j].canPlaceDisc(smallestDisc) && !this.isRepeatedMove(smallestDiscLocation, j)) {
                             bestSmallestTarget = j;
                             break; // 找到一个就行
                        }
                   }
              }
              
              if (bestSmallestTarget !== -1) {
                   console.log("Heuristic: Move smallest disc", { from: smallestDiscLocation, to: bestSmallestTarget });
                   return { from: smallestDiscLocation, to: bestSmallestTarget };
              }
        }


        // 4. 后备：进行任何合法的、非重复的移动
        const fallbackMove = this.findAnyValidMove(gameState);
         if (fallbackMove) {
             console.log("Heuristic: Fallback move", fallbackMove);
            return fallbackMove;
         }

        // 5. 如果完全卡住，返回 null
        console.error("Heuristic: No valid move found!");
        return null;
    }
    
    // 寻找任何有效的移动 (可选择排除某些塔)
    findAnyValidMove(gameState, excludedTowers = []) {
        for (let i = 0; i < this.towers.length; i++) {
            if (this.towers[i].isEmpty() || excludedTowers.includes(i)) continue;
            
            const topDisc = this.towers[i].getTopDisc();
            
            for (let j = 0; j < this.towers.length; j++) {
                if (i === j || excludedTowers.includes(j)) continue;
                
                if (this.towers[j].canPlaceDisc(topDisc) && !this.isRepeatedMove(i, j)) {
                    return { from: i, to: j };
                }
            }
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
            isNearingCompletion: false,
            largestDiscLocation: -1,
            largestDiscSize: 0,
            emptyTowers: [],
            orderedTowers: [],
            disorderedTowers: []
        };
        
        // 找到最小和最大圆盘的尺寸
         let minSize = Infinity;
         let maxSize = 0;
         this.discs.forEach(d => {
             if(d.size < minSize) minSize = d.size;
             if(d.size > maxSize) maxSize = d.size;
         });
         state.smallestDiscSize = minSize;
         state.largestDiscSize = maxSize;


        for (let i = 0; i < this.towers.length; i++) {
            const tower = this.towers[i];
            const discs = tower.discs;
            const isEmpty = tower.isEmpty();
            const topDisc = isEmpty ? null : tower.getTopDisc();
            const isOrdered = this.isTowerOrdered(tower);
            const discCount = discs.length;

            state.towerStates.push({
                index: i,
                isEmpty: isEmpty,
                topDiscSize: isEmpty ? Infinity : topDisc.size,
                discCount: discCount,
                isOrdered: isOrdered,
                discs: [...discs] // 浅拷贝
            });

            if (isEmpty) {
                state.emptyTowers.push(i);
            }
            
            if (isOrdered) {
                state.orderedTowers.push(i);
            } else {
                state.disorderedTowers.push(i);
            }

            if (!isEmpty) {
                // 更新最小圆盘位置
                if (topDisc.size === state.smallestDiscSize) {
                    state.smallestDiscLocation = i;
                }
                // 更新最大圆盘位置 (检查基座圆盘)
                 if (discs.length > 0 && discs[0].size === state.largestDiscSize) {
                     state.largestDiscLocation = i;
                 }
            }

            if (i === this.targetTower) {
                state.discsOnTargetTower = discCount;
                if (discCount > 0 && discs[0].size === state.largestDiscSize && isOrdered) { // 确保最大圆盘在底部且有序
                    state.largestDiscCorrectlyPlaced = true;
                }
            }
        }

        state.isNearingCompletion = (
            state.discsOnTargetTower > this.discCount / 2 || 
            (state.largestDiscCorrectlyPlaced && state.discsOnTargetTower > 1) ||
            (state.towerStates[this.targetTower].isOrdered && state.discsOnTargetTower > 0)
        );
        
        // 确保 largestDiscLocation 被正确设置
        if (state.largestDiscLocation === -1) {
             for (let i = 0; i < state.towerStates.length; i++) {
                 const towerState = state.towerStates[i];
                 if (towerState.discCount > 0 && towerState.discs[0].size === state.largestDiscSize) {
                      state.largestDiscLocation = i;
                      break;
                 }
             }
        }


        return state;
    }

    // 检查塔上的圆盘是否有序（从大到小）
    isTowerOrdered(tower) {
        const discs = tower.discs;
        if (discs.length <= 1) return true;
        
        for (let i = 0; i < discs.length - 1; i++) {
            // 严格检查，底部圆盘必须最大
             if (i === 0 && discs[i].size < discs[i+1].size) return false;
             // 其他圆盘只需满足上小下大
             if (i > 0 && discs[i].size > discs[i-1].size) return false; // 检查是否比下面的大
             if (discs[i].size < discs[i + 1].size) { // 检查是否比上面的小
                return false;
            }
        }
        
        return true;
    }

    // 记录移动历史 (保持不变)
    recordMove(from, to) {
        this.moveHistory.push({
            from,
            to,
            timestamp: Date.now()
        });
        
        // 只保留最近的10次移动
        if (this.moveHistory.length > 10) {
            this.moveHistory.shift();
        }
    }
    
    // 检查是否重复移动 (修改为只检查最后一次)
    isRepeatedMove(from, to) {
        // 只检查最近1次移动来阻止直接来回移动 A -> B -> A
        const lastMove = this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null;
        
        if (lastMove) {
            return lastMove.from === to && lastMove.to === from;
        }
        return false; // 没有历史记录，不重复
    }

    // 移动圆盘
    moveDisc(fromTower, toTower) {
        const disc = fromTower.getTopDisc();
        if (disc) {
            if (toTower.isEmpty() || disc.size < toTower.getTopDisc().size) {
                const movedDisc = fromTower.removeTopDisc();
                
                // 记录移动历史
                this.recordMove(this.towers.indexOf(fromTower), this.towers.indexOf(toTower));
                
                // 创建自然掉落动画，首先将圆盘移动到目标塔的顶部
                // 然后通过动画让它落到正确的位置
                this.animateDiscMove(movedDisc, toTower);
                
                fromTower.unhighlight();
                this.selectedTower = null;
            }
        }
    }
    
    // 添加自然掉落动画
    animateDiscMove(disc, toTower) {
        // 设置圆盘正在移动标志 - 用于迟缓诅咒效果
        this.isDiscMoving = true;
        
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
        
        // 开始掉落动画 - 使用CSS变量
        const moveSpeed = getComputedStyle(document.documentElement).getPropertyValue('--disc-move-speed').trim();
        const transitionTiming = getComputedStyle(document.documentElement).getPropertyValue('--disc-transition-timing').trim();
        disc.element.style.transition = `bottom ${moveSpeed} ${transitionTiming}, transform ${moveSpeed} ${transitionTiming}`;
        
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
        
        // 解析transition的时间，用于设置正确的动画结束时间
        const transitionTime = parseFloat(moveSpeed) * 1000 || 500; // 如果解析失败，默认500ms
        
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
                
                // 动画和额外效果都结束后，重置圆盘移动标志
                this.isDiscMoving = false;
            }, 500);
        }, transitionTime); // 动态匹配动画时长
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
        this.isDiscMoving = false; // 重置圆盘移动状态
        this.hasSlownessCurse = false; // 重置迟缓诅咒状态
        this.moveHistory = []; // 清空移动历史
        
        // 重置CSS变量为默认值
        document.documentElement.style.setProperty('--disc-move-speed', '0.3s');
        document.documentElement.style.setProperty('--disc-transition', 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)');
    }
    
    // 自动移动（供魔法棒道具使用）
    autoMove() {
        const move = this.getNextOptimalMove();
        if (move) {
            const fromTower = this.towers[move.from];
            const toTower = this.towers[move.to];
            
            // 显示移动提示
            fromTower.addHint('source');
            toTower.addHint('target');
            
            // 延迟执行移动
            setTimeout(() => {
                this.moveDisc(fromTower, toTower);
                // 清除提示效果
                fromTower.removeHint();
                toTower.removeHint();
            }, 500);
                } else {
            const message = document.getElementById('message');
            message.textContent = '无法完成自动移动';
            message.classList.add('hint-message');
            setTimeout(() => {
                message.classList.remove('hint-message');
                message.textContent = '';
            }, 2000);
        }
    }

    // 应用诅咒效果到塔和圆盘
    applyCurses(curses) {
        if (!curses || !Array.isArray(curses) || curses.length === 0) return;

        console.log("正在应用诅咒效果:", curses);

        // 处理各种诅咒效果
        curses.forEach(curse => {
            switch(curse) {
                case "迷雾诅咒":
                    // 迷雾诅咒在game.js中的效果系统中处理
                    break;

                case "迷失诅咒":
                    // 迷失诅咒现在在game.js中的效果系统中处理
                    // 这里不再直接应用晃动效果
                    break;

                case "迟缓诅咒":
                    // 移动动画变慢
                    document.documentElement.style.setProperty('--disc-move-speed', '1s');
                    document.documentElement.style.setProperty('--disc-transition', 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)');
                    // 设置迟缓诅咒标志，使动画能真正阻止操作
                    this.hasSlownessCurse = true;
                    break;

                case "晕眩诅咒":
                    // 圆盘颜色混乱
                    this.applyDizzinessToDiscs();
                    break;

                default:
                    console.warn("未知的诅咒效果:", curse);
                    break;
            }
        });
    }

    // 应用祝福效果到塔和圆盘
    applyBlessings(blessings) {
        if (!blessings || !Array.isArray(blessings) || blessings.length === 0) return;

        console.log("正在应用祝福效果:", blessings);

        // 处理各种祝福效果
        blessings.forEach(blessing => {
            switch(blessing) {
                case "时间祝福":
                    // 时间祝福在game.js中的效果系统中处理
                    this.hasBlessingTimeBonus = true;
                    break;

                case "清晰祝福":
                    // 提示概率增加在game.js中的效果系统中处理
                    this.hintChanceBonus = 0.3;
                    break;

                case "幸运祝福":
                    // 道具掉落率提高在game.js中的效果系统中处理
                    this.itemChanceBonus = 0.2;
                    break;

                case "重置祝福":
                    // 添加重置按钮
                    this.addResetButton();
                    break;

                default:
                    console.warn("未知的祝福效果:", blessing);
                    break;
            }
        });
    }

    // 应用迷失诅咒效果 - 塔座微微摇晃
    applyWanderingTowers() {
        for (let i = 0; i < this.towers.length; i++) {
            const tower = this.towers[i].element;
            tower.classList.add('wobble-tower');
        }
    }

    // 应用晕眩诅咙 - 圆盘颜色混乱
    applyDizzinessToDiscs() {
        this.discs.forEach(disc => {
            if (Math.random() < 0.7) { // 70%的圆盘会变色
                disc.applyDizziness();
            }
        });
    }

    // 为重置祝福添加重置按钮
    addResetButton() {
        // 检查是否已存在重置按钮
        if (document.getElementById('reset-button')) return;

        const resetButton = document.createElement('button');
        resetButton.id = 'reset-button';
        resetButton.className = 'game-button blessing-button';
        resetButton.textContent = '重置一次';
        resetButton.title = '重置祝福: 点击可重新布局圆盘(仅一次)';

        // 点击时重置塔和圆盘，但不重置关卡
        resetButton.addEventListener('click', () => {
            if (!this.gameStarted || this.levelCompleted) return;

            // 保存当前配置
            const currentConfig = { ...this.specialConfig };
            const discCount = this.discCount;
            const movesGoal = this.movesGoal;
            const towerCount = this.towers.length;

            // 重置布局
            this.reset();
            this.setLevel(discCount, movesGoal, towerCount, currentConfig);

            // 使用后移除按钮
            resetButton.disabled = true;
            resetButton.textContent = '已使用';

            // 显示消息
            const message = document.getElementById('message');
            message.textContent = '塔已重置!';
            message.classList.add('blessing-message');
            setTimeout(() => {
                message.classList.remove('blessing-message');
                setTimeout(() => message.textContent = '', 1000);
            }, 2000);
        });

        // 添加到游戏控制区域
        const controlsDiv = document.querySelector('.game-controls');
        if (controlsDiv) {
            controlsDiv.appendChild(resetButton);
        }
    }
}