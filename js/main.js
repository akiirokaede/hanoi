/**
 * 汉诺塔Roguelike游戏入口文件
 * 初始化游戏实例并启动游戏
 */

// 当DOM加载完成后执行游戏初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化游戏实例
    const gameInstance = new HanoiRoguelike();
    
    // 在控制台提供游戏实例引用，便于调试
    window.hanoiGame = gameInstance;
    
    // 添加特殊事件消息容器
    const gameHeader = document.querySelector('.game-header');
    if (gameHeader && !document.getElementById('special-event-message')) {
        const specialEventMsg = document.createElement('div');
        specialEventMsg.id = 'special-event-message';
        specialEventMsg.className = 'special-event-message';
        gameHeader.appendChild(specialEventMsg);
    }
    
    // 初始化游戏视觉效果
    initVisualEffects();
    
    console.log("汉诺塔Roguelike游戏已初始化");
});

// 初始化视觉效果系统
function initVisualEffects() {
    // 创建CSS变量以便JS动态控制效果参数
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        :root {
            --disc-move-speed: 0.5s;
            --disc-transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            --wobble-intensity: 1;
            --path-opacity: 0.5;
            --path-width: 2px;
        }
        
        @keyframes float-up {
            0% { transform: translate(-50%, -50%); opacity: 1; }
            100% { transform: translate(-50%, -150%); opacity: 0; }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .time-warning {
            color: #e74c3c !important;
            animation: shake 0.5s infinite;
        }
    `;
    document.head.appendChild(styleElement);
    
    // 监听窗口大小变化，调整游戏UI布局
    window.addEventListener('resize', debounce(() => {
        // 重新计算所有圆盘位置，确保正确显示
        if (window.hanoiGame && window.hanoiGame.towerGame) {
            window.hanoiGame.towerGame.towers.forEach(tower => {
                tower.discs.forEach((disc, index) => {
                    disc.setPosition(index, tower.element.offsetHeight);
                });
            });
        }
    }, 250));
    
    // 初始化游戏界面的简单粒子系统
    initParticleSystem();
}

// 创建简单的粒子效果系统
function initParticleSystem() {
    // 添加粒子容器
    const gameArea = document.querySelector('.game-area');
    if (!gameArea) return;
    
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    particleContainer.style.position = 'absolute';
    particleContainer.style.top = '0';
    particleContainer.style.left = '0';
    particleContainer.style.width = '100%';
    particleContainer.style.height = '100%';
    particleContainer.style.pointerEvents = 'none';
    particleContainer.style.zIndex = '2';
    particleContainer.style.overflow = 'hidden';
    
    gameArea.appendChild(particleContainer);
    
    // 为特殊事件预定义粒子效果
    window.createParticleEffect = (type, x, y) => {
        const colors = {
            blessing: ['#2ecc71', '#27ae60', '#a2feb0'],
            curse: ['#e74c3c', '#c0392b', '#ff8674'],
            treasure: ['#f1c40f', '#f39c12', '#ffdb70'],
            teleport: ['#9b59b6', '#8e44ad', '#c893e3']
        };
        
        const particleCount = type === 'treasure' ? 25 : 15;
        const selectedColors = colors[type] || colors.blessing;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            
            // 设置基础样式
            particle.style.position = 'absolute';
            particle.style.width = `${Math.random() * 8 + 4}px`;
            particle.style.height = particle.style.width;
            particle.style.backgroundColor = selectedColors[Math.floor(Math.random() * selectedColors.length)];
            particle.style.borderRadius = '50%';
            particle.style.opacity = Math.random() * 0.5 + 0.5;
            particle.style.pointerEvents = 'none';
            
            // 设置初始位置
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            
            // 添加到容器
            particleContainer.appendChild(particle);
            
            // 设置动画
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const duration = Math.random() * 1000 + 1000;
            
            particle.style.transition = `all ${duration}ms ease-out`;
            
            // 触发重绘
            void particle.offsetWidth;
            
            // 开始运动
            particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
            particle.style.opacity = '0';
            
            // 移除粒子
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, duration);
        }
    };
}