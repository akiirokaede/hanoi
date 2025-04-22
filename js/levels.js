/**
 * 关卡生成系统
 * 实现Roguelike风格的随机关卡生成和难易度曲线
 */
class LevelSystem {
    constructor() {
        this.currentLevel = 0;
        this.baseDiscCount = 3; // 初始圆盘数量
        this.baseTimeLimit = 60; // 初始时间限制（秒）
        this.baseMoveLimit = 7; // 初始移动限制
        this.baseTowerCount = 3; // 初始塔座数量
        this.currentConfig = {}; // 当前关卡配置
        
        // 游戏进度修饰符（受到玩家表现影响）
        this.performanceModifier = 0; // 范围 -0.2 到 0.2，影响难度动态调整
        
        // 生成种子可以让玩家重玩特定序列的关卡（roguelike常见功能）
        this.seed = Date.now();
        
        // 玩家生涯统计
        this.playerStats = {
            totalMoves: 0,
            totalLevels: 0,
            bestPerformance: 0,
            preferredTowerCount: 3  // 游戏会学习玩家偏好的塔数
        };
        
        // 调试信息 - 帮助开发者跟踪关卡变化
        this.debugEnabled = true;
        
        // 特殊事件表 - 启发自《Binding of Isaac》和《Hades》等游戏的随机事件系统
        this.specialEvents = [
            {
                name: "特大圆盘挑战",
                chance: 0.15,
                minLevel: 4,
                effect: (config) => {
                    // 添加一个特大号圆盘（比正常大一号）作为挑战
                    config.specialDisc = true;
                    config.discSizeMultiplier = 1.2;
                    return config;
                }
            },
            {
                name: "迷你塔",
                chance: 0.15,
                minLevel: 5,
                effect: (config) => {
                    // 塔身变短，增加视觉挑战
                    config.towerHeightMultiplier = 0.8;
                    return config;
                }
            },
            {
                name: "隐形圆盘",
                chance: 0.1,
                minLevel: 7,
                effect: (config) => {
                    // 部分圆盘会半透明，增加记忆难度
                    config.invisibleDiscs = true;
                    return config;
                }
            },
            {
                name: "双目标",
                chance: 0.12,
                minLevel: 8,
                effect: (config) => {
                    // 随机设置两个目标塔，玩家可以选择任意一个作为目标
                    // 类似于roguelike中的多路径选择
                    if (config.towerCount >= 4) {
                        config.dualTargets = true;
                    }
                    return config;
                }
            },
            {
                name: "宝藏关卡",
                chance: 0.08,
                minLevel: 6,
                effect: (config) => {
                    // 完成时有大量奖励，但难度更高
                    config.treasureLevel = true;
                    config.itemChanceMultiplier = 2.0;
                    config.scoreMultiplier = 1.5;
                    return config;
                }
            }
        ];
        
        // 初始化随机数生成器（使用伪随机算法，可以基于种子复现）
        this.initializeRandomGenerator(this.seed);
    }
    
    // 初始化伪随机数生成器
    initializeRandomGenerator(seed) {
        this.seed = seed;
        this.randSeed = seed;
        
        // 简单的伪随机数生成函数
        this.seededRandom = () => {
            this.randSeed = (this.randSeed * 9301 + 49297) % 233280;
            return this.randSeed / 233280;
        };
    }

    // 生成下一关卡
    generateNextLevel() {
        this.currentLevel++;
        
        // 计算当前关卡的圆盘数量
        let discCount = this.calculateDiscCount();
        
        // 计算当前关卡的塔座数量
        let towerCount = this.calculateTowerCount();
        
        // 计算当前关卡的时间限制和移动限制
        const timeLimit = this.calculateTimeLimit(discCount, towerCount);
        const moveLimit = this.calculateMoveLimit(discCount, towerCount);
        
        // 关卡变化元素
        const variation = this.generateLevelVariation();
        
        // 创建基础配置
        let config = {
            level: this.currentLevel,
            discCount,
            towerCount,
            timeLimit,
            moveLimit,
            variation,
            // 对于非标准汉诺塔（多于3个塔），最优解的步数计算会更复杂
            optimalMoves: towerCount === 3 ? 
                Math.pow(2, discCount) - 1 : 
                Math.floor((Math.pow(2, discCount) - 1) * 0.8)
        };
        
        // 应用随机特殊事件（Roguelike风格）
        config = this.applySpecialEvents(config);
        
        // 存储当前关卡配置
        this.currentConfig = config;
        
        // 输出调试信息
        if (this.debugEnabled) {
            console.log(`生成关卡 ${this.currentLevel}:`, 
                        `圆盘数=${discCount}`, 
                        `塔数=${towerCount}`,
                        `时间限制=${timeLimit}秒`,
                        `移动限制=${moveLimit}步`);
                        
            if (Object.keys(config).some(key => 
                ['specialDisc', 'invisibleDiscs', 'dualTargets', 'treasureLevel'].includes(key) && config[key])) {
                console.log(`特殊事件已触发!`, config);
            }
        }
        
        return this.currentConfig;
    }

