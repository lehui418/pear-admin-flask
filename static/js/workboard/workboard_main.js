
// 全局错误处理器，专门捕获echarts相关错误
window.addEventListener('error', function (event) {
    if (event.filename && event.filename.includes('echarts')) {
        console.error('捕获到echarts相关错误:');
        console.error('错误消息:', event.message);
        console.error('错误文件:', event.filename);
        console.error('错误行号:', event.lineno);
        console.error('错误列号:', event.colno);
        console.error('错误堆栈:', event.error && event.error.stack);

        // 尝试提供更详细的错误信息
        if (event.message && event.message.includes('Cannot read properties of undefined')) {
            console.error('这可能是由于图表数据格式错误或图表实例状态异常导致的');
            console.error('请检查图表数据是否包含undefined或null值');
            console.error('请检查图表实例是否正确初始化');
        }
    }
});

// 图表配置和实例对象
let charts = {
    statusChart: { instance: null, loading: false, error: null, dataKey: 'statusChart' },
    timeChart: { instance: null, loading: false, error: null, dataKey: 'timeChart' },
    issueChart: { instance: null, loading: false, error: null, dataKey: 'issueChart' },
    satisfactionChart: { instance: null, loading: false, error: null, dataKey: 'satisfactionChart' }
};

// 工程师图表数据存储
let engineerChartData = {
    this_week: null,
    last_week: null,
    all: null
};
let currentEngineerChartPeriod = 'this_week';
let engineerChartUseGlobalDateRange = true; // 是否使用全局日期范围

// 状态图表数据存储
let statusChartData = {
    this_week: null,
    last_week: null,
    all: null
};
let currentStatusChartPeriod = 'this_week';
let statusChartUseGlobalDateRange = true; // 是否使用全局日期范围

// 工单问题分类统计数据存储
let issueChartData = {
    this_week: null,
    last_week: null,
    all: null
};
let currentIssueChartPeriod = 'this_week';
let issueChartUseGlobalDateRange = true; // 是否使用全局日期范围

// 优先级图表数据存储
let priorityChartData = {
    this_week: null,
    last_week: null,
    all: null
};
let currentPriorityChartPeriod = 'this_week';
let priorityChartUseGlobalDateRange = true; // 是否使用全局日期范围

// 初始化所有图表
function initCharts() {
    try {
        console.log("initCharts开始执行 - charts对象:", charts);
        Object.keys(charts).forEach(function (chartId) {
            const chartEl = document.getElementById(chartId);
            console.log(`检查图表元素 - chartId: ${chartId}, chartEl:`, chartEl);
            if (chartEl) {
                charts[chartId].instance = echarts.init(chartEl, null, { renderer: 'svg' });
                console.log(`图表初始化成功 - chartId: ${chartId}, instance:`, charts[chartId].instance);
            } else {
                console.error('Chart element not found: ' + chartId);
            }
        });
        console.log("图表初始化完成 - charts对象:", charts);
    } catch (e) {
        console.error("图表初始化失败:", e);
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// 显示图表加载状态
function showChartLoading(chartId) {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
        console.error(`Chart element with ID '${chartId}' not found for loading state.`);
        return;
    }
    const chartContainer = chartElement.parentElement;
    if (chartContainer) {
        chartContainer.classList.add('loading');
        const loadingElement = chartContainer.querySelector('.chart-loading');
        if (loadingElement) loadingElement.style.display = 'flex';
        const errorElement = chartContainer.querySelector('.chart-error');
        if (errorElement) errorElement.style.display = 'none';
    }
    if (charts[chartId]) charts[chartId].loading = true;
}

// 显示图表错误状态
function showChartError(chartId, message) {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
        console.error(`Chart element with ID '${chartId}' not found for error state.`);
        return;
    }
    const chartContainer = chartElement.parentElement;
    if (chartContainer) {
        chartContainer.classList.remove('loading');
        chartContainer.classList.add('error');
        const errorElement = chartContainer.querySelector('.chart-error');
        if (errorElement) {
            errorElement.style.display = 'flex';
            const errorMessageElement = errorElement.querySelector('.error-message');
            if (errorMessageElement) errorMessageElement.textContent = message || '加载失败，请重试。';
        }
        const loadingElement = chartContainer.querySelector('.chart-loading');
        if (loadingElement) loadingElement.style.display = 'none';
    }
    if (charts[chartId]) {
        charts[chartId].loading = false;
        charts[chartId].error = message;
    }
}

// 安全的setOption包装函数，统一处理错误
function safeSetOption(chartId, option, notMerge) {
    try {
        console.log(`safeSetOption - ${chartId}: 开始设置选项`);

        // 验证图表实例
        if (!charts[chartId]) {
            throw new Error(`图表配置不存在: ${chartId}`);
        }

        if (!charts[chartId].instance) {
            throw new Error(`图表实例不存在: ${chartId}`);
        }

        // 验证实例方法
        if (typeof charts[chartId].instance.setOption !== 'function') {
            throw new Error(`图表实例的setOption方法不存在: ${chartId}`);
        }

        // 验证option参数
        if (!option || typeof option !== 'object') {
            throw new Error(`无效的option参数: ${JSON.stringify(option)}`);
        }

        // 检查option是否包含可能导致错误的数据
        if (option.series && Array.isArray(option.series)) {
            option.series.forEach((series, index) => {
                if (series.data && Array.isArray(series.data)) {
                    const hasUndefined = series.data.some(item => item === undefined || item === null);
                    if (hasUndefined) {
                        console.warn(`safeSetOption - ${chartId}: series[${index}] 包含undefined或null值`);
                    }
                }
            });
        }

        console.log(`safeSetOption - ${chartId}: 调用setOption`);
        charts[chartId].instance.setOption(option, notMerge);
        console.log(`safeSetOption - ${chartId}: setOption成功`);
        return true;

    } catch (error) {
        console.error(`safeSetOption - ${chartId}: 错误`, error);
        console.error(`safeSetOption - ${chartId}: 堆栈`, error.stack);

        // 显示用户友好的错误信息
        showChartError(chartId, `图表更新失败: ${error.message}`);
        return false;
    }
}

// 隐藏图表加载和错误状态
function hideChartLoadingAndError(chartId) {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
        console.error(`Chart element with ID '${chartId}' not found for hiding states.`);
        return;
    }
    const chartContainer = chartElement.parentElement;
    if (chartContainer) {
        chartContainer.classList.remove('loading', 'error');
        const loadingElement = chartContainer.querySelector('.chart-loading');
        if (loadingElement) loadingElement.style.display = 'none';
        const errorElement = chartContainer.querySelector('.chart-error');
        if (errorElement) errorElement.style.display = 'none';
    }
    if (charts[chartId]) {
        charts[chartId].loading = false;
        charts[chartId].error = null;
    }
}

