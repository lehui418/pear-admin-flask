/**
 * 移动端工作看板功能
 */

// 当前筛选条件
var currentFilter = 'all';

// 图表数据缓存
var chartDataCache = null;

// 缓存键名和过期时间（5分钟）
var CACHE_KEY = 'workboard_data_cache';
var CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * 初始化页面
 */
document.addEventListener('DOMContentLoaded', function() {
    // 尝试从缓存加载数据
    if (!loadFromCache()) {
        loadStats();
        initCharts();
    }
    initFilterButtons();
});

/**
 * 从localStorage加载缓存数据
 */
function loadFromCache() {
    try {
        var cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            var data = JSON.parse(cached);
            var now = new Date().getTime();
            
            // 检查缓存是否过期
            if (data.timestamp && (now - data.timestamp) < CACHE_EXPIRY) {
                chartDataCache = data.tickets;
                var filteredData = filterTicketsByRange(chartDataCache, currentFilter);
                
                // 更新统计
                var total = filteredData.length;
                var completed = filteredData.filter(t => t.status === '已解决' || t.status === '已关闭').length;
                var pending = filteredData.filter(t => t.status === '处理中' || t.status === '待分配').length;
                var overdue = filteredData.filter(t => t.is_overdue).length;
                
                document.getElementById('totalTickets').textContent = total;
                document.getElementById('completionRate').textContent = total > 0 ? Math.round(completed / total * 100) + '%' : '0%';
                document.getElementById('pendingTickets').textContent = pending;
                document.getElementById('overdueTickets').textContent = overdue;
                
                // 计算环比
                calculateWeekOverWeek(chartDataCache);
                
                // 渲染图表
                renderTrendChart(filteredData);
                renderPriorityChart(filteredData);
                renderCategoryChart(filteredData);
                renderEngineerChart(filteredData);
                
                console.log('从缓存加载数据成功');
                return true;
            }
        }
    } catch (e) {
        console.error('读取缓存失败:', e);
    }
    return false;
}

/**
 * 保存数据到localStorage缓存
 */
