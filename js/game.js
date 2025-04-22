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
        
        // 从关卡系统获取新关卡设置
        const levelConfig = this.levelSystem.generateNextLevel();
        
        // 调试输出 - 确认关卡配置已正确生成
        console.log("生成关卡配置:", levelConfig);
        
        // 更新UI显示
        document.getElementById('level-number').textContent = levelConfig.level;
        document.getElementById('moves-goal').textContent = levelConfig.moveLimit;
        
        // 设置塔游戏 - 更新以支持动态塔数量
        this.towerGame.setLevel(
            levelConfig.discCount, 
            levelConfig.moveLimit, 
            levelConfig.towerCount || 3 // 确保有默认值
        );
        
        // 设置并启动计时器
        this.timer.setTimer(levelConfig.timeLimit, () => this.onTimeUp());
        this.timer.startTimer();
        
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
        // 如果护盾处于激活状态，消耗护盾并继续游戏
        if (this.shieldActive) {
            this.shieldActive = false;
            this.timer.addTime(60); // 额外给予60秒
            document.getElementById('message').textContent = '护盾保护了你！获得额外时间。';
            setTimeout(() => document.getElementById('message').textContent = '', 3000);
            playSound('shield');
            return;
        }
        
        playSound('game_over');
        this.isPlaying = false;
        this.showGameOverScreen();
    }
    
    // 显示游戏结束屏幕
    showGameOverScreen() {
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-level').textContent = this.levelSystem.getCurrentLevel();
        document.getElementById('items-collected').textContent = this.itemsCollected;
        
        // 检查是否为高分
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
            // 保存玩家名称以便下次使用
            saveToLocalStorage('playerName', playerName);
            
            // 添加分数到排行榜
            this.leaderboard.addScore(playerName, this.score, this.levelSystem.getCurrentLevel());
            
            // 隐藏名称输入框
            document.querySelector('.name-input').style.display = 'none';
            
            playSound('score_submit');
        }
    }
    
    // 显示关卡完成屏幕
    onLevelCompleted(data) {
        // 停止计时器
        this.timer.stopTimer();
        
        const { moveCount, movesGoal } = data;
        const timeLeft = this.timer.getRemainingTime();
        
        // 计算关卡得分
        const scoreData = this.levelSystem.calculateLevelScore(moveCount, timeLeft, movesGoal);
        
        // 如果双倍分数效果激活，应用双倍得分
        if (this.itemSystem.activeEffects.doubleScore) {
            scoreData.totalScore *= 2;
            this.itemSystem.activeEffects.doubleScore = false; // 使用后效果消失
        }
        
        // 更新总分
        this.score += scoreData.totalScore;
        document.getElementById('score').textContent = this.score.toLocaleString();
        
        // 评估玩家表现
        const performance = this.levelSystem.evaluatePerformance(moveCount, timeLeft);
        
        // 生成关卡奖励
        const rewards = this.itemSystem.generateLevelRewards(
            this.levelSystem.getCurrentLevel(),
            performance
        );
        
        // 更新关卡完成屏幕
        document.getElementById('completed-level').textContent = this.levelSystem.getCurrentLevel();
        document.getElementById('used-moves').textContent = moveCount;
        document.getElementById('remaining-time').textContent = formatTime(timeLeft);
        document.getElementById('level-score').textContent = scoreData.totalScore.toLocaleString();
        
        // 显示奖励
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
                
                // 添加到玩家道具
                this.itemSystem.addItem(reward);
                this.itemsCollected++;
            });
        } else {
            const noRewards = document.createElement('p');
            noRewards.textContent = '无奖励';
            rewardsContainer.appendChild(noRewards);
        }
        
        // 重置下一关按钮的事件绑定
        const nextLevelBtn = document.getElementById('next-level-btn');
        if (nextLevelBtn) {
            // 清除所有旧事件
            const newBtn = nextLevelBtn.cloneNode(true);
            if (nextLevelBtn.parentNode) {
                nextLevelBtn.parentNode.replaceChild(newBtn, nextLevelBtn);
            }
            
            // 绑定新的点击事件
            newBtn.addEventListener('click', () => {
                console.log('关卡完成屏幕中的下一关按钮被点击');
                this.startNextLevel();
            });
        }
        
        // 显示关卡完成屏幕
        this.showScreen('levelComplete');
        
        // 确保关卡完成屏幕正确显示
        if (this.screens.levelComplete) {
            // 强制设置样式以确保正确显示
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
            
            // 连续快速移动3次有几率触发道具
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
        document.getElementById('message').textContent = '传送模式已激活！下次移动可无视规则。';
        
        // 等待玩家选择塔
        this.waitForTeleportSelection();
    }
    
    // 等待传送选择
    waitForTeleportSelection() {
        let fromTower = null;
        
        const handleTowerClick = (event) => {
            const towerElement = event.target.closest('.tower');
            if (!towerElement) return;
            
            const towerId = parseInt(towerElement.id.split('-')[1]);
            const tower = this.towerGame.towers[towerId - 1];
            
            if (!fromTower) {
                // 使用传送石
                this.towerGame.useTeleportItem(fromTower, toTower);
                
                // 移除事件监听器
                const towers = document.querySelectorAll('.tower');
                towers.forEach(tower => {
                    tower.removeEventListener('click', handleTowerClick);
                });
                
                this.teleportMode = false;
                document.getElementById('message').textContent = '传送完成！';
                setTimeout(() => document.getElementById('message').textContent = '', 2000);
            }
        };
        
        // 添加一次性点击事件到所有塔
        const towers = document.querySelectorAll('.tower');
        towers.forEach(tower => {
            tower.addEventListener('click', handleTowerClick);
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
        // 先隐藏所有屏幕
        Object.values(this.screens).forEach(screen => {
            screen.style.display = 'none';
            screen.classList.remove('active');
        });
        
        // 显示指定屏幕
        if (this.screens[screenName]) {
            this.screens[screenName].style.display = 'flex';
            this.screens[screenName].classList.add('active');
            
            // 设置不同屏幕的z-index以确保正确的层叠顺序
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
        
        // 重置各子系统
        this.towerGame.reset();
        this.timer.stopTimer();
        this.levelSystem.reset();
        this.itemSystem.reset();
    }
}