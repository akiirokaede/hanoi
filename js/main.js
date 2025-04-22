/**
 * 游戏主初始化脚本
 */

// 当DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    const game = new HanoiRoguelike();
    
    // 显示开始屏幕
    game.showStartScreen();
    
    // 检查是否支持Web Audio API，如果不支持，提供静默版本的声音函数
    if (!window.AudioContext && !window.webkitAudioContext) {
        console.warn('当前浏览器不支持Web Audio API，将禁用声音效果。');
        window.playSound = () => {}; // 提供空函数
    }
    
    // 创建简单的音频预加载（如果有声音资源可用）
    function preloadAudio() {
        try {
            const audioFiles = [
                'move', 'select', 'deselect', 'error', 
                'complete', 'level_complete', 'game_over',
                'item', 'item_found', 'teleport', 'shield',
                'score_submit'
            ];
            
            for (const file of audioFiles) {
                const audio = new Audio();
                audio.src = `sounds/${file}.mp3`;
                audio.preload = 'auto';
            }
        } catch (e) {
            console.error('音频预加载失败:', e);
        }
    }
    
    // 尝试预加载音频（可选）
    // preloadAudio();
    
    // 调整响应式布局
    function handleResize() {
        const container = document.querySelector('.container');
        if (window.innerHeight < 700) {
            container.classList.add('compact-layout');
        } else {
            container.classList.remove('compact-layout');
        }
    }
    
    // 初始调整和监听窗口大小变化
    handleResize();
    window.addEventListener('resize', handleResize);
});