    // 应用特殊事件 - 类似Roguelike游戏的随机遭遇
    applySpecialEvents(config) {
        // 如果是每5关的整数倍，跳过特殊事件（作为喘息关卡）
        if (this.currentLevel % 5 === 0) {
            return config;
        }
        
        // 尝试应用特殊事件
        for (const event of this.specialEvents) {
            // 关卡等级检查
            if (this.currentLevel < event.minLevel) continue;
            
            // 概率触发
            // 根据玩家表现动态调整概率（表现好的玩家遇到挑战的概率更高）
            const adjustedChance = event.chance * (1 + this.performanceModifier);
            
            if (this.seededRandom() < adjustedChance) {
                // 应用事件效果
                config = event.effect(config);
                
                // 存储事件名称以便显示
                config.specialEventName = event.name;
                
                // 每个关卡只应用一个特殊事件
                break;
            }
        }
        
        return config;
    }

    // 计算圆盘数量 - 带有随机波动
    calculateDiscCount() {
        // 基础数量，每2关增加1个圆盘
        let baseCount = this.baseDiscCount + Math.floor((this.currentLevel - 1) / 2);
        
        // 在高关卡增长放缓，但仍保持变化
        if (this.currentLevel > 15) {
            baseCount = this.baseDiscCount + 7 + Math.floor((this.currentLevel - 16) / 3);
        }
        
        // 加入随机波动 (-1, 0, +1)
        // 但确保不会低于基础圆盘数或超过最大限制
        if (this.currentLevel > 3) {
            // 基于序列的伪随机数
            const rand = Math.floor(this.seededRandom() * 3) - 1; // -1, 0, or 1
            baseCount += rand;
        }
        
        // 特殊关卡变化（类似于roguelike的特殊楼层）
        if (this.currentLevel % 10 === 0) {
            // 每10关是一个BOSS关卡，有额外圆盘挑战
            baseCount += 1;
        } else if (this.currentLevel % 5 === 0) {
            // 每5关是一个喘息关卡，减少1个圆盘
            baseCount = Math.max(this.baseDiscCount, baseCount - 1);
        }
        
        // 应用表现修饰符
        baseCount += Math.floor(this.performanceModifier * 2);
        
        // 限制最大和最小圆盘数
        return Math.max(this.baseDiscCount, Math.min(baseCount, 12));
    }

