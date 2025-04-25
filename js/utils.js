/**
 * 工具函数集合
 */

// 在指定范围内生成随机整数
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 格式化时间 (秒) 为 mm:ss 格式
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Fisher-Yates 洗牌算法
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 判断概率
function chance(percentage) {
    return Math.random() * 100 < percentage;
}

// 动画效果 - 使用 requestAnimationFrame
function animateCSS(element, animation, duration = 500) {
    return new Promise((resolve) => {
        const node = document.querySelector(element);
        node.style.animation = `${animation} ${duration}ms`;

        function handleAnimationEnd() {
            node.style.animation = '';
            node.removeEventListener('animationend', handleAnimationEnd);
            resolve();
        }

        node.addEventListener('animationend', handleAnimationEnd);
    });
}

// 创建带有表情符号的道具图标
function createItemIcon(emoji, backgroundColor = '#2ecc71') {
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    // 增加图标尺寸
    ctx.beginPath();
    ctx.arc(25, 25, 22, 0, Math.PI * 2);
    ctx.fillStyle = backgroundColor;
    ctx.fill();
    
    // 添加边框使图标更清晰
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.stroke();
    
    // 调整emoji大小和位置
    ctx.font = '26px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 25, 25);
    
    return canvas.toDataURL();
}

// 检查是否为首次访问
function isFirstVisit() {
    const hasPlayedBefore = getFromLocalStorage('hasPlayedBefore');
    if (!hasPlayedBefore) {
        saveToLocalStorage('hasPlayedBefore', true);
        return true;
    }
    return false;
}

// 保存数据到本地存储
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('无法保存数据到本地存储:', e);
        return false;
    }
}

// 从本地存储获取数据
function getFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('无法从本地存储获取数据:', e);
        return null;
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 播放音效
function playSound(soundName) {
    try {
        // 如果浏览器不支持 Audio 对象，提供一个空函数
        if (!window.Audio) {
            console.warn('当前浏览器不支持 Audio API');
            return;
        }
        
        const audio = new Audio(`sounds/${soundName}.mp3`);
        audio.volume = 0.5;  // 设置音量为 50%
        audio.play().catch(err => {
            // 忽略自动播放策略错误，不影响游戏运行
            console.warn('播放声音失败:', err);
        });
    } catch (e) {
        console.error('播放声音出错:', e);
        // 即使声音播放失败，也不应该影响游戏运行
    }
}

// 增强版音效播放函数
function playEnhancedSound(soundName, options = {}) {
    try {
        if (!window.Audio) {
            console.warn('当前浏览器不支持 Audio API');
            return;
        }
        
        const audio = new Audio(`sounds/${soundName}.mp3`);
        
        // 应用音量设置
        audio.volume = options.volume !== undefined ? options.volume : 0.5;
        
        // 应用播放速率
        if (options.playbackRate) {
            audio.playbackRate = options.playbackRate;
        }
        
        // 应用延迟播放
        if (options.delay) {
            setTimeout(() => {
                audio.play().catch(err => {
                    console.warn('播放声音失败:', err);
                });
            }, options.delay);
        } else {
            audio.play().catch(err => {
                console.warn('播放声音失败:', err);
            });
        }
        
        // 应用音频处理效果（如果浏览器支持）
        if (window.AudioContext || window.webkitAudioContext) {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioCtx.createMediaElementSource(audio);
                
                if (options.filterFrequency) {
                    const filter = audioCtx.createBiquadFilter();
                    filter.type = options.filterType || 'lowpass';
                    filter.frequency.value = options.filterFrequency;
                    source.connect(filter);
                    filter.connect(audioCtx.destination);
                } else {
                    source.connect(audioCtx.destination);
                }
            } catch (e) {
                console.warn('无法应用音频效果:', e);
                // 如果音频上下文创建失败，继续常规播放
            }
        }
        
        // 如果需要循环播放
        if (options.loop) {
            audio.loop = true;
        }
        
        return audio; // 返回音频对象以允许外部控制
    } catch (e) {
        console.error('播放增强音效出错:', e);
        // 即使声音播放失败，也不影响游戏运行
        return null;
    }
}

