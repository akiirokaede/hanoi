/**
 * 游戏计时器类
 * 管理游戏中的时间限制和显示
 */
class GameTimer {
    constructor() {
        this.timerElement = document.getElementById('timer');
        this.timerInterval = null;
        this.timeLeft = 0;
        this.initialTime = 0;
        this.isPaused = false;
        this.onTimeUp = null;
    }

    // 设置计时器
    setTimer(seconds, onTimeUp = null) {
        this.stopTimer();
        this.timeLeft = seconds;
        this.initialTime = seconds;
        this.onTimeUp = onTimeUp;
        this.updateTimerDisplay();
    }

    // 启动计时器
    startTimer() {
        if (!this.timerInterval && this.timeLeft > 0) {
            this.isPaused = false;
            this.timerInterval = setInterval(() => this.updateTimer(), 1000);
        }
    }

    // 暂停计时器
    pauseTimer() {
        if (this.timerInterval && !this.isPaused) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.isPaused = true;
        }
    }

    // 恢复计时器
    resumeTimer() {
        if (this.isPaused && this.timeLeft > 0) {
            this.isPaused = false;
            this.timerInterval = setInterval(() => this.updateTimer(), 1000);
        }
    }

    // 停止计时器
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isPaused = false;
    }

    // 更新计时器
    updateTimer() {
        if (this.timeLeft > 0) {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            // 时间低于30%时闪烁显示
            if (this.timeLeft <= this.initialTime * 0.3) {
                this.flashTimer();
            }
            
            // 时间到
            if (this.timeLeft === 0) {
                this.stopTimer();
                if (this.onTimeUp && typeof this.onTimeUp === 'function') {
                    this.onTimeUp();
                }
            }
        }
    }

    // 更新计时器显示
    updateTimerDisplay() {
        if (this.timerElement) {
            this.timerElement.textContent = formatTime(this.timeLeft);
        }
    }

    // 添加时间（用于道具效果）
    addTime(seconds) {
        this.timeLeft += seconds;
        this.updateTimerDisplay();
        
        // 显示添加时间的动画效果
        const originalColor = this.timerElement.style.color;
        this.timerElement.style.color = '#2ecc71'; // 绿色
        this.timerElement.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            this.timerElement.style.color = originalColor;
            this.timerElement.style.transform = 'scale(1)';
        }, 1000);
    }

    // 获取剩余时间
    getRemainingTime() {
        return this.timeLeft;
    }

    // 获取已用时间
    getElapsedTime() {
        return this.initialTime - this.timeLeft;
    }

    // 获取时间百分比
    getTimePercentage() {
        return this.timeLeft / this.initialTime;
    }

    // 时间不足时闪烁效果
    flashTimer() {
        if (this.timeLeft % 2 === 0) {
            this.timerElement.style.color = '#e74c3c'; // 红色
        } else {
            this.timerElement.style.color = '#ecf0f1'; // 白色
        }
    }
}