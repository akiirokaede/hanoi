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