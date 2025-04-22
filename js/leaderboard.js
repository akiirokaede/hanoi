/**
 * 排行榜系统
 * 管理游戏的分数排行榜
 */
class LeaderboardSystem {
    constructor() {
        this.leaderboardData = [];
        this.maxEntries = 10; // 排行榜最多显示的条目数
        this.loadFromLocalStorage();
    }

    // 从本地存储加载排行榜数据
    loadFromLocalStorage() {
        const data = getFromLocalStorage('hanoiRoguelikeLeaderboard');
        if (data) {
            this.leaderboardData = data;
        }
    }

    // 保存排行榜数据到本地存储
    saveToLocalStorage() {
        saveToLocalStorage('hanoiRoguelikeLeaderboard', this.leaderboardData);
    }

    // 添加新的排行榜记录
    addScore(name, score, level) {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        
        const newEntry = {
            name: name || '匿名',
            score: score,
            level: level,
            date: dateString
        };
        
        this.leaderboardData.push(newEntry);
        this.sortLeaderboard();
        
        // 如果超过最大条目数，删除多余的
        if (this.leaderboardData.length > this.maxEntries) {
            this.leaderboardData = this.leaderboardData.slice(0, this.maxEntries);
        }
        
        this.saveToLocalStorage();
    }

    // 排序排行榜
    sortLeaderboard() {
        this.leaderboardData.sort((a, b) => b.score - a.score);
    }

    // 获取排行榜数据
    getLeaderboard() {
        return this.leaderboardData;
    }

    // 检查分数是否能上榜
    isHighScore(score) {
        if (this.leaderboardData.length < this.maxEntries) {
            return true;
        }
        
        return score > this.leaderboardData[this.leaderboardData.length - 1].score;
    }

    // 获取分数排名
    getScoreRank(score) {
        for (let i = 0; i < this.leaderboardData.length; i++) {
            if (score > this.leaderboardData[i].score) {
                return i + 1;
            }
        }
        
        return this.leaderboardData.length + 1;
    }

    // 显示排行榜
    displayLeaderboard() {
        const leaderboardBody = document.getElementById('leaderboard-body');
        leaderboardBody.innerHTML = '';
        
        if (this.leaderboardData.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.textContent = '暂无记录';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            leaderboardBody.appendChild(row);
            return;
        }
        
        this.leaderboardData.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // 添加特殊样式
            if (index === 0) row.classList.add('gold');
            if (index === 1) row.classList.add('silver');
            if (index === 2) row.classList.add('bronze');
            
            // 排名
            const rankCell = document.createElement('td');
            if (index < 3) {
                const medalSpan = document.createElement('span');
                medalSpan.className = `rank-medal rank-${index + 1}`;
                medalSpan.textContent = index + 1;
                rankCell.appendChild(medalSpan);
            } else {
                rankCell.textContent = index + 1;
            }
            
            // 名字
            const nameCell = document.createElement('td');
            nameCell.textContent = entry.name;
            
            // 分数
            const scoreCell = document.createElement('td');
            scoreCell.textContent = entry.score.toLocaleString();
            
            // 关卡
            const levelCell = document.createElement('td');
            levelCell.textContent = entry.level;
            
            // 日期
            const dateCell = document.createElement('td');
            dateCell.textContent = entry.date;
            
            row.appendChild(rankCell);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(levelCell);
            row.appendChild(dateCell);
            
            leaderboardBody.appendChild(row);
        });
    }

    // 清空排行榜（仅用于测试）
    clearLeaderboard() {
        this.leaderboardData = [];
        this.saveToLocalStorage();
    }
}