// 特殊事件音效播放函数
function playSpecialEventSound(eventType) {
    switch (eventType) {
        case 'blessing':
            // 祝福音效：明亮的音调
            playEnhancedSound('item', { 
                playbackRate: 1.2,
                volume: 0.6
            });
            break;
            
        case 'curse':
            // 诅咒音效：低沉的音调
            playEnhancedSound('error', {
                playbackRate: 0.8,
                volume: 0.7,
                filterFrequency: 800,
                filterType: 'lowpass'
            });
            break;
            
        case 'specialEvent':
            // 特殊事件音效：独特的音调
            playEnhancedSound('item_found', {
                volume: 0.7
            });
            break;
            
        case 'specialDisc':
            // 特大圆盘音效
            playEnhancedSound('move', {
                playbackRate: 0.7,
                volume: 0.8
            });
            break;
            
        case 'invisibleDisc':
            // 隐形圆盘闪烁音效
            playEnhancedSound('select', {
                playbackRate: 1.5,
                volume: 0.3
            });
            break;
            
        case 'dualTarget':
            // 双目标完成音效
            playEnhancedSound('complete', {
                playbackRate: 1.2,
                volume: 0.6
            });
            break;
            
        case 'timeBlessingEffect':
            // 时间祝福效果音
            playEnhancedSound('select', {
                playbackRate: 1.5,
                volume: 0.4,
                filterFrequency: 3000,
                filterType: 'highpass'
            });
            break;
            
        case 'fogCurse':
            // 迷雾诅咒环境音效
            return playEnhancedSound('error', {
                playbackRate: 0.5,
                volume: 0.2,
                loop: true,
                filterFrequency: 500,
                filterType: 'lowpass'
            });
            
        case 'treasureFound':
            // 宝藏关卡音效
            playEnhancedSound('item_found', {
                playbackRate: 1.1,
                volume: 0.8
            });
            break;
    }
}

// 播放提示音效
function playHintSound() {
    playEnhancedSound('hint', {
        volume: 0.6,
        playbackRate: 1.2
    });
}

// 播放错误音效
function playErrorSound() {
    playEnhancedSound('error', {
        volume: 0.5,
        playbackRate: 0.9
    });
}

/**
 * 祝福和诅咒效果管理系统
 */
class EffectsSystem {
    constructor(game) {
        this.game = game;
        this.effects = new Map(); // 存储当前活跃的效果
        this.container = document.getElementById('effects-container');
    }
    
    // 添加新的效果
    addEffect(effect) {
        const { id, type, name, description, duration, icon, onStart, onTick, onEnd } = effect;
        
        // 如果已存在同ID的效果，先移除它
        if (this.effects.has(id)) {
            this.removeEffect(id);
        }
        
        // 创建效果记录
        const effectRecord = {
            id,
            type, // 'blessing' 或 'curse'
            name,
            description,
            duration, // 持续时间（秒）
            icon,
            startTime: Date.now(),
            endTime: Date.now() + duration * 1000,
            onTick, // 每次心跳执行的函数
            onEnd, // 效果结束时执行的函数
            element: null // DOM元素引用
        };
        
        // 添加到效果列表
        this.effects.set(id, effectRecord);
        
        // 创建视觉指示器
        this.createEffectIndicator(effectRecord);
        
        // 执行开始回调
        if (onStart) onStart(this.game);
        
        // 播放音效
        if (type === 'blessing') {
            playSound('item');
        } else {
            playSound('error');
        }
        
        // 返回生成的效果对象，以便外部可以引用
        return effectRecord;
    }
    