    // 计算塔座数量 - 包含更多随机元素
    calculateTowerCount() {
        // 前3关固定为经典的3塔配置（教程关卡）
        if (this.currentLevel <= 3) {
            return this.baseTowerCount;
        }
        
        // 基础概率表 - 每个元素代表对应塔数量的概率权重
        let probabilities = [0, 0, 0, 65, 25, 10, 0]; // 索引对应塔数量: [0, 1, 2, 3, 4, 5, 6]
        
        // 根据关卡层数调整概率
        if (this.currentLevel > 10) {
            probabilities = [0, 0, 0, 55, 30, 15, 0]; // 4塔和5塔概率提升
        }
        
        if (this.currentLevel > 15) {
            probabilities = [0, 0, 0, 45, 35, 15, 5]; // 加入6塔可能性
        }
        
        // 每5关特殊调整（BOSS关和喘息关）
        if (this.currentLevel % 10 === 0) {
            // BOSS关卡，增加更多塔的概率
            probabilities = [0, 0, 0, 30, 40, 20, 10];
        } else if (this.currentLevel % 5 === 0) {
            // 喘息关卡，倾向于3塔或4塔
            probabilities = [0, 0, 0, 70, 30, 0, 0];
        }
        
        // 应用玩家表现和偏好的影响
        // 如果玩家喜欢特定塔数，增加该塔数出现的概率
        const preferredIndex = this.playerStats.preferredTowerCount; 
        if (preferredIndex >= 3 && preferredIndex <= 6) {
            probabilities[preferredIndex] = Math.min(100, probabilities[preferredIndex] * 1.5);
        }
        
        // 基于表现修饰符调整 - 表现好的玩家获得更多高难度的塔配置
        if (this.performanceModifier > 0.1) {
            // 移动一些权重到更高塔数
            const shift = Math.floor(this.performanceModifier * 10);
            probabilities[3] -= shift * 2;
            probabilities[4] += shift;
            probabilities[5] += shift / 2;
            probabilities[6] += shift / 2;
        }
        
        // 确保所有概率都为正数
        probabilities = probabilities.map(p => Math.max(0, p));
        
        // 计算总权重
        const totalWeight = probabilities.reduce((a, b) => a + b, 0);
        
        // 随机选择塔数量
        let random = this.seededRandom() * totalWeight;
        let towerCount = 3; // 默认为3塔
        
        for (let i = 0; i < probabilities.length; i++) {
            if (random < probabilities[i]) {
                towerCount = i;
                break;
            }
            random -= probabilities[i];
        }
        
        return towerCount;
    }

    // 计算时间限制 - 增加更多随机性和事件
    calculateTimeLimit(discCount, towerCount) {
        // 基本时间公式：最优解(2^n-1) * 1.8秒 + 30秒基础时间
        // 多塔情况下给予更多时间
        const towerFactor = 1 + (towerCount - 3) * 0.2; // 每多一个塔增加20%时间
        const optimalMoves = Math.pow(2, discCount) - 1;
        let timeLimit = Math.ceil(optimalMoves * 1.8 * towerFactor) + 30;
        
        // 调整难度曲线
        if (this.currentLevel <= 3) {
            // 前三关给予更多时间作为教程
            timeLimit = Math.ceil(timeLimit * 1.5);
        } else if (this.currentLevel > 10) {
            // 高关卡时间压力增大
            timeLimit = Math.ceil(timeLimit * 0.9);
        }
        
        // 随机波动 - 更大的变化幅度增加重玩不确定性
        // 由原来的±5%增加到±10%
        const fluctuation = Math.floor(timeLimit * 0.1 * (this.seededRandom() * 2 - 1));
        timeLimit += fluctuation;
        
        // 特殊关卡类型的时间修饰
        if (this.currentLevel % 10 === 0) {
            // BOSS关卡减少时间
            timeLimit = Math.ceil(timeLimit * 0.85);
        } else if (this.currentLevel % 5 === 0) {
            // 喘息关卡增加时间
            timeLimit = Math.ceil(timeLimit * 1.2);
        }
        
        // 应用表现修饰符 - 表现好的玩家获得更少时间
        if (this.performanceModifier > 0) {
            timeLimit = Math.ceil(timeLimit * (1 - this.performanceModifier * 0.15));
        } else if (this.performanceModifier < 0) {
            // 表现不佳的玩家获得更多时间
            timeLimit = Math.ceil(timeLimit * (1 - this.performanceModifier * 0.1));
        }
        
        // 最低保证秒数随关卡增加而减少
        const minTime = Math.max(60, 150 - this.currentLevel * 2);
        timeLimit = Math.max(minTime, timeLimit);
        
        return timeLimit;
    }

    // 计算移动限制
    calculateMoveLimit(discCount, towerCount) {
        // 为多塔情况调整移动限制
        // 多塔可以减少移动次数，但我们仍给玩家更宽松的限制
        let optimalMovesEstimate;
        
        if (towerCount === 3) {
            // 标准3塔汉诺塔的最优解
            optimalMovesEstimate = Math.pow(2, discCount) - 1;
        } else {
            // 多塔汉诺塔的最优解估算（实际上多塔可以少很多步）
            // 这是一个简化估算
            optimalMovesEstimate = Math.floor((Math.pow(2, discCount) - 1) * 0.8);
        }
        
        // 基本移动限制：最优解 * 系数
        let moveLimit;
        
        if (this.currentLevel <= 3) {
            // 教程关卡宽松系数
            moveLimit = Math.ceil(optimalMovesEstimate * 2.5);
        } else if (this.currentLevel <= 10) {
            // 中期关卡正常系数
            moveLimit = Math.ceil(optimalMovesEstimate * 2);
        } else {
            // 后期关卡严格系数
            moveLimit = Math.ceil(optimalMovesEstimate * 1.7);
        }
        
        // 保证玩家至少有额外50%的移动次数
        moveLimit = Math.max(moveLimit, Math.ceil(optimalMovesEstimate * 1.5));
        
        // 应用随机波动，增加变化性
        const fluctuation = Math.floor(moveLimit * 0.1 * (this.seededRandom() * 2 - 1));
        moveLimit += fluctuation;
        
        return Math.max(5, moveLimit); // 确保最低有5次移动机会
    }