// 加载和更新数据
function loadData() {
    const dateRangePicker = document.getElementById('dateRangePicker');
    const dateRangeValue = dateRangePicker ? dateRangePicker.value : '';
    const classification = document.getElementById('classificationFilter').value;
    const priority = document.getElementById('priorityFilter').value;
    const search = document.getElementById('searchInput').value;

    console.log("loadData调用 - dateRangeValue:", dateRangeValue, "dateRangePicker:", dateRangePicker);

    let dateRangeString = "";
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11
    const day = today.getDate();

    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    switch (dateRangeValue) {
        case 'today':
            dateRangeString = `${formatDate(today)} - ${formatDate(today)}`;
            break;
        case 'this_week':
            // 创建新的日期对象，避免修改原始today对象
            const tempDate = new Date(today);
            const firstDayOfWeek = new Date(tempDate.setDate(day - tempDate.getDay() + (tempDate.getDay() === 0 ? -6 : 1))); // Monday as first day
            const lastDayOfWeek = new Date(new Date(firstDayOfWeek).setDate(firstDayOfWeek.getDate() + 6));
            dateRangeString = `${formatDate(firstDayOfWeek)} - ${formatDate(lastDayOfWeek)}`;
            break;
        case 'this_month':
            const firstDayOfMonth = new Date(year, month, 1);
            const lastDayOfMonth = new Date(year, month + 1, 0);
            dateRangeString = `${formatDate(firstDayOfMonth)} - ${formatDate(lastDayOfMonth)}`;
            break;
        case 'this_quarter':
            const quarterStartMonth = Math.floor(month / 3) * 3;
            const firstDayOfQuarter = new Date(year, quarterStartMonth, 1);
            const lastDayOfQuarter = new Date(year, quarterStartMonth + 3, 0);
            dateRangeString = `${formatDate(firstDayOfQuarter)} - ${formatDate(lastDayOfQuarter)}`;
            break;
        case 'custom':
            // 自定义日期范围处理，需要日期选择器组件配合，暂时留空或使用默认
            // 例如，可以让用户选择后，这里获取实际的日期范围
            dateRangeString = $('#customDateRangeInput').val(); // 获取自定义日期范围的值
            if (!dateRangeString) {
                // 如果自定义日期为空，并且选择的是custom，则不传递日期范围，让后端处理或提示用户选择
                console.warn("自定义日期范围未选择，将不传递日期范围参数。");
                // dateRangeString = ""; // 或者保持为空，让后端决定如何处理
            }
            break;
        default:
            dateRangeString = ""; // 默认为空，后端不进行日期筛选
    }

    console.log("加载数据参数:", { dateRange: dateRangeString, classification, priority, search });

    // 显示所有图表的加载状态
    Object.keys(charts).forEach(chartId => showChartLoading(chartId));

    $.ajax({
        url: getAnalyticsUrl,
        type: 'GET',
        data: {
            date_range: dateRangeString, // 使用转换后的日期字符串
            classification_filter: classification,
            priority_filter: priority,
            search: search
        },
        dataType: 'json',
        success: function (res) {
            console.log("后端返回数据:", res);
            if (res.code === 200 && res.data) {
                updateStatistics(res.data); // 传递整个 res.data 对象
                updateCharts(res.data);
                updateEngineerStats(res.data.assignee_data); // 使用 assignee_data 更新工程师统计

                // 重置工程师图表为使用全局日期范围
                resetEngineerChartToGlobal();
                // 使用全局日期范围更新工程师图表
                if (res.data.assignee_stats) {
                    updateSatisfactionChart(res.data.assignee_stats);
                }

                // 重置状态图表为使用全局日期范围
                resetStatusChartToGlobal();
                // 使用全局日期范围更新状态图表
                if (res.data.trendChart) {
                    updateStatusChart(res.data.trendChart);
                }

                // 重置工单问题分类统计图表为使用全局日期范围
                resetIssueChartToGlobal();
                // 使用全局日期范围更新工单问题分类统计图表
                if (res.data.categoryChart) {
                    renderIssueChart(res.data.categoryChart);
                }

                // 重置优先级图表为使用全局日期范围
                resetPriorityChartToGlobal();
                // 使用全局日期范围更新优先级图表
                if (res.data.priorityChart) {
                    renderPriorityChart(res.data.priorityChart);
                }

                // 隐藏所有图表的加载和错误状态
                Object.keys(charts).forEach(chartId => hideChartLoadingAndError(chartId));
            } else {
                console.error("获取数据失败:", res.msg);
                Object.keys(charts).forEach(chartId => showChartError(chartId, res.msg || '获取数据失败'));
            }
        },
        error: function (xhr, status, error) {
            console.error("AJAX请求失败:", status, error, xhr.responseText);
            const errorMsg = `请求失败: ${status} - ${error}. 请检查网络连接或联系管理员。`;
            Object.keys(charts).forEach(chartId => showChartError(chartId, errorMsg));
        }
    });
}

// 更新统计数据卡片
function updateStatistics(data) {
    try {
        if (data && data.statistics) {
            const stats = data.statistics;
            const prev_stats = data.previous_week || { total: 0, completed: 0, overdue: 0, avg_resolution_time: 0 };

            // 根据当前时间范围更新比较文本
            const dateRangePicker = document.getElementById('dateRangePicker');
            const dateRangeValue = dateRangePicker ? dateRangePicker.value : 'this_week';
            let compareText = '较上周';
            // 全部日期或自定义日期时不显示比较文本
            if (dateRangeValue === '' || dateRangeValue === 'all' || dateRangeValue === 'custom') {
                compareText = '';
            } else {
                switch (dateRangeValue) {
                    case 'today':
                        compareText = '较昨日';
                        break;
                    case 'this_week':
                        compareText = '较上周';
                        break;
                    case 'this_month':
                        compareText = '较上月';
                        break;
                    case 'this_quarter':
                        compareText = '较上季度';
                        break;
                    case 'this_year':
                        compareText = '较上年';
                        break;
                }
            }
            document.getElementById('totalTicketsCompare').textContent = compareText;
            document.getElementById('completedTicketsCompare').textContent = compareText;
            document.getElementById('resolvedTicketsCompare').textContent = compareText;
            document.getElementById('overdueTicketsCompare').textContent = compareText;

            $('#totalTickets').text(stats.total);
            $('#completedTickets').text(((stats.completed / stats.total) * 100).toFixed(1) + '%');

            // 修正：使用正确的ID #resolvedTickets 来更新平均处理时长
            $('#resolvedTickets').text(stats.avg_resolution_time + '小时');

            $('#overdueTickets').text(stats.overdue + '/' + stats.total);

            // 更新工单总量变化率
            if (prev_stats.total > 0) {
                const changePercent = ((stats.total - prev_stats.total) / prev_stats.total * 100).toFixed(1);
                $('#totalTicketsChange').text(changePercent > 0 ? '↑ ' + changePercent + '%' : '↓ ' + Math.abs(changePercent) + '%');
                $('#totalTicketsTrend').removeClass(changePercent > 0 ? 'down' : 'up').addClass(changePercent > 0 ? 'up' : 'down');
            } else {
                $('#totalTicketsChange').text('--');
                $('#totalTicketsTrend').removeClass('up down');
            }

            // 更新完成率变化
            if (prev_stats.completed > 0) {
                const changePercent = ((stats.completed - prev_stats.completed) / prev_stats.completed * 100).toFixed(1);
                $('#completedTicketsChange').text(changePercent > 0 ? '↑ ' + changePercent + '%' : '↓ ' + Math.abs(changePercent) + '%');
                $('#completedTicketsTrend').removeClass(changePercent > 0 ? 'down' : 'up').addClass(changePercent > 0 ? 'up' : 'down');
            } else {
                $('#completedTicketsChange').text('--');
                $('#completedTicketsTrend').removeClass('up down');
            }

            // 更新平均处理时长变化
            if (prev_stats.avg_resolution_time !== null && prev_stats.avg_resolution_time !== undefined) {
                const changeTime = (stats.avg_resolution_time - prev_stats.avg_resolution_time).toFixed(1);
                $('#resolvedTicketsChange').text(changeTime < 0 ? '↓ ' + Math.abs(changeTime) + '小时' : '↑ ' + changeTime + '小时');
                $('#resolvedTicketsTrend').removeClass(changeTime < 0 ? 'down' : 'up').addClass(changeTime > 0 ? 'up' : 'down');
            } else {
                animateNumber(document.getElementById('totalTickets'), stats.total || 0);

                // 更新工单总量变化率
                if (data.previous_week && data.previous_week.total !== undefined) {
                    const previousTotal = data.previous_week.total || 0;
                    const currentTotal = stats.total || 0;
                    let changePercent = 0;
                    let trendClass = '';

                    if (previousTotal > 0) {
                        changePercent = ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1);
                    }

                    // 设置趋势方向和样式
                    if (changePercent > 0) {
                        $('#totalTicketsChange').text('↑ ' + changePercent + '%');
                        $('#totalTicketsTrend').removeClass('down').addClass('up');
                    } else if (changePercent < 0) {
                        $('#totalTicketsChange').text('↓ ' + Math.abs(changePercent) + '%');
                        $('#totalTicketsTrend').removeClass('up').addClass('down');
                    } else {
                        $('#totalTicketsChange').text('0%');
                        $('#totalTicketsTrend').removeClass('up down');
                    }
                } else {
                    $('#totalTicketsChange').text('--');
                    $('#totalTicketsTrend').removeClass('up down');
                }

                // 计算并更新完成率
                const rawCompletedRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                const completedRateText = rawCompletedRate.toFixed(1) + '%';
                $('#completedTickets').text(completedRateText);

                // 更新完成率变化
                if (data.previous_week && data.previous_week.completed !== undefined) {
                    const previousCompleted = data.previous_week.completed || 0;
                    const previousTotal = data.previous_week.total || 0;
                    let previousRate = previousTotal > 0 ? (previousCompleted / previousTotal) * 100 : 0;
                    let changePercent = 0;

                    if (previousRate > 0) {
                        changePercent = (rawCompletedRate - previousRate).toFixed(1);
                    }

                    // 设置趋势方向和样式
                    if (changePercent > 0) {
                        $('#completedTicketsChange').text('↑ ' + changePercent + '%');
                        $('#completedTicketsTrend').removeClass('down').addClass('up');
                    } else if (changePercent < 0) {
                        $('#completedTicketsChange').text('↓ ' + Math.abs(changePercent) + '%');
                        $('#completedTicketsTrend').removeClass('up').addClass('down');
                    } else {
                        $('#completedTicketsChange').text('0%');
                        $('#completedTicketsTrend').removeClass('up down');
                    }
                } else {
                    $('#completedTicketsChange').text('--');
                    $('#completedTicketsTrend').removeClass('up down');
                }

                // 更新平均处理时长 (从 data 直接获取)
                const avgTime = parseFloat(data.avg_resolution_time) || 0;
                $('#resolvedTickets').text(avgTime.toFixed(1) + '小时');

                // 更新平均处理时长变化
                if (data.previous_week && data.previous_week.avg_resolution_time !== undefined) {
                    const previousAvgTime = parseFloat(data.previous_week.avg_resolution_time) || 0;
                    let changeTime = (avgTime - previousAvgTime).toFixed(1);

                    // 设置趋势方向和样式（注意：处理时长是越短越好，所以趋势方向与其他指标相反）
                    if (changeTime < 0) {
                        // 处理时间减少，这是好事
                        $('#resolvedTicketsChange').text('↓ ' + Math.abs(changeTime) + '小时');
                        $('#resolvedTicketsTrend').removeClass('down').addClass('up');
                    } else if (changeTime > 0) {
                        // 处理时间增加，这是坏事
                        $('#resolvedTicketsChange').text('↑ ' + changeTime + '小时');
                        $('#resolvedTicketsTrend').removeClass('up').addClass('down');
                    } else {
                        $('#resolvedTicketsChange').text('0小时');
                        $('#resolvedTicketsTrend').removeClass('up down');
                    }
                } else {
                    $('#resolvedTicketsChange').text('--');
                    $('#resolvedTicketsTrend').removeClass('up down');
                }

                // 更新超时工单数据
                const overdueCount = (stats && stats.overdue !== undefined) ? stats.overdue : 0;
                const totalTickets = (stats && stats.total !== undefined) ? stats.total : 0;
                const overdueText = overdueCount + '/' + totalTickets;
                $('#overdueTickets').text(overdueText);

                // 更新超时工单变化
                if (data.previous_week && data.previous_week.overdue !== undefined) {
                    const previousOverdue = data.previous_week.overdue || 0;
                    let changeOverdue = stats.overdue - previousOverdue;

                    // 设置趋势方向和样式
                    if (changeOverdue < 0) {
                        // 超时工单减少，这是好事
                        $('#overdueTicketsChange').text('↓ ' + Math.abs(changeOverdue));
                        $('#overdueTicketsTrend').removeClass('down').addClass('up');
                    } else if (changeOverdue > 0) {
                        // 超时工单增加，这是坏事
                        $('#overdueTicketsChange').text('↑ ' + changeOverdue);
                        $('#overdueTicketsTrend').removeClass('up').addClass('down');
                    } else {
                        $('#overdueTicketsChange').text('0');
                        $('#overdueTicketsTrend').removeClass('up down');
                    }
                } else {
                    $('#overdueTicketsChange').text('--');
                    $('#overdueTicketsTrend').removeClass('up down');
                }
            }

            // 更新SLA超时工单数据 - 移到条件外部，确保总是执行
            $('#overdueTicketsCount').text(stats.overdue || 0);

            // 更新SLA超时工单列表
            if (data.overdue_tickets_details) {
                updateOverdueTicketsList(data.overdue_tickets_details, stats.overdue);
            }
        }
    } catch (e) {
        console.error("Error updating statistics:", e);
    }
}