    // 创建效果视觉指示器
    createEffectIndicator(effect) {
        // 创建效果指示器元素
        const indicatorElement = document.createElement('div');
        indicatorElement.className = `effect-indicator ${effect.type}`;
        indicatorElement.id = `effect-${effect.id}`;
        
        // 创建图标
        const iconElement = document.createElement('div');
        iconElement.className = 'effect-icon';
        
        // 根据效果类型设置图标内容
        if (effect.icon) {
            iconElement.innerHTML = effect.icon;
        } else {
            iconElement.innerHTML = effect.type === 'blessing' ? '✨' : '☠️';
        }
        
        // 创建效果详情区域
        const detailsElement = document.createElement('div');
        detailsElement.className = 'effect-details';
        
        // 添加效果名称
        const nameElement = document.createElement('div');
        nameElement.className = 'effect-name';
        nameElement.textContent = effect.name;
        detailsElement.appendChild(nameElement);
        
        // 添加效果描述
        const descElement = document.createElement('div');
        descElement.className = 'effect-description';
        descElement.textContent = effect.description;
        detailsElement.appendChild(descElement);
        
        // 添加计时器
        const timerElement = document.createElement('div');
        timerElement.className = 'effect-timer';
        timerElement.style.animationDuration = `${effect.duration}s`;
        detailsElement.appendChild(timerElement);
        
        // 组装所有元素
        indicatorElement.appendChild(iconElement);
        indicatorElement.appendChild(detailsElement);
        
        // 添加到容器
        this.container.appendChild(indicatorElement);
        
        // 保存DOM引用
        effect.element = indicatorElement;
        
        // 设置动画
        if (effect.type === 'blessing') {
            indicatorElement.style.animation = 'glow-green 2s infinite alternate';
        } else {
            indicatorElement.style.animation = 'glow-red 2s infinite alternate';
        }
        
        // 添加淡入动画
        indicatorElement.style.opacity = '0';
        indicatorElement.style.transform = 'translateY(20px)';
        
        // 触发重绘
        void indicatorElement.offsetWidth;
        
        // 应用过渡
        indicatorElement.style.transition = 'all 0.5s ease-out';
        indicatorElement.style.opacity = '1';
        indicatorElement.style.transform = 'translateY(0)';
        
        // 设置自动移除
        setTimeout(() => {
            this.removeEffect(effect.id);
        }, effect.duration * 1000);
    }
    
    // 移除效果
    removeEffect(id) {
        if (!this.effects.has(id)) return;
        
        try {
            const effect = this.effects.get(id);
            
            // 执行结束回调
            if (effect.onEnd) {
                try {
                    effect.onEnd(this.game);
                } catch (error) {
                    console.error(`执行效果 ${id} 的 onEnd 回调时出错:`, error);
                    // 捕获错误但不中断游戏流程
                }
            }
            
            // 视觉指示器优雅消失
            if (effect.element) {
                try {
                    effect.element.style.opacity = '0';
                    effect.element.style.transform = 'translateY(20px)';
                    
                    // 等待动画完成后删除元素
                    setTimeout(() => {
                        try {
                            if (effect.element && effect.element.parentNode) {
                                effect.element.parentNode.removeChild(effect.element);
                            }
                        } catch (err) {
                            console.warn('移除效果元素时出错:', err);
                            // 捕获错误但不中断游戏流程
                        }
                    }, 500);
                } catch (err) {
                    console.warn('设置效果元素样式时出错:', err);
                    // 尝试直接移除元素
                    try {
                        if (effect.element && effect.element.parentNode) {
                            effect.element.parentNode.removeChild(effect.element);
                        }
                    } catch (removeErr) {
                        console.error('无法移除效果元素:', removeErr);
                    }
                }
            }
            
            // 从效果列表移除
            this.effects.delete(id);
        } catch (error) {
            console.error(`移除效果 ${id} 时出错:`, error);
            // 确保即使出错也从列表中移除
            this.effects.delete(id);
        }
    }
    
    // 检查效果是否存在
    hasEffect(id) {
        return this.effects.has(id);
    }
    
    // 获取效果的剩余时间（秒）
    getEffectTimeRemaining(id) {
        if (!this.effects.has(id)) return 0;
        
        const effect = this.effects.get(id);
        const remainingMs = Math.max(0, effect.endTime - Date.now());
        return remainingMs / 1000;
    }
    
    // 更新所有效果
    update() {
        const now = Date.now();
        
        // 检查过期的效果
        for (const [id, effect] of this.effects.entries()) {
            // 如果效果已过期，移除它
            if (now >= effect.endTime) {
                this.removeEffect(id);
                continue;
            }
            
            // 执行tick回调
            if (effect.onTick) effect.onTick(this.game);
        }
    }
    
    // 清除所有效果
    clearAllEffects() {
        for (const id of this.effects.keys()) {
            this.removeEffect(id);
        }
    }
    
    // 获取所有激活的祝福
    getActiveBlessings() {
        return Array.from(this.effects.values())
            .filter(effect => effect.type === 'blessing');
    }
    
    // 获取所有激活的诅咒
    getActiveCurses() {
        return Array.from(this.effects.values())
            .filter(effect => effect.type === 'curse');
    }
}