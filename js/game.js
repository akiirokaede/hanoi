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
                
            case "智慧祝福":
                this.effectsSystem.addEffect({
                    id: `blessing-wisdom-${Date.now()}`,
                    type: 'blessing',
                    name: '智慧祝福',
                    description: '每5秒自动显示一次提示',
                    duration: blessingDuration,
                    icon: '🧠',
                    intervalId: null,
                    onStart: (game) => {
                        // 创建一个每5秒自动触发提示的定时器
                        this.intervalId = setInterval(() => {
                            // 只有在游戏进行中且未暂停时才显示提示
                            if (game.isPlaying && !game.isPaused && !game.levelCompleted) {
                                game.towerGame.showHint();
                            }
                        }, 5000);
                        
                        // 显示提示消息
                        const message = document.getElementById('message');
                        message.textContent = '智慧祝福生效！每5秒将自动显示提示。';
                        message.classList.add('blessing-message');
                        setTimeout(() => {
                            message.classList.remove('blessing-message');
                            setTimeout(() => {
                                if (message.textContent.includes('智慧祝福')) {
                                    message.textContent = '';
                                }
                            }, 1000);
                        }, 3000);
                    },
                    onEnd: (game) => {
                        // 清除定时器
                        if (this.intervalId) {
                            clearInterval(this.intervalId);
                            this.intervalId = null;
                        }
                        
                        // 显示提示消息
                        const message = document.getElementById('message');
                        message.textContent = '智慧祝福已结束！';
                        message.classList.add('blessing-message');
                        setTimeout(() => {
                            message.classList.remove('blessing-message');
                            setTimeout(() => {
                                if (message.textContent.includes('已结束')) {
                                    message.textContent = '';
                                }
                            }, 1000);
                        }, 2000);
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
                
            case "重置祝福":
                this.effectsSystem.addEffect({
                    id: `blessing-reset-${Date.now()}`,
                    type: 'blessing',
                    name: '重置祝福',
                    description: '添加一次重置布局的机会',
                    duration: blessingDuration,
                    icon: '🔄',
                    onStart: (game) => {
                        // 调用塔游戏的重置按钮添加方法
                        game.towerGame.addResetButton();
                        
                        // 显示提示消息
                        const message = document.getElementById('message');
                        message.textContent = '获得重置祝福！现在可以重置一次圆盘布局。';
                        message.classList.add('blessing-message');
                        setTimeout(() => {
                            message.classList.remove('blessing-message');
                            setTimeout(() => {
                                if (message.textContent.includes('获得重置祝福')) {
                                    message.textContent = '';
                                }
                            }, 1000);
                        }, 3000);
                    },
                    onEnd: (game) => {
                        // 重置祝福结束时不需要特殊处理，因为按钮使用后自动禁用
                        // 如果按钮还没被使用，将保持可用
                        const resetButton = document.getElementById('reset-button');
                        if (resetButton && !resetButton.disabled) {
                            resetButton.title = '重置祝福已过期，但最后一次机会仍然可用';
                        }
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
                    description: '随机覆盖一座塔，让人看不清圆盘',
                    duration: curseDuration,
                    icon: '🌫️',
                    onStart: (game) => {
                        // 初始化迷雾诅咒的状态
                        game.fogCurseState = {
                            lastChangeTime: Date.now(),
                            coverInterval: 20000, // 每20秒切换一次被覆盖的塔
                            coveredTowerIndex: -1, // 初始无覆盖
                            fogElements: {}
                        };
                        
                        // 立即应用第一次迷雾效果
                        this.applyFogToRandomTower(game);
                        
                        // 显示提示消息
                        const message = document.getElementById('message');
                        message.textContent = '迷雾诅咒生效！一座塔被迷雾覆盖！';
                        message.classList.add('curse-message');
                        setTimeout(() => {
                            message.classList.remove('curse-message');
                            setTimeout(() => {
                                if (message.textContent.includes('迷雾诅咒')) {
                                    message.textContent = '';
                                }
                            }, 1000);
                        }, 3000);
                    },
                    onTick: (game) => {
                        // 检查是否需要切换被覆盖的塔
                        const now = Date.now();
                        if (now - game.fogCurseState.lastChangeTime >= game.fogCurseState.coverInterval) {
                            // 移除当前迷雾效果
                            this.removeFogFromTower(game);
                            
                            // 应用新的迷雾效果到随机塔
                            this.applyFogToRandomTower(game);
                            
                            // 更新上次切换时间
                            game.fogCurseState.lastChangeTime = now;
                            
                            // 播放迷雾切换音效
                            playSound('move');
                            
                            // 简短的信息提示
                            const message = document.getElementById('message');
                            message.textContent = '迷雾移动了！';
                            message.classList.add('curse-message');
                            setTimeout(() => {
                                message.classList.remove('curse-message');
                                message.textContent = '';
                            }, 1500);
                        }
                    },
                    onEnd: (game) => {
                        // 移除所有迷雾效果
                        this.removeFogFromTower(game);
                        
                        // 清理状态
                        delete game.fogCurseState;
                        
                        // 显示提示消息
                        const message = document.getElementById('message');
                        message.textContent = '迷雾诅咒已结束！';
                        message.classList.add('blessing-message');
                        setTimeout(() => {
                            message.classList.remove('blessing-message');
                            setTimeout(() => {
                                if (message.textContent.includes('诅咒已结束')) {
                                    message.textContent = '';
                                }
                            }, 1000);
                        }, 2000);
                    }
                });
                break;
                
            case "迷失诅咒":
                this.effectsSystem.addEffect({
                    id: `curse-wander-${Date.now()}`,
                    type: 'curse',
                    name: '迷失诅咒',
                    description: '塔和道具的位置会随机交换',
                    duration: curseDuration,
                    icon: '🌀',
                    onStart: (game) => {
                        // 保存原始塔座位置信息
                        game.wanderCurseState = {
                            originalPositions: [],
                            lastSwapTime: Date.now(),
                            swapInterval: 8000, // 每8秒交换一次位置
                            originalItemPositions: [],
                            itemsSwapped: false
                        };
                        
                        // 保存所有塔座的原始位置
                        game.towerGame.towers.forEach((tower, index) => {
                            const rect = tower.element.getBoundingClientRect();
                            const style = window.getComputedStyle(tower.element);
                            
                            game.wanderCurseState.originalPositions.push({
                                index: index,
                                element: tower.element,
                                position: {
                                    left: style.left,
                                    top: style.top,
                                    transform: style.transform
                                }
                            });
                        });
                        
                        // 立即执行第一次位置交换
                        this.swapTowerPositions(game);
                        
                        // 随机交换道具栏位置
                        this.swapItemPositions(game);
                        
                        // 显示提示消息
                        const message = document.getElementById('message');
                        message.textContent = '迷失诅咒生效！塔和道具的位置发生了交换。';
                        message.classList.add('curse-message');
                        setTimeout(() => {
                            message.classList.remove('curse-message');
                            setTimeout(() => {
                                if (message.textContent.includes('迷失诅咒')) {
                                    message.textContent = '';
                                }
                            }, 1000);
                        }, 3000);
                    },
                    onTick: (game) => {
                        // 检查是否需要再次交换位置
                        const now = Date.now();
                        if (now - game.wanderCurseState.lastSwapTime >= game.wanderCurseState.swapInterval) {
                            // 交换塔座位置
                            this.swapTowerPositions(game);
                            
                            // 交换道具位置
                            this.swapItemPositions(game);
                            
                            // 更新上次交换时间
                            game.wanderCurseState.lastSwapTime = now;
                            
                            // 播放交换音效
                            playSound('move');
                            
                            // 简短的信息提示
                            const message = document.getElementById('message');
                            message.textContent = '位置又发生了变化！';
                            message.classList.add('curse-message');
                            setTimeout(() => {
                                message.classList.remove('curse-message');
                                message.textContent = '';
                            }, 1500);
                        }
                    },
                    onEnd: (game) => {
                        console.log('迷失诅咒结束，开始恢复塔和道具位置到原始状态...');
                        
                        // 恢复塔对象在逻辑数组中的顺序
                        if (game.wanderCurseState && game.wanderCurseState.towerSwaps) {
                            // 按照逆序恢复所有交换操作，确保正确还原初始状态
                            for (let i = game.wanderCurseState.towerSwaps.length - 1; i >= 0; i--) {
                                const swap = game.wanderCurseState.towerSwaps[i];
                                
                                // 获取需要恢复的塔索引
                                const index1 = swap.index1;
                                const index2 = swap.index2;
                                
                                console.log(`正在恢复塔对象交换: 塔${index1+1}和塔${index2+1}`);
                                
                                // 交换塔对象在游戏逻辑数组中的位置，撤销之前的交换
                                const temp = game.towerGame.towers[index1];
                                game.towerGame.towers[index1] = game.towerGame.towers[index2];
                                game.towerGame.towers[index2] = temp;
                            }
                        }
                        
                        // 恢复塔座的DOM元素顺序
                        const towerContainer = document.getElementById('towers-container');
                        if (towerContainer && game.wanderCurseState) {
                            console.log('恢复塔DOM元素的原始顺序');
                            
                            // 按照原始顺序重新排列塔DOM元素
                            game.towerGame.towers.forEach((tower, index) => {
                                // 添加过渡动画
                                tower.element.style.transition = 'all 0.8s ease-in-out';
                                
                                // 添加到容器末尾会按正确顺序重排
                                towerContainer.appendChild(tower.element);
                            });
                            
                            // 显示塔恢复位置动画
                            game.towerGame.towers.forEach(tower => {
                                const flash = document.createElement('div');
                                flash.className = 'restore-flash';
                                flash.style.position = 'absolute';
                                flash.style.top = '0';
                                flash.style.left = '0';
                                flash.style.width = '100%';
                                flash.style.height = '100%';
                                flash.style.borderRadius = '10px';
                                flash.style.pointerEvents = 'none';
                                flash.style.zIndex = '999';
                                flash.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)';
                                flash.style.animation = 'restore-flash 1s ease-out';
                                
                                tower.element.appendChild(flash);
                                
                                // 动画结束后移除
                                setTimeout(() => {
                                    if (flash.parentNode) {
                                        flash.parentNode.removeChild(flash);
                                    }
                                }, 1000);
                            });
                            
                            // 添加恢复闪光动画样式
                            if (!document.getElementById('restore-flash-style')) {
                                const style = document.createElement('style');
                                style.id = 'restore-flash-style';
                                style.textContent = `
                                    @keyframes restore-flash {
                                        0% { opacity: 1; }
                                        100% { opacity: 0; }
                                    }
                                `;
                                document.head.appendChild(style);
                            }
                        }
                        
                        // 恢复道具栏DOM元素顺序
                        const itemsContainer = document.getElementById('items-list');
                        if (itemsContainer && game.wanderCurseState && game.wanderCurseState.itemsSwapped) {
                            console.log('恢复道具DOM元素的原始顺序');
                            
                            // 获取所有道具元素
                            const itemElements = Array.from(itemsContainer.querySelectorAll('.item'));
                            
                            // 保存道具元素的原始顺序（如果没有保存过）
                            if (!game.wanderCurseState.originalItemOrder) {
                                game.wanderCurseState.originalItemOrder = [];
                                itemElements.forEach((item, index) => {
                                    // 使用data属性保存原始索引
                                    game.wanderCurseState.originalItemOrder.push({
                                        id: item.id || `item-${index}`,
                                        index: index
                                    });
                                    
                                    // 确保每个元素有ID
                                    if (!item.id) {
                                        item.id = `item-${index}`;
                                    }
                                });
                            }
                            
                            // 创建原始顺序映射
                            const originalOrderMap = {};
                            game.wanderCurseState.originalItemOrder.forEach(info => {
                                originalOrderMap[info.id] = info.index;
                            });
                            
                            // 按原始顺序排序并追加到容器
                            itemElements
                                .sort((a, b) => {
                                    const indexA = originalOrderMap[a.id] || 0;
                                    const indexB = originalOrderMap[b.id] || 0;
                                    return indexA - indexB;
                                })
                                .forEach(item => {
                                    // 添加过渡动画
                                    item.style.transition = 'all 0.5s ease-in-out';
                                    itemsContainer.appendChild(item);
                                    
                                    // 添加恢复动画效果
                                    item.classList.add('item-restoring');
                                    setTimeout(() => {
                                        item.classList.remove('item-restoring');
                                    }, 800);
                                });
                            
                            // 添加恢复动画样式
                            if (!document.getElementById('item-restore-style')) {
                                const style = document.createElement('style');
                                style.id = 'item-restore-style';
                                style.textContent = `
                                    .item-restoring {
                                        box-shadow: 0 0 15px rgba(0, 255, 255, 0.8) !important;
                                        transform: scale(1.05) !important;
                                    }
                                `;
                                document.head.appendChild(style);
                            }
                        }
                        
                        // 移除所有塔的摇晃效果
                        document.querySelectorAll('.wobble-tower').forEach(tower => {
                            tower.classList.remove('wobble-tower');
                        });
                        
                        // 清理状态
                        delete game.wanderCurseState;
                        
                        // 显示提示消息
                        const message = document.getElementById('message');
                        message.textContent = '迷失诅咒已结束！塔和道具位置已恢复正常。';
                        message.classList.add('blessing-message');
                        setTimeout(() => {
                            message.classList.remove('blessing-message');
                            setTimeout(() => {
                                if (message.textContent.includes('诅咒已结束')) {
                                    message.textContent = '';
                                }
                            }, 1000);
                        }, 2000);
                        
                        console.log('塔和道具位置恢复完成');
                    }
                });
                break;
                
            case "迟缓诅咒":
                this.effectsSystem.addEffect({
                    id: `curse-slow-${Date.now()}`,
                    type: 'curse',
                    name: '迟缓诅咒',
                    description: '移动动画变慢',
                    duration: curseDuration,
                    icon: '🐢',
                    onStart: (game) => {
                        // 应用慢速动画效果
                        document.documentElement.style.setProperty('--disc-move-speed', '1.5s');
                        document.documentElement.style.setProperty('--disc-transition', 'all 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)');
                        
                        // 显示提示消息
                        const message = document.getElementById('message');
                        message.textContent = '迟缓诅咒生效！圆盘移动变慢了。';
                        message.classList.add('curse-message');
                        setTimeout(() => {
                            message.classList.remove('curse-message');
                            setTimeout(() => {
                                if (message.textContent.includes('迟缓诅咒')) {
                                    message.textContent = '';
                                }
                            }, 1000);
                        }, 3000);
                    },
                    onEnd: (game) => {
                        // 恢复正常动画速度
                        document.documentElement.style.removeProperty('--disc-move-speed');
                        document.documentElement.style.removeProperty('--disc-transition');
                        
                        // 显示提示消息
                        const message = document.getElementById('message');
                        message.textContent = '迟缓诅咒已结束！';
                        message.classList.add('blessing-message');
                        setTimeout(() => {
                            message.classList.remove('blessing-message');
                            setTimeout(() => {
                                if (message.textContent.includes('诅咒已结束')) {
                                    message.textContent = '';
                                }
                            }, 1000);
                        }, 2000);
                    }
                });
                break;
                
            case "晕眩诅咒":
                this.effectsSystem.addEffect({
                    id: `curse-dizzy-${Date.now()}`,
                    type: 'curse',
                    name: '晕眩诅咒',
                    description: '圆盘颜色混乱',
                    duration: curseDuration,
                    icon: '💫',
                    onStart: (game) => {
                        // 应用晕眩效果到圆盘
                        game.towerGame.applyDizzinessToDiscs();
                        
                        // 创建晕眩诅咒的全屏遮罩层
                        this.createDizzinessOverlay(game);
                        
                        // 显示提示消息
                        const message = document.getElementById('message');
                        message.textContent = '晕眩诅咒生效！圆盘颜色开始变化。';
                        message.classList.add('curse-message');
                        setTimeout(() => {
                            message.classList.remove('curse-message');
                            setTimeout(() => {
                                if (message.textContent.includes('晕眩诅咒')) {
                                    message.textContent = '';
                                }
                            }, 1000);
                        }, 3000);
                    },
                    onTick: (game) => {
                        // 随机改变一些圆盘的色调和宽度
                        if (Math.random() < 0.1) {
                            game.towerGame.discs.forEach(disc => {
                                if (disc.element.classList.contains('dizzy') && Math.random() < 0.3) {
                                    const hue = Math.floor(Math.random() * 360);
                                    disc.element.style.backgroundColor = `hsl(${hue}, 80%, 60%)`;
                                    
                                    // 随机缩放圆盘宽度（不超过原始宽度）
                                    const originalWidth = parseFloat(disc.element.dataset.originalWidth || disc.element.style.width);
                                    const scaleRatio = 0.8 + Math.random() * 0.2; // 缩放比例在80%到100%之间
                                    
                                    // 添加丝滑的过渡效果
                                    if (!disc.element.style.transition.includes('width')) {
                                        disc.element.style.transition = `${disc.element.style.transition}, width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)`;
                                    }
                                    
                                    disc.element.style.width = `${originalWidth * scaleRatio}%`;
                                    
                                    // 为每个圆盘添加独立的宽度脉动动画
                                    if (!disc.widthPulseInterval) {
                                        disc.widthPulseInterval = setInterval(() => {
                                            if (disc.element && disc.element.parentNode) {
                                                const pulseRatio = 0.85 + Math.random() * 0.15;
                                                disc.element.style.width = `${originalWidth * pulseRatio}%`;
                                            } else {
                                                // 如果圆盘不再存在，清除间隔
                                                clearInterval(disc.widthPulseInterval);
                                                disc.widthPulseInterval = null;
                                            }
                                        }, 800 + Math.random() * 400); // 每0.8-1.2秒变化一次
                                    }
                                }
                            });
                            
                            // 更新遮罩层效果
                            this.updateDizzinessOverlay();
                        }
                    },
                    onEnd: (game) => {
                        // 移除所有圆盘的晕眩效果
                        game.towerGame.discs.forEach(disc => {
                            disc.removeDizziness();
                            
                            // 恢复原始颜色
                            const hue = (disc.size / game.towerGame.discCount) * 360;
                            disc.element.style.backgroundColor = `hsl(${hue}, 80%, 60%)`;
                            
                            // 恢复原始宽度
                            if (disc.element.dataset.originalWidth) {
                                disc.element.style.width = `${disc.element.dataset.originalWidth}%`;
                            }
                            
                            // 清除宽度脉动计时器以停止宽度变化
                            if (disc.widthPulseInterval) {
                                clearInterval(disc.widthPulseInterval);
                                disc.widthPulseInterval = null;
                            }
                        });
                        
                        // 移除遮罩层
                        this.removeDizzinessOverlay();
                        
                        // 显示提示消息
                        const message = document.getElementById('message');
                        message.textContent = '晕眩诅咒已结束！';
                        message.classList.add('blessing-message');
                        setTimeout(() => {
                            message.classList.remove('blessing-message');
                            setTimeout(() => {
                                if (message.textContent.includes('诅咒已结束')) {
                                    message.textContent = '';
                                }
                            }, 1000);
                        }, 2000);
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
    showHint(forceShow = false) {
        this.towerGame.showHint(forceShow);
    }
    
    // 自动移动（供道具使用）
    autoMove() {
        this.towerGame.autoMove();
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
                id: "智慧祝福",
                name: "智慧祝福",
                description: "每5秒自动显示一次提示",
                icon: "🧠"
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
                description: "随机覆盖一座塔，让人看不清圆盘",
                icon: "🌫️"
            },
            {
                id: "迷失诅咒",
                name: "迷失诅咒",
                description: "塔和道具的位置会随机交换",
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
                duration: curseDuration,
                icon: "💫",
                onStart: (game) => {
                    // 应用晕眩效果到圆盘
                    game.towerGame.applyDizzinessToDiscs();
                    
                    // 创建晕眩诅咒的全屏遮罩层
                    this.createDizzinessOverlay(game);
                    
                    // 显示提示消息
                    const message = document.getElementById('message');
                    message.textContent = '晕眩诅咒生效！圆盘颜色开始变化。';
                    message.classList.add('curse-message');
                    setTimeout(() => {
                        message.classList.remove('curse-message');
                        setTimeout(() => {
                            if (message.textContent.includes('晕眩诅咒')) {
                                message.textContent = '';
                            }
                        }, 1000);
                    }, 3000);
                },
                onTick: (game) => {
                    // 随机改变一些圆盘的色调和宽度
                    if (Math.random() < 0.1) {
                        game.towerGame.discs.forEach(disc => {
                            if (disc.element.classList.contains('dizzy') && Math.random() < 0.3) {
                                const hue = Math.floor(Math.random() * 360);
                                disc.element.style.backgroundColor = `hsl(${hue}, 80%, 60%)`;
                                
                                // 随机缩放圆盘宽度（不超过原始宽度）
                                const originalWidth = parseFloat(disc.element.dataset.originalWidth || disc.element.style.width);
                                const scaleRatio = 0.8 + Math.random() * 0.2; // 缩放比例在80%到100%之间
                                
                                // 添加丝滑的过渡效果
                                if (!disc.element.style.transition.includes('width')) {
                                    disc.element.style.transition = `${disc.element.style.transition}, width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)`;
                                }
                                
                                disc.element.style.width = `${originalWidth * scaleRatio}%`;
                                
                                // 为每个圆盘添加独立的宽度脉动动画
                                if (!disc.widthPulseInterval) {
                                    disc.widthPulseInterval = setInterval(() => {
                                        if (disc.element && disc.element.parentNode) {
                                            const pulseRatio = 0.85 + Math.random() * 0.15;
                                            disc.element.style.width = `${originalWidth * pulseRatio}%`;
                                        } else {
                                            // 如果圆盘不再存在，清除间隔
                                            clearInterval(disc.widthPulseInterval);
                                            disc.widthPulseInterval = null;
                                        }
                                    }, 800 + Math.random() * 400); // 每0.8-1.2秒变化一次
                                }
                            }
                        });
                        
                        // 更新遮罩层效果
                        this.updateDizzinessOverlay();
                    }
                },
                onEnd: (game) => {
                    // 移除所有圆盘的晕眩效果
                    game.towerGame.discs.forEach(disc => {
                        disc.removeDizziness();
                        
                        // 恢复原始颜色
                        const hue = (disc.size / game.towerGame.discCount) * 360;
                        disc.element.style.backgroundColor = `hsl(${hue}, 80%, 60%)`;
                        
                        // 恢复原始宽度
                        if (disc.element.dataset.originalWidth) {
                            disc.element.style.width = `${disc.element.dataset.originalWidth}%`;
                        }
                        
                        // 清除宽度脉动计时器以停止宽度变化
                        if (disc.widthPulseInterval) {
                            clearInterval(disc.widthPulseInterval);
                            disc.widthPulseInterval = null;
                        }
                    });
                    
                    // 移除遮罩层
                    this.removeDizzinessOverlay();
                    
                    // 显示提示消息
                    const message = document.getElementById('message');
                    message.textContent = '晕眩诅咒已结束！';
                    message.classList.add('blessing-message');
                    setTimeout(() => {
                        message.classList.remove('blessing-message');
                        setTimeout(() => {
                            if (message.textContent.includes('诅咒已结束')) {
                                message.textContent = '';
                            }
                        }, 1000);
                    }, 2000);
                }
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
    
    // 应用迷雾效果到随机塔
    applyFogToRandomTower(game) {
        // 获取塔的总数量
        const towerCount = game.towerGame.towers.length;
        if (towerCount <= 0) return;
        
        // 选择一个随机塔（避免选到当前已覆盖的塔）
        let randomTowerIndex;
        do {
            randomTowerIndex = Math.floor(Math.random() * towerCount);
        } while (randomTowerIndex === game.fogCurseState.coveredTowerIndex);
        
        // 更新被覆盖的塔索引
        game.fogCurseState.coveredTowerIndex = randomTowerIndex;
        
        // 获取选中的塔元素
        const towerElement = game.towerGame.towers[randomTowerIndex].element;
        
        // 创建迷雾覆盖元素 - 使用完全不透明的深色背景
        const fogCover = document.createElement('div');
        fogCover.className = 'tower-fog-cover';
        fogCover.id = `tower-fog-cover-${randomTowerIndex}`;
        fogCover.style.position = 'absolute';
        fogCover.style.top = '0';
        fogCover.style.left = '0';
        fogCover.style.width = '100%';
        fogCover.style.height = '100%';
        fogCover.style.backgroundColor = '#5e6a75'; // 使用不透明的深灰色
        fogCover.style.borderRadius = '10px';
        fogCover.style.zIndex = '999'; // 使用极高的z-index确保覆盖所有内容
        fogCover.style.opacity = '0';
        fogCover.style.transition = 'opacity 1.5s ease-in';
        
        // 添加迷雾图案
        fogCover.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg width=\'100%25\' height=\'100%25\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cfilter id=\'foggy\' x=\'0\' y=\'0\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.01\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type=\'linear\' slope=\'0.2\'/%3E%3CfeFuncG type=\'linear\' slope=\'0.2\'/%3E%3CfeFuncB type=\'linear\' slope=\'0.2\'/%3E%3C/feComponentTransfer%3E%3CfeGaussianBlur stdDeviation=\'5\'/%3E%3C/filter%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23foggy)\'/%3E%3C/svg%3E")';
        fogCover.style.backgroundSize = 'cover';
        
        // 添加一些移动的动画以增强迷雾效果
        fogCover.style.animation = 'fogMovement 20s infinite alternate';
        
        // 添加到塔元素
        towerElement.appendChild(fogCover);
        
        // 存储对迷雾元素的引用
        game.fogCurseState.fogElements[randomTowerIndex] = fogCover;
        
        // 触发重排
        void fogCover.offsetWidth;
        
        // 淡入迷雾效果
        fogCover.style.opacity = '1'; // 几乎完全不透明
        
        // 添加粒子效果
        if (window.createParticleEffect) {
            const rect = towerElement.getBoundingClientRect();
            const x = rect.left + rect.width / 2 - document.querySelector('.game-area').getBoundingClientRect().left;
            const y = rect.top + rect.height / 2 - document.querySelector('.game-area').getBoundingClientRect().top;
            window.createParticleEffect('curse', x, y);
        }
        
        // 添加迷雾飘动效果
        const fogAnimation = document.createElement('style');
        fogAnimation.textContent = `
            @keyframes fogMovement {
                0% { background-position: 0% 0%; }
                25% { background-position: 20% 10%; }
                50% { background-position: 10% 20%; }
                75% { background-position: -10% 10%; }
                100% { background-position: 0% 0%; }
            }
        `;
        document.head.appendChild(fogAnimation);
    }
    
    // 移除塔上的迷雾效果
    removeFogFromTower(game) {
        const coveredTowerIndex = game.fogCurseState.coveredTowerIndex;
        if (coveredTowerIndex < 0) return;
        
        const fogElement = game.fogCurseState.fogElements[coveredTowerIndex];
        if (!fogElement) return;
        
        // 淡出动画
        fogElement.style.opacity = '0';
        
        // 一秒后移除元素
        setTimeout(() => {
            if (fogElement.parentNode) {
                fogElement.parentNode.removeChild(fogElement);
            }
            delete game.fogCurseState.fogElements[coveredTowerIndex];
        }, 1000);
        
        // 重置索引
        game.fogCurseState.coveredTowerIndex = -1;
    }
    
    // 创建晕眩诅咒的全屏遮罩层
    createDizzinessOverlay(game) {
        // 先检查是否已经存在遮罩层
        const existingOverlay = document.getElementById('dizziness-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // 创建遮罩层元素
        const overlay = document.createElement('div');
        overlay.id = 'dizziness-overlay';
        overlay.className = 'dizziness-overlay';
        
        // 设置遮罩层样式
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.pointerEvents = 'none'; // 允许点击穿透
        overlay.style.zIndex = '50';
        overlay.style.mixBlendMode = 'color-dodge'; // 混合模式使颜色效果更明显
        overlay.style.opacity = '0.3'; // 初始低不透明度
        overlay.style.background = 'radial-gradient(circle at center, rgba(255,0,0,0.4) 0%, rgba(0,255,255,0.3) 50%, rgba(255,0,255,0.4) 100%)';
        overlay.style.animation = 'dizzy-background 15s infinite alternate';
        overlay.style.transition = 'opacity 0.5s ease-in-out';
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes dizzy-background {
                0% { background-position: 0% 0%; filter: hue-rotate(0deg); }
                25% { background-position: 100% 0%; filter: hue-rotate(90deg);                50% { background-position: 100% 100%; filter: hue-rotate(180deg); }
                75% { background-position: 0% 100%; filter: hue-rotate(270deg); }
                100% { background-position: 0% 0%; filter: hue-rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        // 将遮罩层添加到游戏区域
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.appendChild(overlay);
            
            // 存储原始圆盘宽度，以便后续缩放
            game.towerGame.discs.forEach(disc => {
                if (!disc.element.dataset.originalWidth) {
                    // 提取百分比值，去除%符号
                    const widthStr = disc.element.style.width;
                    const widthValue = parseFloat(widthStr);
                    disc.element.dataset.originalWidth = widthValue;
                }
            });
            
            // 淡入效果
            setTimeout(() => {
                overlay.style.opacity = '0.6';
            }, 10);
        }
    }
    
    // 更新晕眩诅咒遮罩层效果
    updateDizzinessOverlay() {
        const overlay = document.getElementById('dizziness-overlay');
        if (overlay) {
            // 随机改变遮罩层的色调和透明度
            const hueRotate = Math.floor(Math.random() * 360);
            const opacity = 0.4 + Math.random() * 0.3; // 透明度在0.4-0.7之间变化
            
            overlay.style.filter = `hue-rotate(${hueRotate}deg)`;
            overlay.style.opacity = opacity.toString();
            
            // 随机改变背景位置，增加晕眩感
            const posX = Math.floor(Math.random() * 100);
            const posY = Math.floor(Math.random() * 100);
            overlay.style.backgroundPosition = `${posX}% ${posY}%`;
        }
    }
    
    // 移除晕眩诅咒遮罩层
    removeDizzinessOverlay() {
        const overlay = document.getElementById('dizziness-overlay');
        if (overlay) {
            // 淡出效果
            overlay.style.opacity = '0';
            
            // 动画结束后移除元素
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 500);
        }
    }
    
    // 交换塔座的位置
    swapTowerPositions(game) {
        // 确保有保存原始位置信息的状态
        if (!game.wanderCurseState || !game.wanderCurseState.originalPositions) {
            console.error('无法交换塔座位置：原始位置信息不存在');
            return;
        }
        
        console.log('开始交换塔座位置');
        
        // 获取塔容器元素
        const towerContainer = document.getElementById('towers-container');
        if (!towerContainer) {
            console.error('找不到塔容器：towers-container');
            return;
        }
        
        // 随机确定要交换的两座塔（必须确保真正交换了位置）
        let tower1Index, tower2Index;
        do {
            tower1Index = Math.floor(Math.random() * game.towerGame.towers.length);
            tower2Index = Math.floor(Math.random() * game.towerGame.towers.length);
        } while (tower1Index === tower2Index);
        
        // 获取要交换的两个塔对象及其DOM元素
        const tower1 = game.towerGame.towers[tower1Index];
        const tower2 = game.towerGame.towers[tower2Index];
        const element1 = tower1.element;
        const element2 = tower2.element;
        
        // 获取元素在DOM中的位置
        const parent = element1.parentNode;
        const nextSibling = element2.nextSibling;
        
        // 实际交换DOM元素（这会使子元素一起移动）
        parent.insertBefore(element2, element1);
        if (nextSibling) {
            parent.insertBefore(element1, nextSibling);
        } else {
            parent.appendChild(element1);
        }
        
        // 更新游戏逻辑中的塔对象顺序（这是关键修复点）
        game.towerGame.towers[tower1Index] = tower2;
        game.towerGame.towers[tower2Index] = tower1;
        
        // 更新塔的引用关系并记录交换信息以便恢复
        if (!game.wanderCurseState.towerSwaps) {
            game.wanderCurseState.towerSwaps = [];
        }
        
        // 记录本次交换，用于诅咒结束时恢复
        game.wanderCurseState.towerSwaps.push({
            index1: tower1Index,
            index2: tower2Index
        });
        
        // 应用晃动效果
        element1.classList.add('wobble-tower');
        element2.classList.add('wobble-tower');
        
        // 为交换添加视觉提示
        this.addSwapVisualHint([element1, element2]);
        
        console.log(`已交换塔${tower1Index+1}和塔${tower2Index+1}的位置`);
    }

    // 为交换添加视觉提示效果
    addSwapVisualHint(elements) {
        elements.forEach(element => {
            // 添加闪光效果
            const flash = document.createElement('div');
            flash.className = 'swap-flash-effect';
            flash.style.position = 'absolute';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
            flash.style.borderRadius = '10px';
            flash.style.pointerEvents = 'none';
            flash.style.zIndex = '999';
            flash.style.opacity = '0.8';
            flash.style.animation = 'swap-flash 0.8s ease-out';
            
            element.appendChild(flash);
            
            // 动画结束后移除闪光元素
            setTimeout(() => {
                if (flash.parentNode) {
                    flash.parentNode.removeChild(flash);
                }
            }, 800);
        });
        
        // 添加闪光动画样式
        if (!document.getElementById('swap-flash-style')) {
            const style = document.createElement('style');
            style.id = 'swap-flash-style';
            style.textContent = `
                @keyframes swap-flash {
                    0% { opacity: 0.8; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 交换道具栏中道具的位置
    swapItemPositions(game) {
        console.log('开始交换道具位置');
        
        // 获取道具栏容器
        const itemsContainer = document.getElementById('items-list');
        if (!itemsContainer) {
            console.error('找不到道具容器元素: #items-list');
            return;
        }
        
        // 获取道具元素
        const itemElements = Array.from(itemsContainer.querySelectorAll('.item'));
        if (itemElements.length <= 1) {
            console.log('道具数量不足，不执行交换');
            return; // 只有0或1个道具时不需要交换
        }
        
        console.log(`找到${itemElements.length}个道具元素`);
        
        // 第一次交换前，保存所有道具的原始顺序
        if (!game.wanderCurseState.originalItemOrder) {
            game.wanderCurseState.originalItemOrder = [];
            itemElements.forEach((item, index) => {
                // 确保每个元素都有唯一ID
                if (!item.id) {
                    item.id = `item-${index}-${Date.now()}`;
                }
                
                // 保存原始顺序信息
                game.wanderCurseState.originalItemOrder.push({
                    id: item.id,
                    index: index
                });
                
                console.log(`保存道具 ${item.id} 的原始位置: ${index}`);
            });
        }
        
        // 随机选择两个道具交换（确保真正的交换）
        let item1Index, item2Index;
        do {
            item1Index = Math.floor(Math.random() * itemElements.length);
            item2Index = Math.floor(Math.random() * itemElements.length);
        } while (item1Index === item2Index);
        
        // 获取要交换的两个DOM元素
        const item1 = itemElements[item1Index];
        const item2 = itemElements[item2Index];
        
        // 获取元素在DOM中的位置
        const parent = item1.parentNode;
        const nextSibling = item2.nextSibling;
        
        // 实际交换DOM元素位置
        parent.insertBefore(item2, item1);
        if (nextSibling) {
            parent.insertBefore(item1, nextSibling);
        } else {
            parent.appendChild(item1);
        }
        
        // 添加闪烁效果
        item1.classList.add('item-swapping');
        item2.classList.add('item-swapping');
        
        // 延时移除闪烁效果
        setTimeout(() => {
            item1.classList.remove('item-swapping');
            item2.classList.remove('item-swapping');
        }, 800);
        
        // 添加闪烁动画样式
        if (!document.getElementById('item-swap-style')) {
            const style = document.createElement('style');
            style.id = 'item-swap-style';
            style.textContent = `
                .item-swapping {
                    box-shadow: 0 0 15px rgba(255, 165, 0, 0.8) !important;
                    transform: scale(1.1) !important;
                    z-index: 10 !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 显示提示消息
        const message = document.getElementById('message');
        if (message) {
            message.textContent = '道具位置发生了变化！';
            message.classList.add('curse-message');
            setTimeout(() => {
                message.classList.remove('curse-message');
                if (message.textContent === '道具位置发生了变化！') {
                    message.textContent = '';
                }
            }, 2000);
        }
        
        console.log(`已交换道具${item1Index+1}和道具${item2Index+1}的位置`);
        
        // 标记道具已被交换
        game.wanderCurseState.itemsSwapped = true;
    }
}