// SLA超时工单列表分页配置
let overdueTicketsData = [];
let overdueTicketsPage = 1;
const overdueTicketsPageSize = 10;

// 更新SLA超时工单列表
function updateOverdueTicketsList(overdueTickets, totalOverdue) {
    const listContainer = $('#overdueTicketsList');
    listContainer.empty();

    // 保存数据用于分页
    overdueTicketsData = overdueTickets || [];

    // 更新标题统计
    const totalCount = totalOverdue || overdueTicketsData.length;
    $('#overdueListSummary').text(`共${totalCount}条超时工单`);

    if (!overdueTicketsData || overdueTicketsData.length === 0) {
        listContainer.append(`
                    <div class="no-data" style="text-align: center; padding: 20px; color: #999;">
                        暂无SLA超时工单
                    </div>
                `);
        return;
    }

    // 根据超时小时数排序（降序，超时越久越靠前）
    overdueTicketsData.sort((a, b) => b.overdue_hours - a.overdue_hours);

    // 渲染当前页
    renderOverdueTicketsPage();
}

// 渲染SLA超时工单列表当前页
function renderOverdueTicketsPage() {
    const listContainer = $('#overdueTicketsList');
    listContainer.empty();

    const start = (overdueTicketsPage - 1) * overdueTicketsPageSize;
    const end = start + overdueTicketsPageSize;
    const pageData = overdueTicketsData.slice(start, end);

    // 生成列表项
    pageData.forEach(ticket => {
        // 根据优先级设置样式类和显示文本
        let priorityClass = 'priority-medium';
        let priorityText = ticket.priority || 'P4';

        if (ticket.priority === 'P1' || ticket.priority === 'Urgent') {
            priorityClass = 'priority-high';
        } else if (ticket.priority === 'P2' || ticket.priority === 'High') {
            priorityClass = 'priority-high';
        } else if (ticket.priority === 'P3' || ticket.priority === 'Medium') {
            priorityClass = 'priority-medium';
        } else if (ticket.priority === 'P4' || ticket.priority === 'Low') {
            priorityClass = 'priority-low';
        }

        const ticketItem = `
                    <div class="alert-item" style="transition: all 0.2s ease;">
                        <div class="alert-info" style="flex: 1;">
                                <div class="alert-id" style="font-weight: bold; color: #333;">${ticket.title || ticket.name || '未命名工单'}</div>
                                <div class="alert-desc" style="margin: 4px 0; font-size: 12px; color: #666;">工单号: #${ticket.id}</div>
                                <div style="font-size: 11px; color: #666;">
                                    <span style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${ticket.department || '未知'}</span>
                                </div>
                            </div>
                        <div style="text-align: right; margin-left: 10px;">
                            <div class="priority ${priorityClass}" style="margin-bottom: 5px;">${priorityText}</div>
                            <div class="alert-time" style="color: #dc3545; font-weight: bold; font-size: 12px;">超时 ${ticket.overdue_hours} 小时</div>
                        </div>
                        <button class="view-btn" style="margin-left: 10px;" onclick="window.open('/system/ticket/view/${ticket.id}')">查看</button>
                    </div>
                `;

        listContainer.append(ticketItem);
    });

    // 添加分页控件
    renderOverdueTicketsPagination();
}