    // 生成关卡变化元素 - 增加更多Roguelike元素
    generateLevelVariation() {
        // 关卡变化会增加游戏的随机性和重玩价值
        const variations = {
            timeBonus: false,       // 关卡有时间奖励
            moveRestriction: false, // 关卡有特殊移动限制
            itemChance: 0,          // 关卡道具掉率修饰
            specialLayout: false,   // 特殊塔座布局
            curses: [],             // 负面效果（灵感来自《Binding of Isaac》和《Slay the Spire》的诅咒系统）
            blessings: [],          // 正面效果
            challengeMode: false    // 挑战模式（特殊规则）
        };
        
        // 时间奖励
        if (this.currentLevel > 3 && this.seededRandom() < 0.4) {
            variations.timeBonus = true;
        }
        
        // 特殊移动限制
        if (this.currentLevel > 5 && this.seededRandom() < 0.3) {
            variations.moveRestriction = true;
        }
        
        // 道具掉率修饰
        if (this.currentLevel % 5 === 0) {
            // 每5关提高道具掉率
            variations.itemChance = 20;
        } else if (this.currentLevel > 10 && this.seededRandom() < 0.4) {
            // 随机道具率波动
            variations.itemChance = Math.floor(this.seededRandom() * 20);
        }
        
        // 特殊布局（多于3个塔时可能出现）
        if (this.currentConfig.towerCount > 3 && this.seededRandom() < 0.3) {
            variations.specialLayout = true;
        }
        
        // 诅咒系统 - 灵感来自Roguelike游戏
        // 随机负面效果增加挑战性
        if (this.currentLevel > 5 && this.seededRandom() < 0.25) {
            const possibleCurses = [
                "迷雾诅咒",  // 部分UI被遮挡
                "迷失诅咒",  // 塔的位置会轻微随机移动
                "迟缓诅咒",  // 移动动画变慢
                "晕眩诅咒"   // 圆盘颜色混乱
            ];
            
            const curseIndex = Math.floor(this.seededRandom() * possibleCurses.length);
            variations.curses.push(possibleCurses[curseIndex]);
        }
        
        // 祝福系统 - 正面随机效果
        if (this.currentLevel > 3) {
            const blessingChance = 0.2 + Math.max(0, this.performanceModifier); // 表现好的玩家获得更多祝福
            
            if (this.seededRandom() < blessingChance) {
                const possibleBlessings = [
                    "时间祝福",    // 每次移动增加1秒时间
                    "清晰祝福",    // 显示下一步最优解的提示概率增加
                    "幸运祝福",    // 道具掉落率提高
                    "重置祝福"     // 可以重置一次当前布局
                ];
                
                const blessingIndex = Math.floor(this.seededRandom() * possibleBlessings.length);
                variations.blessings.push(possibleBlessings[blessingIndex]);
            }
        }
        
        // 挑战模式 - 特殊规则，增加重玩价值
        if (this.currentLevel > 7 && this.seededRandom() < 0.15) {
            variations.challengeMode = true;
            variations.challengeType = Math.floor(this.seededRandom() * 3); // 不同类型的挑战
        }
        
        return variations;
    }