function saveToCache(tickets) {
    try {
        var data = {
            tickets: tickets,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        console.log('数据已缓存');
    } catch (e) {
        console.error('保存缓存失败:', e);
    }
}

/**
 * 清除缓存
 */
function clearCache() {
    try {
        localStorage.removeItem(CACHE_KEY);
        console.log('缓存已清除');
    } catch (e) {
        console.error('清除缓存失败:', e);
    }
}

/**
 * 加载统计数据
 */
function loadStats() {
    fetch('/system/ticket/table?page=1&limit=1000')
        .then(res => res.json())
        .then(data => {
            if (data.code === 0 && data.data) {
                chartDataCache = data.data;
                
                // 保存到缓存
                saveToCache(data.data);
                
                var tickets = filterTicketsByRange(data.data, currentFilter);
                var total = tickets.length;
                var completed = tickets.filter(t => t.status === '已解决' || t.status === '已关闭').length;
                var pending = tickets.filter(t => t.status === '处理中' || t.status === '待分配').length;
                var overdue = tickets.filter(t => t.is_overdue).length;
                
                document.getElementById('totalTickets').textContent = total;
                document.getElementById('completionRate').textContent = total > 0 ? Math.round(completed / total * 100) + '%' : '0%';
                document.getElementById('pendingTickets').textContent = pending;
                document.getElementById('overdueTickets').textContent = overdue;
                
                // 计算环比变化
                calculateWeekOverWeek(data.data);
            }
        })
        .catch(err => {
            console.error('加载统计失败:', err);
            document.getElementById('totalTickets').textContent = '0';
            document.getElementById('completionRate').textContent = '0%';
            document.getElementById('pendingTickets').textContent = '0';
            document.getElementById('overdueTickets').textContent = '0';
        });
}

/**
 * 计算环比变化（根据当前筛选条件）
 */
function calculateWeekOverWeek(tickets) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    var currentPeriodTickets = [];
    var lastPeriodTickets = [];
    var periodLabel = '';
    
    // 根据筛选条件确定时间范围
    switch(currentFilter) {
        case 'today':
            // 今日 vs 昨日
            var yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            currentPeriodTickets = tickets.filter(t => {
                var date = t.create_time ? new Date(t.create_time) : null;
                return date && date >= today;
            });
            lastPeriodTickets = tickets.filter(t => {
                var date = t.create_time ? new Date(t.create_time) : null;
                return date && date >= yesterday && date < today;
            });
            periodLabel = '较昨日';
            break;
            
        case 'week':
            // 本周 vs 上周
            var weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            var twoWeeksAgo = new Date(weekAgo);
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);
            currentPeriodTickets = tickets.filter(t => {
                var date = t.create_time ? new Date(t.create_time) : null;
                return date && date >= weekAgo;
            });
            lastPeriodTickets = tickets.filter(t => {
                var date = t.create_time ? new Date(t.create_time) : null;
                return date && date >= twoWeeksAgo && date < weekAgo;
            });
            periodLabel = '较上周';
            break;
            
        case 'month':
            // 本月 vs 上月
            var monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            var twoMonthsAgo = new Date(monthAgo);
            twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1);
            currentPeriodTickets = tickets.filter(t => {
                var date = t.create_time ? new Date(t.create_time) : null;
                return date && date >= monthAgo;
            });
            lastPeriodTickets = tickets.filter(t => {
                var date = t.create_time ? new Date(t.create_time) : null;
                return date && date >= twoMonthsAgo && date < monthAgo;
            });
            periodLabel = '较上月';
            break;
            
        case 'quarter':
            // 本季度 vs 上季度
            var quarterAgo = new Date(today);
            quarterAgo.setMonth(quarterAgo.getMonth() - 3);
            var twoQuartersAgo = new Date(quarterAgo);
            twoQuartersAgo.setMonth(twoQuartersAgo.getMonth() - 3);
            currentPeriodTickets = tickets.filter(t => {
                var date = t.create_time ? new Date(t.create_time) : null;
                return date && date >= quarterAgo;
            });
            lastPeriodTickets = tickets.filter(t => {
                var date = t.create_time ? new Date(t.create_time) : null;
                return date && date >= twoQuartersAgo && date < quarterAgo;
            });
            periodLabel = '较上季度';
            break;
            
        case 'all':
        default:
            // 全部数据，不显示环比变化
            hideChangeText();
            return;
    }
    
    // 计算各项指标变化
    var currentTotal = currentPeriodTickets.length;
    var lastTotal = lastPeriodTickets.length;
    var totalChange = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal * 100).toFixed(1) : 0;
    
    var currentCompleted = currentPeriodTickets.filter(t => t.status === '已解决' || t.status === '已关闭').length;
    var lastCompleted = lastPeriodTickets.filter(t => t.status === '已解决' || t.status === '已关闭').length;
    var completedChange = lastCompleted > 0 ? ((currentCompleted - lastCompleted) / lastCompleted * 100).toFixed(1) : 0;
    
    var currentPending = currentPeriodTickets.filter(t => t.status === '处理中' || t.status === '待分配').length;
    var lastPending = lastPeriodTickets.filter(t => t.status === '处理中' || t.status === '待分配').length;
    var pendingChange = lastPending > 0 ? ((currentPending - lastPending) / lastPending * 100).toFixed(1) : 0;
    
    var currentOverdue = currentPeriodTickets.filter(t => t.is_overdue).length;
    var lastOverdue = lastPeriodTickets.filter(t => t.is_overdue).length;
    var overdueChange = lastOverdue > 0 ? ((currentOverdue - lastOverdue) / lastOverdue * 100).toFixed(1) : 0;
    
    // 更新DOM
    updateChangeText(document.querySelector('.stat-card.primary .stat-change'), totalChange, periodLabel);
    updateChangeText(document.querySelector('.stat-card.success .stat-change'), completedChange, periodLabel);
    updateChangeText(document.querySelector('.stat-card.warning .stat-change'), pendingChange, periodLabel);
    updateChangeText(document.querySelector('.stat-card.info .stat-change'), overdueChange, periodLabel);
}