// 渲染SLA超时工单列表分页控件
function renderOverdueTicketsPagination() {
    const totalPages = Math.ceil(overdueTicketsData.length / overdueTicketsPageSize);

    if (totalPages <= 1) return;

    const paginationHtml = `
                <div class="pagination" style="display: flex; justify-content: center; align-items: center; padding: 15px; gap: 10px;" onclick="event.stopPropagation();">
                    <button onclick="event.stopPropagation(); changeOverdueTicketsPage(${overdueTicketsPage - 1});" 
                            ${overdueTicketsPage === 1 ? 'disabled' : ''}
                            style="padding: 5px 15px; border: 1px solid #ddd; background: ${overdueTicketsPage === 1 ? '#f5f5f5' : '#fff'}; cursor: ${overdueTicketsPage === 1 ? 'not-allowed' : 'pointer'}; border-radius: 4px;">
                        上一页
                    </button>
                    <span style="color: #666;">第 ${overdueTicketsPage} / ${totalPages} 页</span>
                    <button onclick="event.stopPropagation(); changeOverdueTicketsPage(${overdueTicketsPage + 1});" 
                            ${overdueTicketsPage === totalPages ? 'disabled' : ''}
                            style="padding: 5px 15px; border: 1px solid #ddd; background: ${overdueTicketsPage === totalPages ? '#f5f5f5' : '#fff'}; cursor: ${overdueTicketsPage === totalPages ? 'not-allowed' : 'pointer'}; border-radius: 4px;">
                        下一页
                    </button>
                </div>
            `;

    $('#overdueTicketsList').append(paginationHtml);
}

// 切换SLA超时工单列表页码
window.changeOverdueTicketsPage = function (page) {
    const totalPages = Math.ceil(overdueTicketsData.length / overdueTicketsPageSize);
    if (page < 1 || page > totalPages) return;

    overdueTicketsPage = page;
    renderOverdueTicketsPage();
};

// 数字动画效果
function animateNumber(element, targetValue, duration = 800, suffix = '') { // 添加 suffix 参数
    if (!element) return;
    // 从文本中提取数字，移除可能的后缀和逗号
    const currentText = element.textContent || '';
    const currentNumberMatch = currentText.match(/[\d\.]+/);
    const startValue = currentNumberMatch ? parseFloat(currentNumberMatch[0]) : 0;

    if (startValue === targetValue && currentText.endsWith(suffix)) return; // 如果值和后缀都相同，则不执行动画

    const startTime = performance.now();

    function update(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const currentValue = Math.floor(progress * (targetValue - startValue) + startValue);
        element.textContent = currentValue.toLocaleString();
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

// 更新工单状态图 (原趋势图逻辑，现在用于statusChart)
function updateStatusChart(data) { // Renamed from updateTrendChart
    const chartId = 'statusChart'; // Changed from trendChart to statusChart
    console.log('updateStatusChart被调用 - chartId:', chartId, 'data:', data);

    // 详细的数据检查
    console.log('updateStatusChart - data类型:', typeof data);
    console.log('updateStatusChart - data内容:', JSON.stringify(data));

    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
        console.error(`Chart element with ID '${chartId}' not found for updateTrendChart.`);
        return;
    }
    if (!charts[chartId] || !charts[chartId].instance || !data) {
        console.error('状态图更新失败 - charts[chartId]:', charts[chartId], 'data:', data);
        showChartError(chartId, '状态图数据错误或图表未初始化'); // Message updated
        return;
    }
    try {
        const categories = data.categories || [];
        const chartData = data.data || [];

        console.log('updateStatusChart - categories:', categories, '类型:', typeof categories, '长度:', categories.length);
        console.log('updateStatusChart - chartData:', chartData, '类型:', typeof chartData, '长度:', chartData.length);

        // 检查categories和chartData是否都是数组
        if (!Array.isArray(categories)) {
            console.error('updateStatusChart - categories不是数组:', categories);
            showChartError(chartId, '状态图数据格式错误：categories不是数组');
            return;
        }
        if (!Array.isArray(chartData)) {
            console.error('updateStatusChart - chartData不是数组:', chartData);
            showChartError(chartId, '状态图数据格式错误：chartData不是数组');
            return;
        }

        // 检查数组长度是否一致
        if (categories.length !== chartData.length) {
            console.error('updateStatusChart - 数组长度不一致 - categories长度:', categories.length, 'chartData长度:', chartData.length);
            showChartError(chartId, `状态图数据错误：数组长度不一致 (categories:${categories.length}, chartData:${chartData.length})`);
            return;
        }

        console.log('updateStatusChart - 数据验证通过，准备构建图表配置');

        const option = {
            tooltip: {
                trigger: 'axis',
                textStyle: { fontSize: 14 }
            },
            legend: {
                data: ['工单数量'],
                bottom: '0%',
                textStyle: { fontSize: 14 }
            },
            grid: { top: '10%', right: '8%', bottom: '15%', left: '12%', containLabel: true },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: categories,
                axisLabel: {
                    fontSize: 14,
                    interval: 'auto',
                    rotate: 0
                },
                axisLine: {
                    lineStyle: { width: 2 }
                }
            },
            yAxis: {
                type: 'value',
                axisLabel: { fontSize: 14 },
                axisLine: {
                    show: true,
                    lineStyle: { width: 2 }
                },
                splitLine: {
                    lineStyle: { type: 'dashed' }
                }
            },
            series: [
                {
                    name: '工单数量',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    itemStyle: { color: 'var(--primary)' },
                    areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(79, 70, 229, 0.3)' }, { offset: 1, color: 'rgba(79, 70, 229, 0)' }]) },
                    data: chartData
                }
            ]
        };

        console.log('updateStatusChart - 即将调用safeSetOption');
        const success = safeSetOption(chartId, option, true);
        if (success) {
            console.log('updateStatusChart - safeSetOption调用成功');
            hideChartLoadingAndError(chartId);
        }

        // 为图表添加点击事件
        charts[chartId].instance.off('click'); // 移除旧的点击事件监听器，防止重复绑定
        charts[chartId].instance.on('click', function (params) {
            if (params.componentType === 'series' || params.componentType === 'xAxis') {
                let clickedDate = params.name; // params.name 是X轴的标签，即日期
                console.log('图表点击日期:', clickedDate);
                // 假设data.categories中的日期已经是 YYYY-MM-DD 格式
                // 如果不是，需要在这里添加转换逻辑
                $('#customDateRangeInput').val(clickedDate + ' - ' + clickedDate);
                $('#dateRangePicker').val('custom').trigger('change');
            }
        });

    } catch (e) {
        console.error("更新状态图失败:", e);
        showChartError(chartId, '更新状态图失败: ' + e.message); // Message updated
    }
}

// 更新工单问题分类统计图 (现在用于issueChart)
function updateIssueChart(data) { // Renamed from updateCategoryChart
    const chartId = 'issueChart'; // Changed from categoryChart to issueChart
    const chartElement = document.getElementById(chartId);
    console.log('updateIssueChart被调用 - chartId:', chartId, 'data:', data);

    // 详细的数据检查
    console.log('updateIssueChart - data类型:', typeof data);
    console.log('updateIssueChart - data内容:', JSON.stringify(data));

    if (!chartElement) {
        console.error(`Chart element with ID '${chartId}' not found for updateCategoryChart.`);
        return;
    }
    if (!charts[chartId] || !charts[chartId].instance || !data) {
        console.error('工单问题分类统计图更新失败 - charts[chartId]:', charts[chartId], 'data:', data);
        showChartError(chartId, '工单问题分类统计数据错误或图表未初始化'); // Message updated
        return;
    }
    try {
        const labels = data.labels || [];
        const chartData = data.data || [];

        console.log('updateIssueChart - labels:', labels, '类型:', typeof labels, '长度:', labels.length);
        console.log('updateIssueChart - chartData:', chartData, '类型:', typeof chartData, '长度:', chartData.length);

        // 检查labels和chartData是否都是数组
        if (!Array.isArray(labels)) {
            console.error('updateIssueChart - labels不是数组:', labels);
            showChartError(chartId, '工单问题分类统计数据格式错误：labels不是数组');
            return;
        }
        if (!Array.isArray(chartData)) {
            console.error('updateIssueChart - chartData不是数组:', chartData);
            showChartError(chartId, '工单问题分类统计数据格式错误：chartData不是数组');
            return;
        }

        // 检查数组长度是否一致
        if (labels.length !== chartData.length) {
            console.error('updateIssueChart - 数组长度不一致 - labels长度:', labels.length, 'chartData长度:', chartData.length);
            showChartError(chartId, `工单问题分类统计数据错误：数组长度不一致 (labels:${labels.length}, chartData:${chartData.length})`);
            return;
        }

        // 检查labels数组是否包含undefined或null值
        const hasUndefinedLabels = labels.some(label => label === undefined || label === null);
        if (hasUndefinedLabels) {
            console.error('updateIssueChart - labels数组包含undefined或null值:', labels);
            showChartError(chartId, '工单问题分类统计数据错误：labels包含空值');
            return;
        }

        console.log('updateIssueChart - 数据验证通过，准备构建图表配置');

        // 缓存数据用于视图切换
        issueChartDataCache = { labels: [...labels], data: [...chartData] };

        // 使用新的渲染函数
        renderIssueChart(issueChartDataCache);
    } catch (e) {
        console.error("更新工单问题分类统计图失败:", e);
        console.error("错误堆栈:", e.stack);
        showChartError(chartId, '更新工单问题分类统计图失败: ' + e.message);
    }
}

