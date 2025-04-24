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
        
        // 游戏状态
        this.score = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.teleportMode = false;
        this.shieldActive = false;
        this.itemsCollected = 0;
        this.lastMoveTime = 0;
        this.moveSequence = 0;
        
        // 初始化道具系统 (在游戏对象之后)
        this.itemSystem = new ItemSystem(this);
        
        // 初始化效果系统
        this.effectsSystem = new EffectsSystem(this); // 新增效果管理系统
        
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
        this.reset();
        this.showScreen('game');
        this.isPlaying = true;
        this.startNextLevel();
    }
    
    // 开始下一关卡
    startNextLevel() {
        // 调试信息
        console.log('开始加载下一关');
        
        // 清除所有特殊关卡效果
        document.getElementById('game-screen').classList.remove('treasure-level');
        
        // 从关卡系统获取新关卡设置
        const levelConfig = this.levelSystem.generateNextLevel();
        
        // 调试输出 - 确认关卡配置已正确生成
        console.log("生成关卡配置:", levelConfig);
        console.log("关卡圆盘数:", levelConfig.discCount);
        console.log("移动上限:", levelConfig.moveLimit);
        console.log("关卡塔数:", levelConfig.towerCount);
        
        // 更新UI显示
        document.getElementById('level-number').textContent = levelConfig.level;
        document.getElementById('moves-goal').textContent = levelConfig.moveLimit;
        
        // 显示特殊事件名称（如果有）
        if (levelConfig.specialEventName) {
            const specialEventMsg = document.getElementById('special-event-message') || 
                (() => {
                    const msg = document.createElement('div');
                    msg.id = 'special-event-message';
                    msg.className = 'special-event-message';
                    // 修复：使用正确的元素选择器，改用'.game-header'替代'.game-info'
                    document.querySelector('.game-header').appendChild(msg);
                    return msg;
                })();
                
            specialEventMsg.textContent = levelConfig.specialEventName;
            specialEventMsg.classList.add('show');
            
            // 5秒后隐藏
            setTimeout(() => {
                specialEventMsg.classList.remove('show');
            }, 5000);
        }
        
        // 设置塔游戏 - 更新以支持动态塔数量和特殊事件配置
        console.log("正在设置塔游戏，传递圆盘数:", levelConfig.discCount);
        this.towerGame.setLevel(
            levelConfig.discCount, 
            levelConfig.moveLimit, 
            levelConfig.towerCount || 3, // 确保有默认值
            levelConfig // 传递完整的关卡配置，包含特殊事件信息
        );
        
        // 设置并启动计时器
        this.timer.setTimer(levelConfig.timeLimit, () => this.onTimeUp());
        this.timer.startTimer();
        
        // 清除之前的效果
        this.effectsSystem.clearAllEffects();
        
        // 应用关卡变化的效果
        if (levelConfig.variation) {
            this.applyVariationEffects(levelConfig.variation);
        }
        
        // 确保游戏状态正确
        this.isPlaying = true; 
        this.isPaused = false;
        
        // 强制隐藏所有其他屏幕并显示游戏屏幕
        Object.values(this.screens).forEach(screen => {
            screen.style.display = 'none';
            screen.classList.remove('active');
        });
        
        this.screens.game.style.display = 'flex';
        this.screens.game.classList.add('active');
        this.screens.game.style.zIndex = '5';
        
        // 监听时间祝福事件
        document.removeEventListener('timeBlessing', this.handleTimeBlessing); // 先移除以避免重复
        this.handleTimeBlessing = (e) => {
            if (e.detail && e.detail.bonusSeconds) {
                this.timer.addTime(e.detail.bonusSeconds);
            }
        };
        document.addEventListener('timeBlessing', this.handleTimeBlessing);
    }
    
    // 应用关卡变化的效果
    applyVariationEffects(variation) {
        // 应用祝福效果到效果系统
        if (variation.blessings && variation.blessings.length > 0) {
            variation.blessings.forEach(blessing => {
                this.applyBlessing(blessing);
            });
        }
        
        // 应用诅咒效果到效果系统
        if (variation.curses && variation.curses.length > 0) {
            variation.curses.forEach(curse => {
                this.applyCurse(curse);
            });
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
        
        const fogOverlay = document.querySelector('.fog-overlay');
        if (fogOverlay && fogOverlay.parentNode) {
            fogOverlay.parentNode.removeChild(fogOverlay);
        }
        
        document.querySelectorAll('.ui-element.foggy').forEach(elem => {
            elem.classList.remove('foggy');
        });
        
        document.querySelectorAll('.wobble-tower').forEach(elem => {
            elem.classList.remove('wobble-tower');
        });
        
        document.documentElement.style.removeProperty('--disc-move-speed');
        document.documentElement.style.removeProperty('--disc-transition');
        
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
        
        const scoreData = this.levelSystem.calculateLevelScore(moveCount, timeLeft, movesGoal);
        
        if (this.itemSystem.activeEffects.doubleScore) {
            scoreData.totalScore *= 2;
            this.itemSystem.activeEffects.doubleScore = false;
        }
        
        this.score += scoreData.totalScore;
        document.getElementById('score').textContent = this.score.toLocaleString();
        
        const performance = this.levelSystem.evaluatePerformance(moveCount, timeLeft);
        
        const rewards = this.itemSystem.generateLevelRewards(
            this.levelSystem.getCurrentLevel(),
            performance
        );
        
        document.getElementById('completed-level').textContent = this.levelSystem.getCurrentLevel();
        document.getElementById('used-moves').textContent = moveCount;
        document.getElementById('remaining-time').textContent = formatTime(timeLeft);
        document.getElementById('level-score').textContent = scoreData.totalScore.toLocaleString();
        
        const rewardsContainer = document.getElementById('rewards-container');
        rewardsContainer.innerHTML = '';
        
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
        
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (nextLevelBtn) {
            const newBtn = nextLevelBtn.cloneNode(true);
            if (nextLevelBtn.parentNode) {
                nextLevelBtn.parentNode.replaceChild(newBtn, nextLevelBtn);
            }
            
            newBtn.addEventListener('click', () => {
                console.log('关卡完成屏幕中的下一关按钮被点击');
                this.startNextLevel();
            });
        }
        
        this.showScreen('levelComplete');
        
        if (this.screens.levelComplete) {
            this.screens.levelComplete.style.display = 'flex';
            this.screens.levelComplete.style.zIndex = '50';
            this.screens.levelComplete.classList.add('active');
        }
        
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
}