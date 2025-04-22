/**
 * 汉诺塔塔座类
 * 处理塔和圆盘的逻辑
 */
class Tower {
    constructor(id, totalTowers = 3) {
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
        
        this.element.appendChild(this.pole);
        
        // 创建基座
        this.base = document.createElement('div');
        this.base.className = 'base';
        
        // 根据柱子总数调整基座宽度
        const baseWidthPercent = Math.max(60, 80 - (totalTowers - 3) * 5); // 从80%开始，每多一个柱子减少5%，下限为60%
        this.base.style.width = `${baseWidthPercent}%`;
        
        this.element.appendChild(this.base);
        
        this.discs = [];
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
    constructor(size, totalDiscs, towerCount = 3) {
        this.size = size;
        this.element = document.createElement('div');
        this.element.className = 'disc';
        
        // 根据塔数量动态调整圆盘宽度基础值
        // 塔越多，圆盘基础宽度越小
        const baseWidthPercentage = Math.max(20, 40 - (towerCount - 3) * 5); // 从40%开始，每多一个塔减少5%
        
        // 设置圆盘宽度 - 保持原有的彩虹效果
        const widthPercentage = baseWidthPercentage + (size / totalDiscs) * 40; // 圆盘宽度范围根据塔数量调整
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
        this.element.style.transform = 'translateX(-50%)'; // 确保圆盘中心与柱子对齐
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
    setLevel(discCount, movesGoal, towerCount = 3) {
        this.reset();
        this.discCount = discCount;
        this.movesGoal = movesGoal;
        
        // 动态创建塔座
        this.createTowers(towerCount);
        
        // 计算最优移动次数
        this.optimalMoves = towerCount === 3 ? 
            Math.pow(2, discCount) - 1 : 
            Math.floor((Math.pow(2, discCount) - 1) * 0.8);
        
        // 创建圆盘，并传入 towerCount 参数
        for (let i = discCount; i >= 1; i--) {
            const disc = new Disc(i, discCount, towerCount);
            this.discs.push(disc);
            this.towers[0].addDisc(disc); // 所有圆盘初始放在第一个塔座
        }
        
        // 设置目标塔 - 通常是最后一个塔
        this.targetTower = towerCount - 1;
        
        this.gameStarted = true;
        this.levelCompleted = false;
    }

    // 动态创建塔座 - 更新方法
    createTowers(towerCount) {
        // 获取塔座容器
        const container = document.getElementById('towers-container');
        
        // 清空之前的塔座
        container.innerHTML = '';
        this.towers = [];
        
        // 创建新的塔座
        for (let i = 1; i <= towerCount; i++) {
            const tower = new Tower(i, towerCount);
            this.towers.push(tower);
            container.appendChild(tower.element);
        }
        
        // 为新塔座添加点击事件
        this.addTowerEventListeners();
        
        // 调整塔座宽度以适应不同数量
        const towerWidth = `${Math.min(25, 90 / towerCount)}%`;
        document.querySelectorAll('.tower').forEach(tower => {
            tower.style.width = towerWidth;
        });
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
        // 首先将圆盘添加到目标塔
        toTower.element.appendChild(disc.element);
        
        // 将圆盘定位在塔的顶部
        disc.element.style.transition = 'none'; // 暂时关闭过渡动画
        disc.element.style.bottom = `${toTower.element.offsetHeight - 50}px`; // 塔的顶部位置
        
        // 触发重绘，确保圆盘先显示在顶部
        void disc.element.offsetWidth;
        
        // 开始掉落动画
        disc.element.style.transition = 'bottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'; // 弹跳效果
        
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
            // 检查是否完成关卡
            this.checkCompletion();
            
            // 检查是否触发道具
            this.checkItemTrigger();
        }, 500); // 与动画时长匹配
    }