// 工单问题分类统计图表当前视图类型
let currentIssueChartView = 'count';
let issueChartDataCache = null;

// 切换工单问题分类统计图表视图
window.switchIssueChartView = function (viewType) {
    currentIssueChartView = viewType;

    // 更新按钮样式
    const buttons = document.querySelectorAll('.chart-card:nth-child(3) .chart-actions button');
    buttons.forEach(btn => {
        if (btn.textContent === '数量' && viewType === 'count') {
            btn.classList.add('active');
        } else if (btn.textContent === '趋势' && viewType === 'trend') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 使用缓存的数据重新渲染图表
    if (issueChartDataCache) {
        renderIssueChart(issueChartDataCache);
    }
};

// 渲染工单问题分类统计图表
function renderIssueChart(data) {
    const chartId = 'issueChart';
    const chartElement = document.getElementById(chartId);

    if (!chartElement || !charts[chartId] || !charts[chartId].instance) {
        console.error('工单问题分类统计图表未初始化');
        return;
    }

    if (!data || !data.labels || !data.data) {
        console.error('工单问题分类统计数据格式错误');
        return;
    }

    const labels = data.labels;
    const chartData = data.data;

    let option;

    if (currentIssueChartView === 'count') {
        // 数量视图 - 柱状图
        option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                textStyle: { fontSize: 14 },
                formatter: function (params) {
                    const item = params[0];
                    return `${item.name}<br/>工单数量: ${item.value}`;
                }
            },
            legend: { show: false },
            grid: { top: '10%', right: '8%', bottom: '20%', left: '12%', containLabel: true },
            xAxis: {
                type: 'category',
                data: labels,
                axisLabel: {
                    fontSize: 12,
                    interval: 0,
                    rotate: 30,
                    margin: 15,
                    formatter: function (value) {
                        if (value && value.length > 8) {
                            return value.substring(0, 8) + '...';
                        }
                        return value;
                    }
                },
                axisLine: { lineStyle: { width: 2 } }
            },
            yAxis: {
                type: 'value',
                name: '工单数量',
                nameTextStyle: { fontSize: 12, padding: [0, 0, 0, 20] },
                axisLabel: { fontSize: 14 },
                axisLine: { show: true, lineStyle: { width: 2 } },
                splitLine: { lineStyle: { type: 'dashed' } }
            },
            series: [{
                name: '工单数量',
                type: 'bar',
                barWidth: '50%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'var(--primary-light)' },
                        { offset: 1, color: 'var(--primary)' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}',
                    fontSize: 12
                },
                data: chartData
            }]
        };
    } else {
        // 趋势视图 - 折线图
        option = {
            tooltip: {
                trigger: 'axis',
                textStyle: { fontSize: 14 },
                formatter: function (params) {
                    const item = params[0];
                    return `${item.name}<br/>工单数量: ${item.value}`;
                }
            },
            legend: { show: false },
            grid: { top: '10%', right: '8%', bottom: '20%', left: '12%', containLabel: true },
            xAxis: {
                type: 'category',
                data: labels,
                axisLabel: {
                    fontSize: 12,
                    interval: 0,
                    rotate: 30,
                    margin: 15,
                    formatter: function (value) {
                        if (value && value.length > 8) {
                            return value.substring(0, 8) + '...';
                        }
                        return value;
                    }
                },
                axisLine: { lineStyle: { width: 2 } }
            },
            yAxis: {
                type: 'value',
                name: '工单数量',
                nameTextStyle: { fontSize: 12, padding: [0, 0, 0, 20] },
                axisLabel: { fontSize: 14 },
                axisLine: { show: true, lineStyle: { width: 2 } },
                splitLine: { lineStyle: { type: 'dashed' } }
            },
            series: [{
                name: '工单数量',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                    width: 3,
                    color: 'var(--primary)'
                },
                itemStyle: {
                    color: 'var(--primary)',
                    borderWidth: 2,
                    borderColor: '#fff'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                    ])
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}',
                    fontSize: 12
                },
                data: chartData
            }]
        };
    }

    const success = safeSetOption(chartId, option, true);
    if (success) {
        hideChartLoadingAndError(chartId);
    }
}

// 更新满意度图 (原负责人图逻辑，现在用于satisfactionChart)
function updateSatisfactionChart(data) { // Renamed from updateResponsibleChart
    const chartId = 'satisfactionChart'; // Changed from responsibleChart to satisfactionChart
    console.log('updateSatisfactionChart被调用 - chartId:', chartId, 'data:', data);

    // 详细的数据检查
    console.log('updateSatisfactionChart - data类型:', typeof data);
    console.log('updateSatisfactionChart - data内容:', JSON.stringify(data));

    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
        console.error(`Chart element with ID '${chartId}' not found for updateResponsibleChart.`);
        return;
    }
    if (!charts[chartId] || !charts[chartId].instance || !data) {
        console.error('满意度图更新失败 - charts[chartId]:', charts[chartId], 'data:', data);
        showChartError(chartId, '满意度图数据错误或图表未初始化'); // Message updated
        return;
    }
    try {
        // 兼容两种数据格式：names/counts 或 labels/data
        const names = data.names || data.labels || [];
        const counts = data.counts || data.data || [];

        console.log('updateSatisfactionChart - names:', names, '类型:', typeof names, '长度:', names.length);
        console.log('updateSatisfactionChart - counts:', counts, '类型:', typeof counts, '长度:', counts.length);

        // 检查names和counts是否都是数组
        if (!Array.isArray(names)) {
            console.error('updateSatisfactionChart - names不是数组:', names);
            showChartError(chartId, '满意度图数据格式错误：names不是数组');
            return;
        }
        if (!Array.isArray(counts)) {
            console.error('updateSatisfactionChart - counts不是数组:', counts);
            showChartError(chartId, '满意度图数据格式错误：counts不是数组');
            return;
        }

        // 检查数组长度是否一致
        if (names.length !== counts.length) {
            console.error('updateSatisfactionChart - 数组长度不一致 - names长度:', names.length, 'counts长度:', counts.length);
            showChartError(chartId, `满意度图数据错误：数组长度不一致 (names:${names.length}, counts:${counts.length})`);
            return;
        }

        // 检查数组元素是否都存在
        const hasUndefinedNames = names.some(name => name === undefined || name === null);
        const hasUndefinedCounts = counts.some(count => count === undefined || count === null);
        if (hasUndefinedNames) {
            console.error('updateSatisfactionChart - names数组包含undefined或null值:', names);
            showChartError(chartId, '满意度图数据错误：names包含空值');
            return;
        }
        if (hasUndefinedCounts) {
            console.error('updateSatisfactionChart - counts数组包含undefined或null值:', counts);
            showChartError(chartId, '满意度图数据错误：counts包含空值');
            return;
        }

        console.log('updateSatisfactionChart - 数据验证通过，准备构建图表数据');

        const chartData = names.map((name, index) => ({
            value: counts[index] || 0,
            name: name
        }));

        console.log('updateSatisfactionChart - 构建的图表数据:', chartData);

        // 计算总数和百分比
        const total = counts.reduce((sum, count) => sum + count, 0);

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    return `${params.name}<br/>数量: ${params.value}<br/>占比: ${params.percent}%`;
                }
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                top: 'middle',
                data: names,
                formatter: function (name) {
                    const item = chartData.find(d => d.name === name);
                    const count = item ? item.value : 0;
                    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                    return `${name}  ${count}个 (${percent}%)`;
                }
            },
            series: [
                {
                    name: '工单占比',
                    type: 'pie',
                    radius: ['50%', '70%'],
                    center: ['60%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: true,
                        position: 'outside',
                        formatter: function (params) {
                            return `{name|${params.name}}\n{count|${params.value}个} {percent|${params.percent}%}`;
                        },
                        rich: {
                            name: {
                                fontSize: 12,
                                color: '#666',
                                lineHeight: 20
                            },
                            count: {
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: '#333'
                            },
                            percent: {
                                fontSize: 12,
                                color: '#999'
                            }
                        }
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: '14',
                            fontWeight: 'bold'
                        }
                    },
                    labelLine: {
                        show: true,
                        length: 15,
                        length2: 10
                    },
                    data: chartData
                }
            ]
        };

        console.log('updateSatisfactionChart - 即将调用safeSetOption');
        const success = safeSetOption(chartId, option, true);
        if (success) {
            console.log('updateSatisfactionChart - safeSetOption调用成功');
            hideChartLoadingAndError(chartId);
        }
    } catch (e) {
        console.error("更新满意度图失败:", e);
        console.error("错误堆栈:", e.stack);
        showChartError(chartId, '更新满意度图失败: ' + e.message); // Message updated
    }
}