/**
 * 隐藏环比变化文本（用于全部数据）
 */
function hideChangeText() {
    var elements = document.querySelectorAll('.stat-change');
    elements.forEach(function(el) {
        el.textContent = '';
        el.className = 'stat-change';
    });
}

/**
 * 更新变化文本
 */
function updateChangeText(element, change, periodLabel) {
    if (!element) return;
    var sign = change > 0 ? '+' : '';
    var text = periodLabel + ' ' + sign + change + '%';
    element.textContent = text;
    element.className = 'stat-change ' + (change > 0 ? 'up' : change < 0 ? 'down' : '');
}

/**
 * 初始化图表
 */
function initCharts() {
    loadChartData();
}

/**
 * 根据筛选条件过滤工单
 */
function filterTicketsByRange(tickets, range) {
    if (!tickets || tickets.length === 0) return [];
    
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return tickets.filter(function(ticket) {
        var ticketDate = ticket.create_time ? new Date(ticket.create_time) : null;
        if (!ticketDate) return false;
        
        switch(range) {
            case 'today':
                return ticketDate >= today;
            case 'week':
                var weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return ticketDate >= weekAgo;
            case 'month':
                var monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return ticketDate >= monthAgo;
            case 'quarter':
                var quarterAgo = new Date(today);
                quarterAgo.setMonth(quarterAgo.getMonth() - 3);
                return ticketDate >= quarterAgo;
            case 'all':
            default:
                return true;
        }
    });
}

/**
 * 加载图表数据
 */