    // 使用传送石道具 - 允许一次违反规则的移动
    useTeleportItem(fromTower, toTower) {
        const disc = fromTower.getTopDisc();
        if (disc) {
            const movedDisc = fromTower.removeTopDisc();
            
            // 使用动画效果
            toTower.element.appendChild(movedDisc.element);
            
            // 为传送石添加特殊动画效果
            movedDisc.element.style.transition = 'all 0.3s ease';
            movedDisc.element.style.opacity = '0.2';
            
            setTimeout(() => {
                movedDisc.element.style.opacity = '1';
                
                // 计算最终位置
                const position = toTower.discs.length;
                toTower.discs.push(movedDisc);
                
                // 使用和圆盘类相同的位置计算逻辑
                const DISC_MARGIN = 2;  // 圆盘之间的间距
                const bottomOffset = 30; // 距离底座顶部的固定偏移量
                
                // 计算当前圆盘下方所有圆盘的总高度
                let totalStackHeight = 0;
                for (let i = 0; i < position; i++) {
                    if (toTower.discs[i] && toTower.discs[i].height) {
                        totalStackHeight += toTower.discs[i].height + DISC_MARGIN;
                    } else {
                        // 后备方案，使用当前圆盘高度作为估计
                        totalStackHeight += movedDisc.height + DISC_MARGIN;
                    }
                }
                
                const finalBottom = bottomOffset + totalStackHeight;
                
                // 设置最终位置
                movedDisc.element.style.bottom = `${finalBottom}px`;
                
                playSound('teleport');
                
                this.moveCount++;
                this.updateMoves();
                
                fromTower.unhighlight();
                this.selectedTower = null;
                
                // 检查是否完成关卡
                this.checkCompletion();
            }, 200);
        }
    }

    // 更新移动次数显示
    updateMoves() {
        document.getElementById('moves-count').textContent = this.moveCount;
    }

    // 检查关卡是否完成
    checkCompletion() {
        // 判断所有圆盘是否都移到了目标塔座
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

    // 检查是否触发道具
    checkItemTrigger() {
        // 降低道具触发频率
        const BASE_CHANCE = 15; // 基础触发几率降低到15%
        
        // 1. 如果玩家接近最优解，有较小几率获得道具
        if (this.moveCount === Math.floor(this.optimalMoves * 0.7) && chance(BASE_CHANCE)) {
            this.triggerItemSpawn('optimality');
        }
        
        // 2. 玩家在特定塔座配置时获得道具，降低触发几率
        const allTowersHaveDiscs = this.towers.every(tower => !tower.isEmpty());
        if (allTowersHaveDiscs && chance(BASE_CHANCE)) {
            this.triggerItemSpawn('balance');
        }
        
        // 3. 关卡首次移动时，有小几率获得"新手幸运"道具
        if (this.moveCount === 5 && chance(BASE_CHANCE)) {
            this.triggerItemSpawn('beginner_luck');
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
        // 多塔汉诺塔的求解算法比较复杂
        // 这里提供一个简化的版本，主要针对3塔的情况
        
        const towerCount = this.towers.length;
        
        // 如果是游戏开始，提示从第一个塔移动到目标塔或中间塔
        if (this.moveCount === 0) {
            // 对于标准3塔情况
            if (towerCount === 3) {
                return { from: 0, to: this.discCount % 2 === 0 ? 1 : 2 };
            }
            // 对于多塔情况，通常先移动到相邻塔座
            return { from: 0, to: 1 };
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
            // 标准3塔汉诺塔策略
            if (towerCount === 3) {
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
            } else {
                // 对于多塔情况的简单策略：向着目标塔方向移动
                
                // 尝试直接移动到目标塔
                if (smallestDiscTower !== this.targetTower) {
                    const targetTopDisc = this.towers[this.targetTower].getTopDisc();
                    if (!targetTopDisc || smallestDiscSize < targetTopDisc.size) {
                        return { from: smallestDiscTower, to: this.targetTower };
                    }
                }
                
                // 或者移动到任何可以放置的塔座
                for (let i = 0; i < this.towers.length; i++) {
                    if (i !== smallestDiscTower) {
                        const topDisc = this.towers[i].getTopDisc();
                        if (!topDisc || smallestDiscSize < topDisc.size) {
                            return { from: smallestDiscTower, to: i };
                        }
                    }
                }
            }
        }
        
        return null;
    }
}