    // 接收并处理关卡完成后的表现数据，影响后续关卡生成
    processLevelResults(moveCount, timeLeft, success) {
        // 更新玩家统计信息
        this.playerStats.totalMoves += moveCount;
        this.playerStats.totalLevels++;
        
        // 评估当前关卡的表现
        const performanceScore = this.evaluatePerformance(moveCount, timeLeft);
        
        // 更新玩家最佳表现记录
        if (performanceScore > this.playerStats.bestPerformance) {
            this.playerStats.bestPerformance = performanceScore;
        }
        
        // 更新玩家偏好的塔数量
        if (success && this.currentConfig.towerCount) {
            // 玩家成功完成关卡，可能更喜欢这个塔数配置
            const currentPreference = this.playerStats.preferredTowerCount;
            const newTowerCount = this.currentConfig.towerCount;
            
            // 慢慢调整偏好（加权平均）
            this.playerStats.preferredTowerCount = 
                Math.round(currentPreference * 0.8 + newTowerCount * 0.2);
        }
        
        // 动态调整难度 - 根据玩家表现调整后续关卡
        if (performanceScore > 0.8) {
            // 玩家表现优秀，增加难度
            this.performanceModifier = Math.min(0.2, this.performanceModifier + 0.05);
        } else if (performanceScore < 0.4 && !success) {
            // 玩家表现不佳且失败，降低难度
            this.performanceModifier = Math.max(-0.2, this.performanceModifier - 0.05);
        } else {
            // 表现一般，缓慢回归标准难度
            this.performanceModifier *= 0.9;
        }
        
        if (this.debugEnabled) {
            console.log(`关卡${this.currentLevel}表现评分: ${performanceScore.toFixed(2)}`);
            console.log(`难度修饰符更新为: ${this.performanceModifier.toFixed(2)}`);
            console.log(`玩家偏好塔数: ${this.playerStats.preferredTowerCount}`);
        }
    }

    // 生成关卡种子 - 允许玩家分享和重玩相同序列的关卡
    generateSeed() {
        const seed = Math.floor(Math.random() * 1000000);
        this.initializeRandomGenerator(seed);
        return seed;
    }
    
    // 使用特定种子初始化游戏
    useSeed(seed) {
        this.initializeRandomGenerator(seed);
        this.reset();
        return seed;
    }

    // 评估玩家表现
    evaluatePerformance(moveCount, timeLeft) {
        const optimalMoves = this.currentConfig.optimalMoves;
        const moveEfficiency = optimalMoves / moveCount;
        const timeRatio = timeLeft / this.currentConfig.timeLimit;
        
        // 综合评分（0-1）
        let performanceScore = (moveEfficiency * 0.6) + (timeRatio * 0.4);
        
        // 确保评分在0-1之间
        performanceScore = Math.min(1, Math.max(0, performanceScore));
        
        return performanceScore;
    }
    
    // 计算关卡得分
    calculateLevelScore(moveCount, timeLeft, movesGoal) {
        // 基础分数 - 根据关卡难度
        const levelBase = this.currentLevel * 100;
        
        // 移动分数 - 越接近最优解得分越高
        const optimalMoves = this.currentConfig.optimalMoves;
        const moveRatio = Math.min(1, optimalMoves / moveCount);
        const moveBonus = Math.round(moveRatio * 500);
        
        // 时间分数 - 剩余时间越多得分越高
        const timeRatio = timeLeft / this.currentConfig.timeLimit;
        const timeBonus = Math.round(timeRatio * 300);
        
        // 关卡达成奖励 - 完成有限步数内的目标
        let achievementBonus = 0;
        if (moveCount <= movesGoal) {
            achievementBonus = 250;
        }
        
        // 速度奖励 - 如果完成得非常快
        let speedBonus = 0;
        if (timeLeft > this.currentConfig.timeLimit * 0.7) {
            speedBonus = 200;
        }
        
        // 特殊关卡奖励
        let specialBonus = 0;
        if (this.currentConfig.treasureLevel) {
            specialBonus = levelBase; // 宝藏关卡双倍基础分
        } else if (this.currentLevel % 10 === 0) {
            specialBonus = Math.round(levelBase * 0.5); // BOSS关卡加分
        }
        
        // 总分
        const totalScore = levelBase + moveBonus + timeBonus + achievementBonus + speedBonus + specialBonus;
        
        // 返回详细分数信息
        return {
            totalScore,
            breakdown: {
                levelBase,
                moveBonus,
                timeBonus,
                achievementBonus,
                speedBonus,
                specialBonus
            }
        };
    }

    // 重置系统
    reset() {
        this.currentLevel = 0;
        this.currentConfig = {};
    }

    // 获取当前关卡数据
    getCurrentConfig() {
        return this.currentConfig;
    }

    // 获取当前关卡数
    getCurrentLevel() {
        return this.currentLevel;
    }
}