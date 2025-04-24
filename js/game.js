/**
 * 汉诺塔Roguelike游戏主逻辑
 */
class HanoiRoguelike {
    constructor() {
        // 初始化各个系统
        this.towerGame = new TowerGame();
        this.timer = new GameTimer();
        this.levelSystem = new LevelSystem();
        this.leaderboard = new LeaderboardSystem();
        
        // 设置关卡系统的游戏管理器引用
        this.levelSystem.setGameManager(this);
        
        // 游戏状态
        this.score = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.teleportMode = false;
        this.shieldActive = false;
        this.itemsCollected = 0;
        this.lastMoveTime = 0;
        this.moveSequence = 0;
        this.levelCompletionStreak = 0; // 连续完成关卡的数量
        
        // 初始化道具系统 (在游戏对象之后)
        this.itemSystem = new ItemSystem(this);
        
        // 初始化效果系统
        this.effectsSystem = new EffectsSystem(this); // 新增效果管理系统
        
        // 设置效果系统定期更新
        this.effectUpdateInterval = setInterval(() => {
            if (this.isPlaying && !this.isPaused) {
                this.effectsSystem.update();
            }
        }, 100); // 每100毫秒更新一次效果状态
        
        // 绑定UI事件
        this.setupEventListeners();
        
        // 屏幕管理
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-screen'),
            gameOver: document.getElementById('game-over-screen'),
            levelComplete: document.getElementById('level-complete-screen'),
            tutorial: document.getElementById('tutorial-screen'),
            leaderboard: document.getElementById('leaderboard-screen')
        };
        
        // 尝试加载游戏进度
        this.loadProgress();
        