// 切换工程师图表周期
window.switchEngineerChart = function (period) {
    currentEngineerChartPeriod = period;
    engineerChartUseGlobalDateRange = false; // 用户手动选择了特定周期

    // 更新按钮样式 - 只更新工程师图表的按钮
    const chartCard = document.querySelector('.chart-card:has(#satisfactionChart)');
    if (chartCard) {
        const buttons = chartCard.querySelectorAll('.chart-actions button');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === '本周' && period === 'this_week') {
                btn.classList.add('active');
            } else if (btn.textContent === '上周' && period === 'last_week') {
                btn.classList.add('active');
            } else if (btn.textContent === '全部' && period === 'all') {
                btn.classList.add('active');
            }
        });
    }

    // 重新加载数据，传递 engineer_period 参数
    loadEngineerChartData(period);
};

// 重置工程师图表为使用全局日期范围
function resetEngineerChartToGlobal() {
    engineerChartUseGlobalDateRange = true;
    currentEngineerChartPeriod = 'this_week';

    // 更新按钮样式 - 选中"本周"
    const chartCard = document.querySelector('.chart-card:has(#satisfactionChart)');
    if (chartCard) {
        const buttons = chartCard.querySelectorAll('.chart-actions button');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === '本周') {
                btn.classList.add('active');
            }
        });
    }
}

// 加载工程师图表数据
function loadEngineerChartData(period) {
    // 获取其他筛选条件
    const classification = $('#classificationFilter').val();
    const priority = $('#priorityFilter').val();
    const search = $('#searchInput').val();

    // 构建请求参数
    let requestData = {
        classification_filter: classification,
        priority_filter: priority,
        search: search
    };

    // 如果不是使用全局日期范围，则添加 engineer_period 参数
    if (!engineerChartUseGlobalDateRange) {
        requestData.engineer_period = period;
    }

    $.ajax({
        url: getAnalyticsUrl,
        type: 'GET',
        data: requestData,
        dataType: 'json',
        success: function (res) {
            if (res.code === 200 && res.data && res.data.assignee_stats) {
                engineerChartData[period] = res.data.assignee_stats;
                updateSatisfactionChart(res.data.assignee_stats);
            }
        },
        error: function (xhr, status, error) {
            console.error('加载工程师图表数据失败:', error);
        }
    });
}

// 切换状态图表周期
window.switchStatusChart = function (period) {
    currentStatusChartPeriod = period;
    statusChartUseGlobalDateRange = false; // 用户手动选择了特定周期

    // 更新按钮样式 - 只更新状态图表的按钮
    const chartCard = document.querySelector('.chart-card:has(#statusChart)');
    if (chartCard) {
        const buttons = chartCard.querySelectorAll('.chart-actions button');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === '本周' && period === 'this_week') {
                btn.classList.add('active');
            } else if (btn.textContent === '上周' && period === 'last_week') {
                btn.classList.add('active');
            } else if (btn.textContent === '全部' && period === 'all') {
                btn.classList.add('active');
            }
        });
    }

    // 重新加载数据，传递 status_period 参数
    loadStatusChartData(period);
};

// 重置状态图表为使用全局日期范围
function resetStatusChartToGlobal() {
    statusChartUseGlobalDateRange = true;
    currentStatusChartPeriod = 'this_week';

    // 更新按钮样式 - 选中"本周"
    const chartCard = document.querySelector('.chart-card:has(#statusChart)');
    if (chartCard) {
        const buttons = chartCard.querySelectorAll('.chart-actions button');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === '本周') {
                btn.classList.add('active');
            }
        });
    }
}

// 加载状态图表数据
function loadStatusChartData(period) {
    // 获取其他筛选条件
    const classification = $('#classificationFilter').val();
    const priority = $('#priorityFilter').val();
    const search = $('#searchInput').val();

    // 构建请求参数
    let requestData = {
        classification_filter: classification,
        priority_filter: priority,
        search: search
    };

    // 如果不是使用全局日期范围，则添加 status_period 参数
    if (!statusChartUseGlobalDateRange) {
        requestData.status_period = period;
    }

    $.ajax({
        url: getAnalyticsUrl,
        type: 'GET',
        data: requestData,
        dataType: 'json',
        success: function (res) {
            if (res.code === 200 && res.data && res.data.trendChart) {
                statusChartData[period] = res.data.trendChart;
                updateStatusChart(res.data.trendChart);
            }
        },
        error: function (xhr, status, error) {
            console.error('加载状态图表数据失败:', error);
        }
    });
}

// 切换工单问题分类统计周期
window.switchIssueChartPeriod = function (period) {
    currentIssueChartPeriod = period;
    issueChartUseGlobalDateRange = false; // 用户手动选择了特定周期

    // 更新按钮样式 - 只更新工单问题分类统计图表的按钮
    const chartCard = document.querySelector('.chart-card:has(#issueChart)');
    if (chartCard) {
        const buttons = chartCard.querySelectorAll('.chart-actions button');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === '本周' && period === 'this_week') {
                btn.classList.add('active');
            } else if (btn.textContent === '上周' && period === 'last_week') {
                btn.classList.add('active');
            } else if (btn.textContent === '全部' && period === 'all') {
                btn.classList.add('active');
            }
        });
    }

    // 重新加载数据，传递 issue_period 参数
    loadIssueChartData(period);
};

// 重置工单问题分类统计图表为使用全局日期范围
function resetIssueChartToGlobal() {
    issueChartUseGlobalDateRange = true;
    currentIssueChartPeriod = 'this_week';

    // 更新按钮样式 - 选中"本周"
    const chartCard = document.querySelector('.chart-card:has(#issueChart)');
    if (chartCard) {
        const buttons = chartCard.querySelectorAll('.chart-actions button');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === '本周') {
                btn.classList.add('active');
            }
        });
    }
}

// 加载工单问题分类统计数据
function loadIssueChartData(period) {
    // 获取其他筛选条件
    const classification = $('#classificationFilter').val();
    const priority = $('#priorityFilter').val();
    const search = $('#searchInput').val();

    // 构建请求参数
    let requestData = {
        classification_filter: classification,
        priority_filter: priority,
        search: search
    };

    // 如果不是使用全局日期范围，则添加 issue_period 参数
    if (!issueChartUseGlobalDateRange) {
        requestData.issue_period = period;
    }

    $.ajax({
        url: getAnalyticsUrl,
        type: 'GET',
        data: requestData,
        dataType: 'json',
        success: function (res) {
            if (res.code === 200 && res.data && res.data.categoryChart) {
                issueChartData[period] = res.data.categoryChart;
                renderIssueChart(res.data.categoryChart);
            }
        },
        error: function (xhr, status, error) {
            console.error('加载工单问题分类统计数据失败:', error);
        }
    });
}

