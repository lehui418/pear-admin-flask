/**
 * 移动端工作看板功能
 * 文件路径: static/js/mobile/workboard-main.js
 */

// 当前筛选条件
var currentFilter = 'today';

// 图表数据缓存
var chartDataCache = null;

/**
 * 初始化页面
 */
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadTodoList();
    initCharts();
    initFilterButtons();
});

/**
 * 加载统计数据
 */
function loadStats() {
    // 使用现有的工单列表接口获取统计数据
    fetch('/system/ticket/table?page=1&limit=1000')
        .then(res => res.json())
        .then(data => {
            if (data.code === 0 && data.data) {
                var tickets = data.data;
                var total = tickets.length;
                var completed = tickets.filter(t => t.status === '已解决' || t.status === '已关闭').length;
                var pending = tickets.filter(t => t.status === '处理中' || t.status === '待分配').length;
                var overdue = tickets.filter(t => t.is_overdue).length;
                
                document.getElementById('totalTickets').textContent = total;
                document.getElementById('completionRate').textContent = total > 0 ? Math.round(completed / total * 100) + '%' : '0%';
                document.getElementById('pendingTickets').textContent = pending;
                document.getElementById('overdueTickets').textContent = overdue;
            }
        })
        .catch(err => {
            console.error('加载统计失败:', err);
            // 使用默认数据
            document.getElementById('totalTickets').textContent = '0';
            document.getElementById('completionRate').textContent = '0%';
            document.getElementById('pendingTickets').textContent = '0';
            document.getElementById('overdueTickets').textContent = '0';
        });
}

/**
 * 加载待办列表
 */
function loadTodoList() {
    var todoListEl = document.getElementById('todoList');
    todoListEl.innerHTML = '<div class="loading-hint"><div class="loading-spinner"></div>加载中...</div>';
    
    fetch('/system/ticket/table?page=1&limit=5')
        .then(res => res.json())
        .then(data => {
            if (data.code === 0 && data.data && data.data.length > 0) {
                var html = '';
                data.data.forEach(function(ticket) {
                    html += renderTicketItem(ticket);
                });
                todoListEl.innerHTML = html;
            } else {
                todoListEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div>暂无待办工单</div></div>';
            }
        })
        .catch(err => {
            console.error('加载待办列表失败:', err);
            todoListEl.innerHTML = '<div class="error-hint"><div class="error-icon">⚠️</div><div>加载失败</div><button class="retry-btn" onclick="loadTodoList()">重试</button></div>';
        });
}

/**
 * 渲染工单项
 */
function renderTicketItem(ticket) {
    var priorityClass = 'priority-' + (ticket.priority || 'P3');
    var priorityText = ticket.priority || 'P3';
    
    return '<div class="ticket-item" onclick="viewTicket(' + ticket.id + ')">' +
        '<div class="ticket-title">' + (ticket.title || '无标题') + '</div>' +
        '<div class="ticket-meta">' +
            '<span class="priority-tag ' + priorityClass + '">' + priorityText + '</span>' +
            '<span>' + (ticket.assignee_name || '未分配') + '</span>' +
        '</div>' +
    '</div>';
}

/**
 * 初始化图表
 */
function initCharts() {
    // 加载图表数据
    loadChartData();
}

/**
 * 加载图表数据
 */
function loadChartData() {
    fetch('/system/ticket/table?page=1&limit=1000')
        .then(res => res.json())
        .then(data => {
            if (data.code === 0 && data.data) {
                chartDataCache = data.data;
                renderTrendChart(data.data);
                renderPriorityChart(data.data);
            } else {
                showChartError();
            }
        })
        .catch(err => {
            console.error('加载图表数据失败:', err);
            showChartError();
        });
}

/**
 * 显示图表错误
 */
function showChartError() {
    document.getElementById('trendChart').innerHTML = '<div style="text-align: center; padding: 80px 0; color: #999;">暂无数据</div>';
    document.getElementById('priorityChart').innerHTML = '<div style="text-align: center; padding: 80px 0; color: #999;">暂无数据</div>';
}

/**
 * 渲染趋势图
 */
function renderTrendChart(tickets) {
    var container = document.getElementById('trendChart');
    
    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 80px 0; color: #999;">暂无数据</div>';
        return;
    }
    
    // 按日期统计工单数量（最近7天）
    var dateMap = {};
    var today = new Date();
    
    // 初始化最近7天的数据
    for (var i = 6; i >= 0; i--) {
        var date = new Date(today);
        date.setDate(date.getDate() - i);
        var dateStr = (date.getMonth() + 1) + '/' + date.getDate();
        dateMap[dateStr] = 0;
    }
    
    // 统计每天的工单数
    tickets.forEach(function(ticket) {
        if (ticket.create_time) {
            var date = new Date(ticket.create_time);
            var dateStr = (date.getMonth() + 1) + '/' + date.getDate();
            if (dateMap.hasOwnProperty(dateStr)) {
                dateMap[dateStr]++;
            }
        }
    });
    
    // 生成图表HTML
    var dates = Object.keys(dateMap);
    var counts = Object.values(dateMap);
    var maxCount = Math.max.apply(null, counts) || 1;
    
    var html = '<div class="trend-chart">';
    dates.forEach(function(date, index) {
        var count = counts[index];
        var height = Math.max(20, (count / maxCount) * 120);
        html += '<div class="trend-bar">';
        html += '<div class="trend-bar-inner" style="height: ' + height + 'px;"></div>';
        html += '<div class="trend-bar-label">' + date + '</div>';
        html += '</div>';
    });
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * 渲染优先级饼图
 */
function renderPriorityChart(tickets) {
    var container = document.getElementById('priorityChart');
    
    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 80px 0; color: #999;">暂无数据</div>';
        return;
    }
    
    // 统计优先级分布
    var priorityMap = {
        'P1': { count: 0, name: 'P1', color: '#ff6b6b' },
        'P2': { count: 0, name: 'P2', color: '#feca57' },
        'P3': { count: 0, name: 'P3', color: '#48dbfb' },
        'P4': { count: 0, name: 'P4', color: '#1dd1a1' }
    };
    
    tickets.forEach(function(ticket) {
        var priority = ticket.priority || 'P3';
        if (priorityMap.hasOwnProperty(priority)) {
            priorityMap[priority].count++;
        }
    });
    
    // 生成图表HTML
    var html = '<div class="priority-chart">';
    Object.values(priorityMap).forEach(function(item) {
        if (item.count > 0) {
            html += '<div class="priority-item">';
            html += '<div class="priority-circle" style="background: ' + item.color + ';">' + item.count + '</div>';
            html += '<div class="priority-name">' + item.name + '</div>';
            html += '</div>';
        }
    });
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * 初始化筛选按钮
 */
function initFilterButtons() {
    var buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.range;
            // 重新加载数据
            loadStats();
            if (chartDataCache) {
                renderTrendChart(chartDataCache);
                renderPriorityChart(chartDataCache);
            }
        });
    });
}

/**
 * 查看工单详情
 */
function viewTicket(id) {
    window.location.href = '/system/ticket/view/' + id + '?mobile=1';
}

// 导航函数已移至 common.js