        // 在游戏初始化时就显示开始屏幕，确保界面正常显示
        this.showStartScreen();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 开始游戏按钮
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        
        // 暂停按钮
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        
        // 暂停菜单按钮
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitGame());
        
        // 游戏结束屏幕按钮
        document.getElementById('submit-score').addEventListener('click', () => this.submitScore());
        document.getElementById('play-again-btn').addEventListener('click', () => this.startGame());
        document.getElementById('to-menu-btn').addEventListener('click', () => this.returnToMenu());
        
        // 关卡完成屏幕按钮
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (nextLevelBtn) {
            // 清除所有旧事件监听器，确保只绑定一次
            const newBtn = nextLevelBtn.cloneNode(true);
            if (nextLevelBtn.parentNode) {
                nextLevelBtn.parentNode.replaceChild(newBtn, nextLevelBtn);
            }
            
            // 添加新的事件监听器
            newBtn.addEventListener('click', () => {
                console.log('下一关按钮被点击');
                this.startNextLevel();
            });
        }
        
        // 排行榜按钮
        document.getElementById('leaderboard-btn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('back-from-leaderboard').addEventListener('click', () => this.showStartScreen());
        
        // 教程按钮
        document.getElementById('tutorial-btn').addEventListener('click', () => this.showTutorial());
        document.getElementById('back-from-tutorial').addEventListener('click', () => this.showStartScreen());
        
        // 关卡完成事件监听
        document.addEventListener('levelCompleted', (e) => this.onLevelCompleted(e.detail));
        
        // 道具触发事件监听
        document.addEventListener('itemSpawned', (e) => this.onItemSpawned(e.detail));
        
        // 连续快速移动检测
        document.addEventListener('click', () => this.checkSequentialMoves());
        
        // 时间祝福事件监听
        document.addEventListener('timeBlessing', (event) => {
            this.onTimeBlessing(event.detail.bonusSeconds);
        });
    }

    // 开始新游戏
    startGame() {
        // 首先清理所有效果和样式
        this.cleanupAllEffects();
        
        this.reset();
        this.showScreen('game');
        this.isPlaying = true;
        this.startNextLevel();
    }
    
    // 开始下一关卡
    startNextLevel() {
        // 调试信息
        console.log('开始加载下一关');
        
        // 从关卡系统获取新关卡设置
        const levelConfig = this.levelSystem.generateNextLevel();
        
        // 调试输出 - 确认关卡配置已正确生成
        console.log("生成关卡配置:", levelConfig);
        console.log("关卡圆盘数:", levelConfig.discCount);
        console.log("移动上限:", levelConfig.moveLimit);
        console.log("关卡塔数:", levelConfig.towerCount);
        
        // 使用通用的loadLevel方法加载关卡
        this.loadLevel(levelConfig, false);
    }
    
    // 通用的加载关卡方法，既可用于正常游戏又可用于测试关卡
    loadLevel(levelConfig, isTestMode = false) {
        console.log(isTestMode ? '加载测试关卡...' : '加载游戏关卡...');
        console.log('关卡配置:', levelConfig);
        
        // 1. 清理前一关卡的所有效果和样式
        this.cleanupAllEffects();
        
        // 2. 清除所有特殊关卡效果
        document.getElementById('game-screen').classList.remove('treasure-level');
        
        // 3. 设置UI显示
        document.getElementById('level-number').textContent = levelConfig.level;
        document.getElementById('moves-goal').textContent = levelConfig.moveLimit;
        
        // 4. 显示特殊事件名称（如果有）
        if (levelConfig.specialEventName) {
            const specialEventMsg = document.getElementById('special-event-message') || 
                (() => {
                    const msg = document.createElement('div');
                    msg.id = 'special-event-message';
                    msg.className = 'special-event-message';
                    document.querySelector('.game-header').appendChild(msg);
                    return msg;
                })();
                
            specialEventMsg.textContent = levelConfig.specialEventName;
            specialEventMsg.classList.add('show');
            
            // 如果是宝藏关卡，添加额外的视觉样式
            if (levelConfig.specialConfig?.treasureLevel) {
                specialEventMsg.classList.add('treasure-message');
                document.getElementById('game-screen').classList.add('treasure-level');
                
                // 显示宝藏关卡提示消息
                const message = document.getElementById('message');
                message.textContent = '宝藏关卡！完成可获得额外奖励！';
                message.classList.add('treasure-message');
                setTimeout(() => {
                    message.classList.remove('treasure-message');
                    setTimeout(() => {
                        if (message.textContent === '宝藏关卡！完成可获得额外奖励！') {
                            message.textContent = '';
                        }
                    }, 1000);
                }, 3000);
            }
            
            // 5秒后隐藏
            setTimeout(() => {
                specialEventMsg.classList.remove('show');
                if (levelConfig.specialConfig?.treasureLevel) {
                    specialEventMsg.classList.remove('treasure-message');
                }
            }, 5000);
        }
        
        // 5. 设置塔游戏
        console.log("设置塔游戏，传递圆盘数:", levelConfig.discCount);
        this.towerGame.setLevel(
            levelConfig.discCount, 
            levelConfig.moveLimit, 
            levelConfig.towerCount || 3, 
            levelConfig
        );
        
        // 6. 设置并启动计时器
        this.timer.setTimer(levelConfig.timeLimit, () => this.onTimeUp());
        this.timer.startTimer();
        
        // 7. 清除之前的效果
        this.effectsSystem.clearAllEffects();
        
        // 8. 应用关卡变化的效果
        if (levelConfig.variation) {
            this.applyVariationEffects(levelConfig.variation);
        }
        
        // 9. 确保游戏状态正确
        this.isPlaying = true;
        this.isPaused = false;
        
        // 10. 强制隐藏所有其他屏幕并显示游戏屏幕
        Object.values(this.screens).forEach(screen => {
            screen.style.display = 'none';
            screen.classList.remove('active');
        });
        
        this.screens.game.style.display = 'flex';
        this.screens.game.classList.add('active');
        this.screens.game.style.zIndex = '5';
        
        // 11. 监听时间祝福事件
        document.removeEventListener('timeBlessing', this.handleTimeBlessing); // 先移除以避免重复
        this.handleTimeBlessing = (e) => {
            if (e.detail && e.detail.bonusSeconds) {
                this.timer.addTime(e.detail.bonusSeconds);
            }
        };
        document.addEventListener('timeBlessing', this.handleTimeBlessing);
        
        // 12. 如果是测试模式，设置特殊的关卡完成处理程序
        if (isTestMode) {
            this.setupTestLevelCompletionHandler();
        }
        
        console.log(isTestMode ? '测试关卡加载完成' : '游戏关卡加载完成');
    }
    
    // 应用关卡变化的效果
    applyVariationEffects(variation) {
        // 确保 variation 对象存在且结构完整
        if (!variation) {
            console.warn('关卡变化(variation)对象不存在');
            return;
        }
        
        try {
            // 应用祝福效果到效果系统
            if (variation.blessings && Array.isArray(variation.blessings) && variation.blessings.length > 0) {
                variation.blessings.forEach(blessing => {
                    if (typeof blessing === 'string') {
                        this.applyBlessing(blessing);
                    } else {
                        console.warn('无效的祝福类型:', typeof blessing, blessing);
                    }
                });
            }
            
            // 应用诅咒效果到效果系统
            if (variation.curses && Array.isArray(variation.curses) && variation.curses.length > 0) {
                variation.curses.forEach(curse => {
                    if (typeof curse === 'string') {
                        this.applyCurse(curse);
                    } else {
                        console.warn('无效的诅咒类型:', typeof curse, curse);
                    }
                });
            }
        } catch (error) {
            console.error('应用关卡变化效果时发生错误:', error);
            // 错误不影响游戏继续进行
        }
    }
    
    // 应用祝福效果
    applyBlessing(blessing) {
        const blessingDuration = 45; // 默认45秒
        
        switch (blessing) {
            case "时间祝福":
                this.effectsSystem.addEffect({
                    id: `blessing-time-${Date.now()}`,
                    type: 'blessing',
                    name: '时间祝福',
                    description: '每次移动增加1秒',
                    duration: blessingDuration,
                    icon: '⏱️',
                    onStart: (game) => {
                        game.towerGame.hasBlessingTimeBonus = true;
                    },
                    onEnd: (game) => {
                        game.towerGame.hasBlessingTimeBonus = false;
                    }
                });
                break;
                
            case "清晰祝福":
                this.effectsSystem.addEffect({
                    id: `blessing-clarity-${Date.now()}`,
                    type: 'blessing',
                    name: '清晰祝福',
                    description: '提示概率增加30%',
                    duration: blessingDuration,
                    icon: '👁️',
                    onStart: (game) => {
                        game.towerGame.hintChanceBonus = 0.3;
                    },
                    onEnd: (game) => {
                        game.towerGame.hintChanceBonus = 0;
                    },
                    onTick: (game) => {
                        if (Math.random() < 0.1) {
                            game.towerGame.discs.forEach(disc => {
                                if (disc.isInvisible) {
                                    disc.temporaryReveal();
                                }
                            });
                        }
                    }
                });
                break;
                
            case "幸运祝福":
                this.effectsSystem.addEffect({
                    id: `blessing-luck-${Date.now()}`,
                    type: 'blessing',
                    name: '幸运祝福',
                    description: '道具掉落率提高20%',
                    duration: blessingDuration,
                    icon: '🍀',
                    onStart: (game) => {
                        game.towerGame.itemChanceBonus = 0.2;
                    },
                    onEnd: (game) => {
                        game.towerGame.itemChanceBonus = 0;
                    }
                });
                break;
        }
    }
    
    // 应用诅咒效果
    applyCurse(curse) {
        const curseDuration = 30; // 默认30秒
        
        switch (curse) {
            case "迷雾诅咒":
                this.effectsSystem.addEffect({
                    id: `curse-fog-${Date.now()}`,
                    type: 'curse',
                    name: '迷雾诅咒',
                    description: '视野受阻，UI元素模糊',
                    duration: curseDuration,
                    icon: '🌫️',
                    onStart: (game) => {
                        const fogOverlay = document.createElement('div');
                        fogOverlay.className = 'fog-overlay';
                        fogOverlay.id = 'fog-curse-overlay';
                        document.querySelector('.game-area').appendChild(fogOverlay);
                        
                        document.querySelectorAll('.ui-element, .disc').forEach(elem => {
                            if (Math.random() < 0.3) {
                                elem.classList.add('foggy');
                            }
                        });
                    },
                    onTick: (game) => {
                        const fogOverlay = document.getElementById('fog-curse-overlay');
                        if (fogOverlay) {
                            const opacity = 0.2 + (Math.sin(Date.now() / 1000) + 1) * 0.15;
                            fogOverlay.style.opacity = opacity.toString();
                        }
                        
                        if (Math.random() < 0.05) {
                            document.querySelectorAll('.ui-element, .disc').forEach(elem => {
                                if (Math.random() < 0.2) {
                                    elem.classList.toggle('foggy');
                                }
                            });
                        }
                    },
                    onEnd: (game) => {
                        const fogOverlay = document.getElementById('fog-curse-overlay');
                        if (fogOverlay && fogOverlay.parentNode) {
                            fogOverlay.parentNode.removeChild(fogOverlay);
                        }
                        
                        document.querySelectorAll('.foggy').forEach(elem => {
                            elem.classList.remove('foggy');
                        });
                    }
                });
                break;
        }
    }
    
    // 暂停游戏
    pauseGame() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.isPaused = true;
        this.timer.pauseTimer();
        this.showScreen('pause');
    }
    
    // 恢复游戏
    resumeGame() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        this.timer.resumeTimer();
        this.showScreen('game');
    }
    
    // 重新开始游戏
    restartGame() {
        this.startGame();
    }
    
    // 退出当前游戏
    quitGame() {
        // 清理所有效果和样式
        this.cleanupAllEffects();
        
        this.isPlaying = false;
        this.isPaused = false;
        this.timer.stopTimer();
        this.showGameOverScreen();
    }
    
    // 游戏失败处理
    onTimeUp() {
        if (this.shieldActive) {
            this.shieldActive = false;
            this.timer.addTime(60);
            document.getElementById('message').textContent = '护盾保护了你！获得额外时间。';
            setTimeout(() => document.getElementById('message').textContent = '', 3000);
            playSound('shield');
            return;
        }
        
        playSound('game_over');
        this.isPlaying = false;
        
        // 在游戏结束时清理所有效果和样式
        this.cleanupAllEffects();
        
        this.showGameOverScreen();
    }
    
    // 显示游戏结束屏幕
    showGameOverScreen() {
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-level').textContent = this.levelSystem.getCurrentLevel();
        document.getElementById('items-collected').textContent = this.itemsCollected;
        
        if (this.leaderboard.isHighScore(this.score)) {
            const nameInput = document.getElementById('player-name');
            nameInput.value = getFromLocalStorage('playerName') || '';
            nameInput.focus();
        } else {
            document.querySelector('.name-input').style.display = 'none';
        }
        
        this.showScreen('gameOver');
    }
    
    // 提交分数
    submitScore() {
        const nameInput = document.getElementById('player-name');
        const playerName = nameInput.value.trim();
        
        if (playerName) {
            saveToLocalStorage('playerName', playerName);
            this.leaderboard.addScore(playerName, this.score, this.levelSystem.getCurrentLevel());
            document.querySelector('.name-input').style.display = 'none';
            playSound('score_submit');
        }
    }
    
    // 显示关卡完成屏幕
    onLevelCompleted(data) {
        this.timer.stopTimer();
        
        const { moveCount, movesGoal } = data;
        const timeLeft = this.timer.getRemainingTime();
        
        // 更新连胜记录
        this.levelCompletionStreak++;
        
        // 更新关卡系统中的进度
        this.levelSystem.updateLevelCompletionStreak(true);
        this.levelSystem.processLevelResults(moveCount, timeLeft, true);
        
        // 计算关卡得分
        const scoreData = this.levelSystem.calculateLevelScore(moveCount, timeLeft, movesGoal);
        
        // 应用道具效果（如果有双倍得分）
        if (this.itemSystem.activeEffects.doubleScore) {
            scoreData.totalScore *= 2;
            this.itemSystem.activeEffects.doubleScore = false;
        }
        
        // 更新总分
        this.score += scoreData.totalScore;
        document.getElementById('score').textContent = this.score.toLocaleString();
        
        // 评估表现
        const performance = this.levelSystem.evaluatePerformance(moveCount, timeLeft);
        
        // 生成奖励道具
        const rewards = this.itemSystem.generateLevelRewards(
            this.levelSystem.getCurrentLevel(),
            performance
        );
        
        // 更新UI显示
        document.getElementById('completed-level').textContent = this.levelSystem.getCurrentLevel();
        document.getElementById('used-moves').textContent = moveCount;
        document.getElementById('remaining-time').textContent = formatTime(timeLeft);
        document.getElementById('level-score').textContent = scoreData.totalScore.toLocaleString();
        
        const rewardsContainer = document.getElementById('rewards-container');
        rewardsContainer.innerHTML = '';
        
        // 显示奖励道具
        if (rewards.length > 0) {
            rewards.forEach(reward => {
                const rewardElement = document.createElement('div');
                rewardElement.className = 'reward-item';
                
                const iconElement = document.createElement('div');
                iconElement.className = 'reward-icon';
                iconElement.style.backgroundImage = `url(${reward.icon})`;
                
                const nameElement = document.createElement('div');
                nameElement.className = 'reward-name';
                nameElement.textContent = reward.name;
                
                rewardElement.appendChild(iconElement);
                rewardElement.appendChild(nameElement);
                rewardsContainer.appendChild(rewardElement);
                
                this.itemSystem.addItem(reward);
                this.itemsCollected++;
            });
        } else {
            const noRewards = document.createElement('p');
            noRewards.textContent = '无奖励';
            rewardsContainer.appendChild(noRewards);
        }
        
        // 重新绑定"下一关卡"按钮事件
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (nextLevelBtn) {
            const newBtn = nextLevelBtn.cloneNode(true);
            if (nextLevelBtn.parentNode) {
                nextLevelBtn.parentNode.replaceChild(newBtn, nextLevelBtn);
            }
            
            newBtn.addEventListener('click', () => {
                console.log('关卡完成屏幕中的下一关按钮被点击');
                
                // 在进入下一关前保存进度
                this.saveProgress();
                this.startNextLevel();
            });
        }
        
        // 显示关卡完成屏幕
        this.showScreen('levelComplete');
        
        if (this.screens.levelComplete) {
            this.screens.levelComplete.style.display = 'flex';
            this.screens.levelComplete.style.zIndex = '50';
            this.screens.levelComplete.classList.add('active');
        }
        
        // 保存游戏进度
        this.saveProgress();
        
        playSound('level_complete');
    }
    
    // 道具被触发事件处理
    onItemSpawned(data) {
        const { triggerType, level } = data;
        const item = this.itemSystem.generateItem(level, triggerType);
        
        if (item) {
            this.itemSystem.addItem(item);
            this.itemsCollected++;
        }
    }
    
    // 检测连续快速移动
    checkSequentialMoves() {
        if (!this.isPlaying) return;
        
        const now = Date.now();
        
        if (now - this.lastMoveTime < 1000) {
            this.moveSequence++;
            
            if (this.moveSequence >= 3 && chance(20)) {
                this.towerGame.triggerItemSpawn('speed');
                this.moveSequence = 0;
            }
        } else {
            this.moveSequence = 0;
        }
        
        this.lastMoveTime = now;
    }
    
    // 增加时间（供道具使用）
    addTime(seconds) {
        this.timer.addTime(seconds);
        document.getElementById('message').textContent = `获得${seconds}秒额外时间！`;
        setTimeout(() => document.getElementById('message').textContent = '', 2000);
    }
    
    // 增加移动机会（供道具使用）
    addMoves(moves) {
        const currentConfig = this.levelSystem.getCurrentConfig();
        currentConfig.moveLimit += moves;
        document.getElementById('moves-goal').textContent = currentConfig.moveLimit;
        document.getElementById('message').textContent = `获得${moves}次额外移动机会！`;
        setTimeout(() => document.getElementById('message').textContent = '', 2000);
    }
    
    // 启用传送模式（供道具使用）
    enableTeleport() {
        this.teleportMode = true;
        document.getElementById('message').textContent = '传送模式已激活！请选择要移动的圆盘所在的塔。';
        
        const towers = document.querySelectorAll('.tower');
        towers.forEach(tower => {
            if (!this.towerGame.towers[parseInt(tower.id.split('-')[1]) - 1].isEmpty()) {
                tower.classList.add('teleport-target-ready');
            }
        });
        
        this.waitForTeleportSelection();
    }
    
    // 等待传送选择
    waitForTeleportSelection() {
        let fromTower = null;
        
        const towerClickHandler = (event) => {
            const towerElement = event.target.closest('.tower');
            if (!towerElement) return;
            
            const towerId = parseInt(towerElement.id.split('-')[1]);
            const tower = this.towerGame.towers[towerId - 1];
            
            if (!fromTower) {
                document.querySelectorAll('.tower').forEach(t => {
                    t.classList.remove('teleport-target-ready');
                });
                
                if (tower.isEmpty()) {
                    document.getElementById('message').textContent = '这个塔没有圆盘可移动！请选择其他塔。';
                    return;
                }
                
                fromTower = tower;
                
                fromTower.element.classList.add('teleport-source');
                
                const towers = document.querySelectorAll('.tower');
                towers.forEach(t => {
                    if (t !== fromTower.element) {
                        t.classList.add('teleport-target-ready');
                    }
                });
                
                document.getElementById('message').textContent = '现在请选择目标塔...';
                
                playSound('select');
            } else {
                const toTower = tower;
                
                if (fromTower === toTower) {
                    document.getElementById('message').textContent = '传送已取消。请重新选择要移动的圆盘所在的塔。';
                    
                    document.querySelectorAll('.tower').forEach(t => {
                        t.classList.remove('teleport-source', 'teleport-target-ready');
                    });
                    
                    document.querySelectorAll('.tower').forEach(t => {
                        const tId = parseInt(t.id.split('-')[1]);
                        if (!this.towerGame.towers[tId - 1].isEmpty()) {
                            t.classList.add('teleport-target-ready');
                        }
                    });
                    
                    fromTower = null;
                    return;
                }
                
                fromTower.element.classList.remove('teleport-source');
                
                document.querySelectorAll('.tower').forEach(t => {
                    t.classList.remove('teleport-target-ready');
                });
                
                fromTower.element.classList.add('teleporting');
                toTower.element.classList.add('teleporting');
                
                this.towerGame.useTeleportItem(fromTower, toTower);
                
                const towers = document.querySelectorAll('.tower');
                towers.forEach(t => {
                    t.removeEventListener('click', towerClickHandler);
                });
                
                this.teleportMode = false;
                
                document.getElementById('message').textContent = '传送完成！';
                setTimeout(() => {
                    document.getElementById('message').textContent = '';
                    
                    fromTower.element.classList.remove('teleporting');
                    toTower.element.classList.remove('teleporting');
                }, 2000);
                
                playSound('teleport');
            }
        };
        
        const towers = document.querySelectorAll('.tower');
        towers.forEach(tower => {
            tower.addEventListener('click', towerClickHandler);
        });
    }
    
    // 激活护盾（供道具使用）
    activateShield() {
        this.shieldActive = true;
        document.getElementById('message').textContent = '护盾已激活！下次时间耗尽时将免于游戏结束。';
        setTimeout(() => document.getElementById('message').textContent = '', 3000);
    }
    
    // 显示提示（供道具使用）
    showHint() {
        this.towerGame.showHint();
    }
    
    // 自动移动（供道具使用）
    autoMove() {
        const move = this.towerGame.getNextOptimalMove();
        if (move) {
            const fromTower = this.towerGame.towers[move.from];
            const toTower = this.towerGame.towers[move.to];
            
            fromTower.highlight();
            
            setTimeout(() => {
                this.towerGame.moveDisc(fromTower, toTower);
            }, 500);
        } else {
            document.getElementById('message').textContent = '无法完成自动移动。';
            setTimeout(() => document.getElementById('message').textContent = '', 2000);
        }
    }
    
    // 返回主菜单
    returnToMenu() {
        this.showStartScreen();
    }
    
    // 显示排行榜
    showLeaderboard() {
        this.leaderboard.displayLeaderboard();
        this.showScreen('leaderboard');
    }
    
    // 显示教程
    showTutorial() {
        this.showScreen('tutorial');
    }
    
    // 显示开始屏幕
    showStartScreen() {
        this.showScreen('start');
    }
    
    // 切换屏幕显示
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.style.display = 'none';
            screen.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].style.display = 'flex';
            this.screens[screenName].classList.add('active');
            
            if (screenName === 'levelComplete') {
                this.screens[screenName].style.zIndex = '50';
            } else if (screenName === 'pause') {
                this.screens[screenName].style.zIndex = '40';
            } else if (screenName === 'gameOver') {
                this.screens[screenName].style.zIndex = '30';
            } else {
                this.screens[screenName].style.zIndex = '10';
            }
        }
    }
    
    // 重置游戏状态
    reset() {
        this.score = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.teleportMode = false;
        this.shieldActive = false;
        this.itemsCollected = 0;
        this.lastMoveTime = 0;
        this.moveSequence = 0;
        
        document.getElementById('score').textContent = '0';
        
        this.towerGame.reset();
        this.timer.stopTimer();
        this.levelSystem.reset();
        this.itemSystem.reset();
        this.effectsSystem.clearAllEffects();
    }
    
    // 处理时间祝福效果
    onTimeBlessing(bonusSeconds) {
        this.timer.addTime(bonusSeconds);
        
        const timerElement = document.getElementById('timer');
        const rect = timerElement.getBoundingClientRect();
        
        const pulse = document.createElement('div');
        pulse.className = 'time-blessing-pulse';
        pulse.style.left = `${rect.left + rect.width / 2}px`;
        pulse.style.top = `${rect.top + rect.height / 2}px`;
        document.body.appendChild(pulse);
        
        setTimeout(() => {
            if (pulse.parentNode) {
                pulse.parentNode.removeChild(pulse);
            }
        }, 1000);
        
        const bonusText = document.createElement('div');
        bonusText.textContent = `+${bonusSeconds}s`;
        bonusText.style.position = 'absolute';
        bonusText.style.left = `${rect.left + rect.width / 2}px`;
        bonusText.style.top = `${rect.top - 10}px`;
        bonusText.style.transform = 'translate(-50%, -50%)';
        bonusText.style.color = '#2ecc71';
        bonusText.style.fontWeight = 'bold';
        bonusText.style.zIndex = '100';
        bonusText.style.animation = 'float-up 1.5s forwards';
        document.body.appendChild(bonusText);
        
        setTimeout(() => {
            if (bonusText.parentNode) {
                bonusText.parentNode.removeChild(bonusText);
            }
        }, 1500);
    }
    
    // 开始测试关卡 - 重构版本，使用通用关卡加载函数
    startTestLevel(testConfig, blessing, curse) {
        console.log('开始测试关卡准备...');
        
        // 1. 规范化并验证配置
        const normalizedConfig = this.normalizeTestLevelConfig(testConfig);
        
        // 2. 重置游戏状态
        this.reset();
        
        // 3. 显示游戏屏幕
        this.showScreen('game');
        
        // 4. 如果提供了单独的祝福和诅咒参数，且配置中没有变种效果，则加入到配置中
        if (blessing && (!normalizedConfig.variation.blessings || !normalizedConfig.variation.blessings.length)) {
            normalizedConfig.variation.blessings = [blessing];
        }
        
        if (curse && (!normalizedConfig.variation.curses || !normalizedConfig.variation.curses.length)) {
            normalizedConfig.variation.curses = [curse];
        }
        
        // 5. 使用通用关卡加载函数，传递测试模式标志
        this.loadLevel(normalizedConfig, true);
        
        console.log('测试关卡已启动', normalizedConfig);
    }
    
    // 为测试关卡设置特殊的关卡完成处理程序
    setupTestLevelCompletionHandler() {
        // 保存原有的事件处理程序（如果有）
        const originalLevelCompletedHandler = document.listeners?.levelCompleted?.[0];
        
        if (originalLevelCompletedHandler) {
            document.removeEventListener('levelCompleted', originalLevelCompletedHandler);
        }
        
        // 创建测试关卡特有的完成处理程序
        const testLevelCompletedHandler = (e) => {
            this.timer.stopTimer();
            this.cleanupAllEffects(); // 使用统一的清理函数
            
            // 显示完成消息
            document.getElementById('message').textContent = '测试关卡完成！';
            
            // 播放完成音效
            playSound('level_complete');
            
            // 延迟返回主菜单
            setTimeout(() => {
                this.showStartScreen();
                document.getElementById('message').textContent = '';
                
                // 恢复原有事件监听
                document.removeEventListener('levelCompleted', testLevelCompletedHandler);
                if (originalLevelCompletedHandler) {
                    document.addEventListener('levelCompleted', originalLevelCompletedHandler);
                }
            }, 2000);
        };
        
        // 注册事件处理程序
        document.addEventListener('levelCompleted', testLevelCompletedHandler);
        
        // 存储新的处理程序，便于后续引用
        if (!document.listeners) document.listeners = {};
        document.listeners.levelCompleted = [testLevelCompletedHandler];
    }
    
    // 标准化并验证测试关卡配置，确保包含所有必要的选项
    normalizeTestLevelConfig(testConfig) {
        console.log('规范化测试关卡配置...');
        
        // 创建一个基础配置模板，包含所有可能的配置选项及其默认值
        const defaultConfig = {
            level: 0, // 测试关卡默认为第0关
            discCount: 3, // 默认3个圆盘
            moveLimit: 7, // 默认7步移动上限
            timeLimit: 120, // 默认120秒时间限制
            towerCount: 3, // 默认3个塔
            treasureLevel: false, // 直接在顶层设置是否为宝藏关卡
            specialConfig: {
                treasureLevel: false, // 同时在 specialConfig 中也保留一份
                dualTargets: false, // 是否为双目标关卡
                specialDisc: false, // 是否有特殊圆盘
                discSizeMultiplier: 1, // 圆盘大小倍数
                invisibleDiscs: false, // 是否有隐形圆盘
                specialLayout: false, // 是否有特殊布局
                layoutType: 'standard', // 布局类型：standard或circular
                towerHeightMultiplier: 1, // 塔高度倍数
                colorEnhancement: false, // 是否增强颜色对比度
                initialHints: 0, // 初始提示次数
                isTutorial: false // 是否为教程关卡
            },
            specialEventName: '测试关卡', // 特殊事件名称
            variation: {
                blessings: [], // 祝福效果列表
                curses: [] // 诅咒效果列表
            }
        };
        
        // 合并用户提供的配置和默认配置
        const normalizedConfig = {
            ...defaultConfig,
            ...testConfig
        };
        
        // 确保specialConfig存在并合并其属性
        normalizedConfig.specialConfig = {
            ...defaultConfig.specialConfig,
            ...(testConfig.specialConfig || {})
        };
        
        // 修复：确保 treasureLevel 属性在两个位置都正确设置
        if (testConfig.specialConfig && testConfig.specialConfig.treasureLevel) {
            normalizedConfig.treasureLevel = true;
            normalizedConfig.specialConfig.treasureLevel = true;
        }
        
        // 确保variation存在并合并其属性
        normalizedConfig.variation = {
            ...defaultConfig.variation,
            ...(testConfig.variation || {})
        };
        
        // 确保blessings和curses是数组
        if (!Array.isArray(normalizedConfig.variation.blessings)) {
            normalizedConfig.variation.blessings = [];
        }
        
        if (!Array.isArray(normalizedConfig.variation.curses)) {
            normalizedConfig.variation.curses = [];
        }
        
        // 检查配置合法性并调整，比如确保圆盘数量、移动限制等是正数
        normalizedConfig.discCount = Math.max(1, normalizedConfig.discCount || 0);
        normalizedConfig.moveLimit = Math.max(1, normalizedConfig.moveLimit || 0);
        normalizedConfig.timeLimit = Math.max(10, normalizedConfig.timeLimit || 0);
        normalizedConfig.towerCount = Math.max(3, normalizedConfig.towerCount || 0);
        
        // 确保关卡号是整数
        normalizedConfig.level = Math.floor(normalizedConfig.level || 0);
        
        // 确保特殊关卡配置项和变种效果配置项是正确的类型
        Object.keys(normalizedConfig.specialConfig).forEach(key => {
            if (typeof defaultConfig.specialConfig[key] === 'boolean') {
                normalizedConfig.specialConfig[key] = Boolean(normalizedConfig.specialConfig[key]);
            } else if (typeof defaultConfig.specialConfig[key] === 'number') {
                normalizedConfig.specialConfig[key] = Number(normalizedConfig.specialConfig[key] || defaultConfig.specialConfig[key]);
            }
        });
        
        console.log('规范化后的配置:', normalizedConfig);
        return normalizedConfig;
    }
    
    // 获取游戏支持的所有祝福和诅咒的列表
    getSupportedEffects() {
        // 获取游戏支持的所有祝福
        const supportedBlessings = [
            {
                id: "时间祝福",
                name: "时间祝福",
                description: "每次移动增加1秒",
                icon: "⏱️"
            },
            {
                id: "清晰祝福",
                name: "清晰祝福",
                description: "提示概率增加30%",
                icon: "👁️"
            },
            {
                id: "幸运祝福",
                name: "幸运祝福",
                description: "道具掉落率提高20%",
                icon: "🍀"
            },
            {
                id: "重置祝福",
                name: "重置祝福",
                description: "添加一次重置布局的机会",
                icon: "🔄"
            }
        ];
        
        // 获取游戏支持的所有诅咒
        const supportedCurses = [
            {
                id: "迷雾诅咒",
                name: "迷雾诅咒",
                description: "视野受阻，UI元素模糊",
                icon: "🌫️"
            },
            {
                id: "迷失诅咒",
                name: "迷失诅咒",
                description: "塔的位置会轻微随机移动",
                icon: "🌀"
            },
            {
                id: "迟缓诅咒",
                name: "迟缓诅咒",
                description: "移动动画变慢",
                icon: "🐢"
            },
            {
                id: "晕眩诅咒",
                name: "晕眩诅咒",
                description: "圆盘颜色混乱",
                icon: "💫"
            }
        ];
        
        return { supportedBlessings, supportedCurses };
    }
    
    // 尝试加载游戏进度
    loadProgress() {
        // 首先加载关卡系统进度
        const levelProgressLoaded = this.levelSystem.loadProgress();
        
        // 然后尝试加载游戏状态
        try {
            const gameState = getFromLocalStorage('hanoiRogueLikeGameState');
            
            if (gameState) {
                this.score = gameState.score || 0;
                this.levelCompletionStreak = gameState.levelCompletionStreak || 0;
                this.itemsCollected = gameState.itemsCollected || 0;
                
                // 更新UI
                document.getElementById('score').textContent = this.score.toLocaleString();
                
                if (this.levelSystem.debugEnabled) {
                    console.log('游戏状态已加载', gameState);
                    console.log('上次保存时间:', new Date(gameState.saveDate).toLocaleString());
                }
                
                return true;
            }
        } catch (e) {
            console.error('加载游戏状态失败:', e);
        }
        
        return levelProgressLoaded;
    }
    
    // 保存游戏进度
    saveProgress() {
        // 保存关卡系统的进度
        this.levelSystem.saveProgress();
        
        // 保存当前游戏状态
        const gameState = {
            score: this.score,
            levelCompletionStreak: this.levelCompletionStreak,
            itemsCollected: this.itemsCollected,
            saveDate: new Date().toISOString()
        };
        
        saveToLocalStorage('hanoiRogueLikeGameState', gameState);
        
        if (this.levelSystem.debugEnabled) {
            console.log('游戏状态已保存', gameState);
        }
        
        return true;
    }
    
    // 全局清理所有效果和样式
    cleanupAllEffects() {
        console.log('执行全局效果清理...');
        
        // 1. 清理效果系统中的所有效果
        this.effectsSystem.clearAllEffects();
        
        // 2. 清除特殊关卡样式
        document.getElementById('game-screen').classList.remove('treasure-level');
        
        // 3. 移除DOM元素上的特殊类
        // 移除迷雾效果
        const fogOverlay = document.querySelector('.fog-overlay');
        if (fogOverlay && fogOverlay.parentNode) {
            fogOverlay.parentNode.removeChild(fogOverlay);
        }
        
        // 移除模糊效果
        document.querySelectorAll('.foggy').forEach(elem => {
            elem.classList.remove('foggy');
        });
        
        // 移除摇晃效果
        document.querySelectorAll('.wobble-tower').forEach(elem => {
            elem.classList.remove('wobble-tower');
        });
        
        // 移除传送效果
        document.querySelectorAll('.teleport-target-ready, .teleport-source, .teleporting').forEach(elem => {
            elem.classList.remove('teleport-target-ready', 'teleport-source', 'teleporting');
        });
        
        // 4. 重置CSS变量
        document.documentElement.style.removeProperty('--disc-move-speed');
        document.documentElement.style.removeProperty('--disc-transition');
        
        // 5. 移除临时创建的消息元素
        const specialEventMsg = document.getElementById('special-event-message');
        if (specialEventMsg && specialEventMsg.parentNode) {
            specialEventMsg.parentNode.removeChild(specialEventMsg);
        }
        
        // 6. 重置游戏对象中的效果相关标志
        this.teleportMode = false;
        
        // 7. 重置塔游戏中的效果相关属性
        if (this.towerGame) {
            this.towerGame.hasBlessingTimeBonus = false;
            this.towerGame.hintChanceBonus = 0;
            this.towerGame.itemChanceBonus = 0;
        }
        
        console.log('全局效果清理完成');
    }
}