// 切换优先级图表周期
window.switchPriorityChart = function (period) {
    currentPriorityChartPeriod = period;
    priorityChartUseGlobalDateRange = false; // 用户手动选择了特定周期

    // 更新按钮样式 - 只更新优先级图表的按钮
    const chartCard = document.querySelector('.chart-card:has(#timeChart)');
    if (chartCard) {
        const buttons = chartCard.querySelectorAll('.chart-actions button');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === '本周' && period === 'this_week') {
                btn.classList.add('active');
            } else if (btn.textContent === '上周' && period === 'last_week') {
                btn.classList.add('active');
            } else if (btn.textContent === '全部' && period === 'all') {
                btn.classList.add('active');
            }
        });
    }

    // 重新加载数据，传递 priority_period 参数
    loadPriorityChartData(period);
};

// 重置优先级图表为使用全局日期范围
function resetPriorityChartToGlobal() {
    priorityChartUseGlobalDateRange = true;
    currentPriorityChartPeriod = 'this_week';

    // 更新按钮样式 - 选中"本周"
    const chartCard = document.querySelector('.chart-card:has(#timeChart)');
    if (chartCard) {
        const buttons = chartCard.querySelectorAll('.chart-actions button');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === '本周') {
                btn.classList.add('active');
            }
        });
    }
}

// 加载优先级图表数据
function loadPriorityChartData(period) {
    // 获取其他筛选条件
    const classification = $('#classificationFilter').val();
    const priority = $('#priorityFilter').val();
    const search = $('#searchInput').val();

    // 构建请求参数
    let requestData = {
        classification_filter: classification,
        priority_filter: priority,
        search: search
    };

    // 如果不是使用全局日期范围，则添加 priority_period 参数
    if (!priorityChartUseGlobalDateRange) {
        requestData.priority_period = period;
    }

    $.ajax({
        url: getAnalyticsUrl,
        type: 'GET',
        data: requestData,
        dataType: 'json',
        success: function (res) {
            if (res.code === 200 && res.data && res.data.priorityChart) {
                priorityChartData[period] = res.data.priorityChart;
                renderPriorityChart(res.data.priorityChart);
            }
        },
        error: function (xhr, status, error) {
            console.error('加载优先级图表数据失败:', error);
        }
    });
}

// 渲染优先级图表
function renderPriorityChart(data) {
    const chartId = 'timeChart';
    const chartElement = document.getElementById(chartId);

    if (!chartElement || !charts[chartId] || !charts[chartId].instance) {
        console.error('优先级图表未初始化');
        return;
    }

    if (!data || !data.labels || !data.data) {
        console.error('优先级图表数据格式错误');
        return;
    }

    const labels = data.labels;
    const chartData = data.data;

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            textStyle: { fontSize: 14 },
            formatter: function (params) {
                const item = params[0];
                return `${item.name}<br/>工单数量: ${item.value}`;
            }
        },
        legend: { show: false },
        grid: { top: '10%', right: '8%', bottom: '15%', left: '12%', containLabel: true },
        xAxis: {
            type: 'category',
            data: labels,
            axisLabel: {
                fontSize: 14,
                interval: 0
            },
            axisLine: { lineStyle: { width: 2 } }
        },
        yAxis: {
            type: 'value',
            name: '工单数量',
            nameTextStyle: { fontSize: 12 },
            axisLabel: { fontSize: 14 },
            axisLine: { show: true, lineStyle: { width: 2 } },
            splitLine: { lineStyle: { type: 'dashed' } }
        },
        series: [{
            name: '工单数量',
            type: 'bar',
            barWidth: '50%',
            itemStyle: {
                color: function (params) {
                    // 根据优先级设置不同颜色
                    const colors = {
                        'P1': '#dc3545', // 红色 - 紧急
                        'P2': '#fd7e14', // 橙色 - 高
                        'P3': '#ffc107', // 黄色 - 中
                        'P4': '#28a745'  // 绿色 - 低
                    };
                    return colors[params.name] || '#3b82f6';
                },
                borderRadius: [4, 4, 0, 0]
            },
            label: {
                show: true,
                position: 'top',
                formatter: '{c}',
                fontSize: 12
            },
            data: chartData
        }]
    };

    const success = safeSetOption(chartId, option, true);
    if (success) {
        hideChartLoadingAndError(chartId);
    }
}

// 更新工程师图表数据
function updateEngineerChartData(data) {
    // 存储本周和上周的数据
    if (data.assignee_stats) {
        engineerChartData.this_week = data.assignee_stats;
    }
    if (data.previous_week && data.previous_week.assignee_stats) {
        engineerChartData.last_week = data.previous_week.assignee_stats;
    }

    // 根据当前选中的周期更新图表
    const currentData = engineerChartData[currentEngineerChartPeriod];
    if (currentData) {
        updateSatisfactionChart(currentData);
    }
}

// 更新工程师工单处理统计
function updateEngineerStats(assigneeData) {
    const container = document.querySelector('.engineer-stats');
    if (!container) {
        console.error('Engineer stats container not found.');
        return;
    }
    if (!assigneeData || !Array.isArray(assigneeData)) {
        console.warn('No assignee data to display or data is not an array.');
        container.innerHTML = '<p style="text-align:center; color: var(--gray);">暂无工程师统计数据。</p>';
        return;
    }

    console.log("Updating engineer stats with data:", assigneeData);
    container.innerHTML = ''; // 清空现有内容

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#22d3ee'];
    let colorIndex = 0;

    assigneeData.forEach(stat => {
        const row = document.createElement('div');
        row.className = 'engineer-stat-row';

        const engineerName = document.createElement('div');
        engineerName.className = 'engineer-name';
        engineerName.textContent = stat.name || '未知工程师'; // 使用 name 而不是 assignee

        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        // 使用后端计算好的 completion_rate，而不是前端计算
        const completionRateVal = parseFloat(stat.completion_rate) || 0;
        progressFill.style.width = `${completionRateVal}%`;
        progressFill.style.background = colors[colorIndex % colors.length];
        colorIndex++;

        progressBar.appendChild(progressFill);

        const statValue = document.createElement('div');
        statValue.className = 'stat-value';
        statValue.textContent = `${stat.total_tickets || 0} 个工单`;

        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(statValue);

        const statsDetails = document.createElement('div');
        statsDetails.className = 'stats-details';

        const completionRateDetail = document.createElement('div');
        completionRateDetail.className = 'detail-item';
        completionRateDetail.innerHTML = `<span>完成率</span><span class="detail-value">${completionRateVal.toFixed(1)}%</span>`;

        const avgTimeDetail = document.createElement('div');
        avgTimeDetail.className = 'detail-item';
        // avg_resolution_time 可能是格式化的字符串或者数值
        let avgTimeText = 'N/A';
        if (stat.avg_resolution_time !== null && stat.avg_resolution_time !== undefined) {
            if (stat.avg_resolution_time === 'N/A') {
                avgTimeText = 'N/A';
            } else if (typeof stat.avg_resolution_time === 'string' && !isNaN(parseFloat(stat.avg_resolution_time))) {
                avgTimeText = `${parseFloat(stat.avg_resolution_time).toFixed(1)}小时`;
            } else if (typeof stat.avg_resolution_time === 'number') {
                avgTimeText = `${stat.avg_resolution_time.toFixed(1)}小时`;
            } else {
                avgTimeText = stat.avg_resolution_time;
            }
        }
        avgTimeDetail.innerHTML = `<span>平均耗时</span><span class="detail-value">${avgTimeText}</span>`;

        const satisfactionDetail = document.createElement('div');
        satisfactionDetail.className = 'detail-item';
        let satisfactionText = 'N/A';
        if (stat.satisfaction_score !== null && stat.satisfaction_score !== undefined) {
            if (typeof stat.satisfaction_score === 'number') {
                satisfactionText = `${stat.satisfaction_score.toFixed(1)}/5.0`;
            } else if (typeof stat.satisfaction_score === 'string' && stat.satisfaction_score.includes('/')) {
                satisfactionText = stat.satisfaction_score;
            } else {
                satisfactionText = `${parseFloat(stat.satisfaction_score).toFixed(1)}/5.0`;
            }
        } else if (stat.total_tickets > 0) { // Only show N/A if there are tickets but no score
            satisfactionText = '暂无评分';
        }

        satisfactionDetail.innerHTML = `<span>满意度</span><span class="detail-value">${satisfactionText}</span>`;

        statsDetails.appendChild(completionRateDetail);
        statsDetails.appendChild(avgTimeDetail);
        statsDetails.appendChild(satisfactionDetail);

        row.appendChild(engineerName);
        row.appendChild(progressContainer);
        row.appendChild(statsDetails);

        container.appendChild(row);
    });

    if (assigneeData.length === 0) {
        container.innerHTML = '<p style="text-align:center; color: var(--gray);">当前筛选条件下无工程师数据。</p>';
    }
}