function loadChartData() {
    showChartLoading();
    
    fetch('/system/ticket/table?page=1&limit=1000')
        .then(res => res.json())
        .then(data => {
            if (data.code === 0 && data.data) {
                chartDataCache = data.data;
                var filteredData = filterTicketsByRange(data.data, currentFilter);
                renderTrendChart(filteredData);
                renderPriorityChart(filteredData);
                renderCategoryChart(filteredData);
                renderEngineerChart(filteredData);
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
    var emptyHtml = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">暂无数据</div><div class="empty-desc">当前筛选条件下没有工单数据</div></div>';
    document.getElementById('trendChart').innerHTML = emptyHtml;
    document.getElementById('priorityChart').innerHTML = emptyHtml;
    document.getElementById('categoryChart').innerHTML = emptyHtml;
    document.getElementById('engineerChart').innerHTML = emptyHtml;
}

/**
 * 显示图表加载状态
 */
function showChartLoading() {
    var loadingHtml = '<div class="loading-hint"><div class="loading-spinner"></div><div class="loading-text">数据加载中...</div></div>';
    document.getElementById('trendChart').innerHTML = loadingHtml;
    document.getElementById('priorityChart').innerHTML = loadingHtml;
    document.getElementById('categoryChart').innerHTML = loadingHtml;
    document.getElementById('engineerChart').innerHTML = loadingHtml;
}

/**
 * 渲染趋势图
 */
function renderTrendChart(tickets) {
    var container = document.getElementById('trendChart');
    
    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📈</div><div class="empty-title">暂无趋势数据</div><div class="empty-desc">当前筛选条件下没有工单数据</div></div>';
        return;
    }
    
    var dateMap = {};
    var today = new Date();
    var pointsToShow = 7; // 默认显示7个点
    var isWeekMode = false; // 是否按周统计
    
    // 根据筛选条件调整显示点数
    switch(currentFilter) {
        case 'today':
            pointsToShow = 1;
            break;
        case 'week':
            pointsToShow = 7;
            break;
        case 'month':
            pointsToShow = 4; // 本月显示4周
            isWeekMode = true;
            break;
        case 'quarter':
            pointsToShow = 12; // 本季度显示12周
            isWeekMode = true;
            break;
        case 'all':
        default:
            pointsToShow = 7;
            break;
    }
    
    // 初始化日期映射 - 存储Date对象和显示字符串
    var dateList = [];
    for (var i = pointsToShow - 1; i >= 0; i--) {
        var date = new Date(today);
        if (isWeekMode) {
            // 周模式：显示每周一
            var daysSinceMonday = (date.getDay() + 6) % 7;
            date.setDate(date.getDate() - i * 7 - daysSinceMonday);
            date.setHours(0, 0, 0, 0);
        } else {
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
        }
        var dateStr = (date.getMonth() + 1) + '/' + date.getDate();
        dateMap[dateStr] = 0;
        dateList.push({ date: date, dateStr: dateStr });
    }
    
    // 统计每个日期/周的工单数
    tickets.forEach(function(ticket) {
        if (ticket.create_time) {
            var ticketDate = new Date(ticket.create_time);
            ticketDate.setHours(0, 0, 0, 0);
            
            if (isWeekMode) {
                // 周模式：找到对应的周
                for (var i = 0; i < dateList.length; i++) {
                    var weekStart = dateList[i].date;
                    var weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
                    
                    if (ticketDate >= weekStart && ticketDate <= weekEnd) {
                        dateMap[dateList[i].dateStr]++;
                        break;
                    }
                }
            } else {
                // 日模式：精确匹配日期
                var dateStr = (ticketDate.getMonth() + 1) + '/' + ticketDate.getDate();
                if (dateMap.hasOwnProperty(dateStr)) {
                    dateMap[dateStr]++;
                }
            }
        }
    });
    
    var dates = Object.keys(dateMap);
    var counts = Object.values(dateMap);
    var maxCount = Math.max.apply(null, counts) || 1;
    
    // 生成SVG波浪图
    var width = container.clientWidth || 300;
    var height = 140;
    var padding = 20;
    var chartWidth = width - padding * 2;
    var chartHeight = height - padding * 2;
    
    // 计算点的位置
    var points = counts.map(function(count, index) {
        var x = padding + (index / (counts.length - 1)) * chartWidth;
        var y = height - padding - (count / maxCount) * chartHeight;
        return { x: x, y: y, count: count, date: dates[index] };
    });
    
    // 生成平滑曲线路径（使用贝塞尔曲线）
    var pathD = '';
    var areaD = '';
    if (points.length > 0) {
        pathD = 'M ' + points[0].x + ' ' + points[0].y;
        areaD = 'M ' + points[0].x + ' ' + (height - padding) + ' L ' + points[0].x + ' ' + points[0].y;
        
        for (var i = 1; i < points.length; i++) {
            var prev = points[i - 1];
            var curr = points[i];
            var cp1x = prev.x + (curr.x - prev.x) / 3;
            var cp1y = prev.y;
            var cp2x = prev.x + (curr.x - prev.x) * 2 / 3;
            var cp2y = curr.y;
            pathD += ' C ' + cp1x + ' ' + cp1y + ', ' + cp2x + ' ' + cp2y + ', ' + curr.x + ' ' + curr.y;
            areaD += ' C ' + cp1x + ' ' + cp1y + ', ' + cp2x + ' ' + cp2y + ', ' + curr.x + ' ' + curr.y;
        }
        
        areaD += ' L ' + points[points.length - 1].x + ' ' + (height - padding) + ' Z';
    }
    
    // 生成HTML
    var html = '<div class="trend-wave-chart">';
    html += '<div class="trend-wave-tooltip" id="trendTooltip"></div>';
    html += '<svg class="trend-wave-svg" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none">';
    html += '<defs>';
    html += '<linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">';
    html += '<stop offset="0%" style="stop-color:#667eea;stop-opacity:0.6" />';
    html += '<stop offset="100%" style="stop-color:#667eea;stop-opacity:0.1" />';
    html += '</linearGradient>';
    html += '</defs>';
    
    // 绘制填充区域
    if (areaD) {
        html += '<path class="trend-wave-area" d="' + areaD + '" />';
    }
    
    // 绘制曲线
    if (pathD) {
        html += '<path class="trend-wave-path" d="' + pathD + '" />';
    }
    
    // 绘制数据点和数值
    points.forEach(function(point, index) {
        html += '<circle class="trend-wave-point" cx="' + point.x + '" cy="' + point.y + '" r="4" ';
        html += 'data-count="' + point.count + '" data-date="' + point.date + '" ';
        html += 'onmouseover="showTrendTooltip(this)" onmouseout="hideTrendTooltip()" />';
        
        // 显示数值标签
        if (point.count > 0) {
            html += '<text x="' + point.x + '" y="' + (point.y - 10) + '" ';
            html += 'text-anchor="middle" font-size="10" fill="#667eea" font-weight="bold">';
            html += point.count + '</text>';
        }
    });
    
    html += '</svg>';
    html += '</div>';
    
    // 添加日期标签
    html += '<div class="trend-wave-labels">';
    dates.forEach(function(date) {
        html += '<div class="trend-wave-label">' + date + '</div>';
    });
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * 显示趋势图tooltip
 */
function showTrendTooltip(element) {
    var tooltip = document.getElementById('trendTooltip');
    var count = element.getAttribute('data-count');
    var date = element.getAttribute('data-date');
    var rect = element.getBoundingClientRect();
    var containerRect = element.closest('.trend-wave-chart').getBoundingClientRect();
    
    tooltip.innerHTML = date + '<br/>' + count + '个工单';
    tooltip.style.left = (rect.left - containerRect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = (rect.top - containerRect.top - tooltip.offsetHeight - 5) + 'px';
    tooltip.classList.add('show');
}

/**
 * 隐藏趋势图tooltip
 */
function hideTrendTooltip() {
    var tooltip = document.getElementById('trendTooltip');
    tooltip.classList.remove('show');
}

/**
 * 渲染优先级柱状图
 */
function renderPriorityChart(tickets) {
    var container = document.getElementById('priorityChart');
    
    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">暂无优先级数据</div><div class="empty-desc">当前筛选条件下没有工单数据</div></div>';
        return;
    }
    
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
    
    var priorities = Object.values(priorityMap);
    var maxCount = Math.max.apply(null, priorities.map(p => p.count)) || 1;
    
    var html = '<div class="priority-bar-chart">';
    priorities.forEach(function(item) {
        var height = Math.max(20, (item.count / maxCount) * 120);
        html += '<div class="priority-bar-item">';
        html += '<div class="priority-bar-wrapper">';
        html += '<div class="priority-bar-count">' + item.count + '</div>';
        html += '<div class="priority-bar-inner" style="height: ' + height + 'px; background: ' + item.color + ';"></div>';
        html += '</div>';
        html += '<div class="priority-bar-name">' + item.name + '</div>';
        html += '</div>';
    });
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * 渲染工单问题分类统计（按威胁类型）
 */
function renderCategoryChart(tickets) {
    var container = document.getElementById('categoryChart');
    
    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📂</div><div class="empty-title">暂无分类数据</div><div class="empty-desc">当前筛选条件下没有工单数据</div></div>';
        return;
    }
    
    // 统计问题分类
    var categoryMap = {};
    tickets.forEach(function(ticket) {
        // 优先使用 problem_classification_main，然后是其他字段
        var category = ticket.problem_classification_main || 
                      ticket.problem_classification || 
                      ticket.threat_type || 
                      ticket.problem_category || 
                      ticket.category;
        
        // 如果还是空，根据标题关键词分类
        if (!category) {
            var title = (ticket.title || '').toLowerCase();
            if (title.indexOf('bug') !== -1 || title.indexOf('错误') !== -1) {
                category = '软件bug';
            } else if (title.indexOf('登录') !== -1) {
                category = '登录类';
            } else if (title.indexOf('性能') !== -1 || title.indexOf('慢') !== -1) {
                category = '性能问题';
            } else if (title.indexOf('安全') !== -1 || title.indexOf('漏洞') !== -1) {
                category = '安全问题';
            } else if (title.indexOf('配置') !== -1) {
                category = '配置问题';
            } else if (title.indexOf('数据') !== -1) {
                category = '数据问题';
            } else if (title.indexOf('升级') !== -1 || title.indexOf('更新') !== -1) {
                category = '版本升级';
            } else {
                category = '其他问题';
            }
        }
        
        if (!categoryMap[category]) {
            categoryMap[category] = 0;
        }
        categoryMap[category]++;
    });
    
    // 转换为数组并排序
    var categories = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8); // 显示前8个
    
    var colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#11998e', '#f093fb'];
    var maxCount = Math.max.apply(null, categories.map(c => c[1])) || 1;
    var total = tickets.length;
    
    var html = '<div class="category-bar-chart">';
    categories.forEach(function(item, index) {
        var color = colors[index % colors.length];
        var percentage = Math.round((item[1] / total) * 100);
        var height = Math.max(20, (item[1] / maxCount) * 120);
        
        html += '<div class="category-bar-item">';
        html += '<div class="category-bar-wrapper">';
        html += '<div class="category-bar-count">' + item[1] + '</div>';
        html += '<div class="category-bar-inner" style="height: ' + height + 'px; background: ' + color + ';"></div>';
        html += '</div>';
        html += '<div class="category-bar-name" title="' + item[0] + '">' + item[0] + '</div>';
        html += '<div class="category-bar-percent">' + percentage + '%</div>';
        html += '</div>';
    });
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * 渲染工程师工单处理占比（柱状图）
 */
function renderEngineerChart(tickets) {
    var container = document.getElementById('engineerChart');
    
    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">暂无工程师数据</div><div class="empty-desc">当前筛选条件下没有工单数据</div></div>';
        return;
    }
    
    // 统计工程师处理数量
    var engineerMap = {};
    tickets.forEach(function(ticket) {
        var engineer = ticket.assignee_name || ticket.assignee || '未分配';
        if (!engineerMap[engineer]) {
            engineerMap[engineer] = 0;
        }
        engineerMap[engineer]++;
    });
    
    // 转换为数组并排序
    var engineers = Object.entries(engineerMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6); // 显示前6个
    
    var colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
    var maxCount = Math.max.apply(null, engineers.map(e => e[1])) || 1;
    var total = tickets.length;
    
    var html = '<div class="engineer-bar-chart">';
    engineers.forEach(function(item, index) {
        var color = colors[index % colors.length];
        var percentage = Math.round((item[1] / total) * 100);
        var height = Math.max(15, (item[1] / maxCount) * 100);
        
        html += '<div class="engineer-bar-item">';
        html += '<div class="engineer-bar-wrapper">';
        html += '<div class="engineer-bar-inner" style="height: ' + height + 'px; background: ' + color + ';">';
        html += '<div class="engineer-bar-count">' + item[1] + '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="engineer-bar-avatar" style="background: ' + color + ';">' + item[0].charAt(0) + '</div>';
        html += '<div class="engineer-bar-name" title="' + item[0] + '">' + item[0] + '</div>';
        html += '<div class="engineer-bar-percent">' + percentage + '%</div>';
        html += '</div>';
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
            loadStats();
            if (chartDataCache) {
                var filteredData = filterTicketsByRange(chartDataCache, currentFilter);
                renderTrendChart(filteredData);
                renderPriorityChart(filteredData);
                renderCategoryChart(filteredData);
                renderEngineerChart(filteredData);
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