// 切换图表全屏
function toggleFullscreen(chartId) {
    const chartCard = document.getElementById(chartId).closest('.chart-card');
    if (chartCard) {
        chartCard.classList.toggle('fullscreen');
        // 强制图表重绘以适应新的容器大小
        if (charts[chartId] && charts[chartId].instance) {
            setTimeout(() => charts[chartId].instance.resize(), 300); // 延迟以等待动画完成
        }
    }
}

// window.onload确保所有资源加载完毕后执行
window.onload = function () {
    console.log("window.onload开始执行");
    updateCurrentDate(); // 新增：更新当前日期
    console.log("准备调用initCharts");
    initCharts();
    console.log("initCharts调用完成，charts对象:", charts);
    // loadData(); // 页面加载时首次加载数据 - 移动到laydate初始化后，或根据逻辑调整

    // 为筛选器添加事件监听
    const dateRangePicker = document.getElementById('dateRangePicker');
    if (dateRangePicker) {
        dateRangePicker.addEventListener('change', function () {
            console.log("日期范围选择器变化 - 新值:", this.value);
            if (this.value === 'custom') {
                $('#customDateRangeInput').show();
                if (typeof layui !== 'undefined' && layui.laydate) {
                    layui.use('laydate', function () {
                        var laydate = layui.laydate;
                        // 确保 laydate 实例在需要时被创建或更新
                        var customDateInstance = laydate.render({
                            elem: '#customDateRangeInput',
                            type: 'date',
                            range: true,
                            show: true, // 直接显示
                            // trigger: 'click', // 改为直接显示
                            done: function (value, date, endDate) {
                                console.log('自定义日期范围选择: ' + value);
                                if (value) {
                                    loadData();
                                }
                                // 选择后可以考虑隐藏输入框或根据需求处理
                                // $('#customDateRangeInput').hide(); 
                            }
                        });
                    });
                }
            } else {
                $('#customDateRangeInput').hide();
                $('#customDateRangeInput').val('');
                console.log("调用loadData，非自定义日期范围");
                loadData();
            }
        });
    }

    const classificationFilter = document.getElementById('classificationFilter');
    if (classificationFilter) classificationFilter.addEventListener('change', loadData);

    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter) priorityFilter.addEventListener('change', loadData);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', debounce(loadData, 500)); // 添加防抖

    loadData(); // 确保在所有事件监听器设置完毕后，进行首次数据加载

    // 设置定时器，每30秒自动刷新一次数据
    setInterval(function () {
        loadData();
    }, 30000); // 30000毫秒 = 30秒
};

// 新增：更新当前日期和星期的函数
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDateDisplay');
    if (dateElement) {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const daysOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const dayOfWeek = daysOfWeek[now.getDay()];
        dateElement.textContent = `${year}年${month}月${day}日 ${dayOfWeek}`;
    }
}

function updateCharts(data) {
    console.log('updateCharts被调用 - data:', data);
    try {
        // 验证所有图表实例状态
        console.log('updateCharts - 图表实例状态检查:');
        Object.keys(charts).forEach(chartId => {
            console.log(`  ${chartId}: instance=${charts[chartId].instance}, loading=${charts[chartId].loading}, error=${charts[chartId].error}`);
        });

        // 使用正确的键名从后端数据中获取图表数据
        if (charts.statusChart.instance && data.trendChart) {
            console.log('更新statusChart');
            updateStatusChart(data.trendChart);
        }

        if (charts.issueChart.instance && data.categoryChart) {
            console.log('更新issueChart - data.categoryChart:', data.categoryChart);
            updateIssueChart(data.categoryChart);
        } else {
            console.warn('issueChart未更新 - charts.issueChart.instance:', charts.issueChart.instance, 'data.categoryChart:', data.categoryChart);
        }

        // 更新工程师工单处理占比图表
        if (data.assignee_stats) {
            console.log('更新工程师图表数据');
            updateEngineerChartData(data);
        }

        if (charts.timeChart.instance && data.timeAnalysisChart) {
            console.log('更新timeChart');
            updateTimeChart(data.timeAnalysisChart);
        }

    } catch (e) {
        console.error("Error updating charts:", e);
        console.error("错误堆栈:", e.stack);
    }
}

// 单独为 timeChart 创建更新函数
function updateTimeChart(chartData) {
    console.log('updateTimeChart被调用 - chartData:', chartData);

    // 详细的数据检查
    console.log('updateTimeChart - chartData类型:', typeof chartData);
    console.log('updateTimeChart - chartData内容:', JSON.stringify(chartData));

    if (!charts.timeChart.instance || !chartData) {
        console.warn('updateTimeChart - timeChart实例或数据不存在 - charts.timeChart.instance:', charts.timeChart.instance, 'chartData:', chartData);
        return;
    }

    if (!chartData.categories || !chartData.data) {
        console.error('updateTimeChart - 数据格式错误 - categories:', chartData.categories, 'data:', chartData.data);
        showChartError('timeChart', '工单状态数据格式错误');
        return;
    }

    const categories = chartData.categories;
    const data = chartData.data;

    console.log('updateTimeChart - categories:', categories, '类型:', typeof categories, '长度:', categories.length);
    console.log('updateTimeChart - data:', data, '类型:', typeof data, '长度:', data.length);

    // 检查categories和data是否都是数组
    if (!Array.isArray(categories)) {
        console.error('updateTimeChart - categories不是数组:', categories);
        showChartError('timeChart', '工单状态数据格式错误：categories不是数组');
        return;
    }
    if (!Array.isArray(data)) {
        console.error('updateTimeChart - data不是数组:', data);
        showChartError('timeChart', '工单状态数据格式错误：data不是数组');
        return;
    }

    // 检查数组长度是否一致
    if (categories.length !== data.length) {
        console.error('updateTimeChart - 数组长度不一致 - categories长度:', categories.length, 'data长度:', data.length);
        showChartError('timeChart', `工单状态数据错误：数组长度不一致 (categories:${categories.length}, data:${data.length})`);
        return;
    }

    // 检查categories数组是否包含undefined或null值
    const hasUndefinedCategories = categories.some(cat => cat === undefined || cat === null);
    if (hasUndefinedCategories) {
        console.error('updateTimeChart - categories数组包含undefined或null值:', categories);
        showChartError('timeChart', '工单状态数据错误：categories包含空值');
        return;
    }

    console.log('updateTimeChart - 数据验证通过，准备构建图表配置');

    const timeOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: '{b}: {c} 小时'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: categories,
            axisTick: {
                alignWithLabel: true
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: '{value} h'
            }
        },
        series: [{
            name: '平均耗时',
            type: 'bar',
            barWidth: '60%',
            data: data,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#83bff6' },
                    { offset: 0.5, color: '#188df0' },
                    { offset: 1, color: '#188df0' }
                ])
            }
        }]
    };
    console.log('updateTimeChart - 即将调用safeSetOption');
    const success = safeSetOption('timeChart', timeOption, true);
    if (success) {
        console.log('updateTimeChart - safeSetOption调用成功');
        hideChartLoadingAndError('timeChart');
    }
}

function hideChartLoadingAndError(chartId) {
    $(`#${chartId}-loading`).hide();
    $(`#${chartId}-error`).hide();
}
