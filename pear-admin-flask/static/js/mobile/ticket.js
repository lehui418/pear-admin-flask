/**
 * 移动端工单功能
 */

// 分页相关变量
var currentPage = 1;
var pageSize = 4;
var totalPages = 1;
var isLoading = false;
var allTickets = []; // 存储所有已加载的工单

// 当前要删除的工单ID
var currentDeleteTicketId = null;

// 加载工单列表
function loadTicketList(page, isLoadMore) {
    var $ = layui.jquery;
    
    if (page) {
        currentPage = page;
    }
    
    // 重置搜索模式
    isSearchMode = false;
    
    if (isLoading) return;
    
    isLoading = true;
    
    // 如果不是加载更多，显示加载中
    if (!isLoadMore) {
        $('#ticketList').html('<div class="loading-hint">加载中...</div>');
        allTickets = [];
        // 显示加载更多按钮
        $('#loadMore').show();
        isSearchMode = false;
    }
    
    // 调用PC端接口获取数据
    $.ajax({
        url: '/system/ticket/table',
        type: 'GET',
        data: {
            page: currentPage,
            limit: pageSize
        },
        dataType: 'json',
        success: function(res) {
            isLoading = false;
            
            if (res.code === 0 && res.data && res.data.length > 0) {
                // 计算总页数
                var totalCount = res.count || res.data.length;
                totalPages = Math.ceil(totalCount / pageSize);
                
                if (isLoadMore) {
                    // 追加数据
                    allTickets = allTickets.concat(res.data);
                    appendTicketList(res.data);
                } else {
                    // 重置数据
                    allTickets = res.data;
                    renderTicketList(res.data);
                }
                
                // 更新加载更多状态
                updateLoadMoreStatus();
            } else {
                if (!isLoadMore) {
                    $('#ticketList').html(renderEmptyState());
                }
                updateLoadMoreStatus();
            }
        },
        error: function() {
            isLoading = false;
            if (!isLoadMore) {
                $('#ticketList').html(renderEmptyState('error'));
            }
            updateLoadMoreStatus();
        }
    });
}

// 追加工单列表（用于加载更多）
function appendTicketList(tickets) {
    var $ = layui.jquery;
    var html = '';
    
    tickets.forEach(function(ticket) {
        html += renderTicketCard(ticket);
    });
    
    $('#ticketList').append(html);
}

// 加载更多工单
function loadMoreTickets() {
    if (isLoading || currentPage >= totalPages) return;
    
    var $ = layui.jquery;
    var loadMoreEl = $('#loadMore');
    
    // 显示加载中状态
    loadMoreEl.addClass('loading');
    
    // 加载下一页
    currentPage++;
    loadTicketList(currentPage, true);
}

// 更新加载更多状态
function updateLoadMoreStatus() {
    var $ = layui.jquery;
    var loadMoreEl = $('#loadMore');
    var loadMoreText = loadMoreEl.find('.load-more-text');
    
    loadMoreEl.removeClass('loading');
    
    if (currentPage >= totalPages) {
        // 没有更多数据
        loadMoreEl.addClass('no-more');
        loadMoreText.text('没有更多工单了');
    } else {
        // 还有更多数据
        loadMoreEl.removeClass('no-more');
        loadMoreText.text('上拉加载更多');
    }
}

// 初始化滚动监听（上拉加载 + 回到顶部）
function initScrollListener() {
    var scrollTimeout;
    var backToTopEl = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        // 使用节流，避免频繁触发
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(function() {
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            var windowHeight = window.innerHeight;
            var documentHeight = document.documentElement.scrollHeight;
            
            // 显示/隐藏回到顶部按钮
            if (backToTopEl) {
                if (scrollTop > 300) {
                    backToTopEl.classList.add('show');
                } else {
                    backToTopEl.classList.remove('show');
                }
            }
            
            // 距离底部100px时触发加载
            if (scrollTop + windowHeight >= documentHeight - 100) {
                if (!isLoading && currentPage < totalPages && !isSearchMode) {
                    loadMoreTickets();
                }
            }
        }, 100);
    }, { passive: true });
}

// 回到顶部
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}



// 渲染工单列表
function renderTicketList(tickets) {
    var $ = layui.jquery;
    var html = '';
    
    tickets.forEach(function(ticket) {
        html += renderTicketCard(ticket);
    });
    
    $('#ticketList').html(html);
}

// 渲染单个工单卡片
function renderTicketCard(ticket) {
    var priorityClass = 'priority-' + (ticket.priority || 'P3');
    var statusClass = 'status-' + (ticket.status || '待处理');
    
    return '<div class="ticket-card" data-id="' + ticket.id + '">' +
        '<div class="ticket-title-row">' +
            '<span class="info-label">工单标题：</span>' +
            '<span class="ticket-title-text">' + (ticket.title || '无标题') + '</span>' +
        '</div>' +
        '<div class="ticket-info">' +
            '<span class="info-label">优先级：</span>' +
            '<span class="priority-tag ' + priorityClass + '">' + (ticket.priority || 'P3') + '</span>' +
            '<span class="info-label" style="margin-left: 12px;">状态：</span>' +
            '<span class="status-tag ' + statusClass + '">' + (ticket.status || '待处理') + '</span>' +
        '</div>' +
        '<div class="customer-name">' +
            '<span class="info-label">客户：</span>' +
            '<span class="customer-text">' + (ticket.customer_agent_name || '未知') + '</span>' +
        '</div>' +
        '<div class="ticket-actions">' +
            '<button class="action-btn view-btn" onclick="event.stopPropagation(); viewTicket(' + ticket.id + ')">查看</button>' +
            '<button class="action-btn edit-btn" onclick="event.stopPropagation(); editTicket(' + ticket.id + ')">编辑</button>' +
            '<button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteTicket(' + ticket.id + ')">删除</button>' +
        '</div>' +
    '</div>';
}

// 渲染空状态
function renderEmptyState(type) {
    var icon, title, desc, showAction;
    
    switch(type) {
        case 'error':
            icon = '⚠️';
            title = '加载失败';
            desc = '网络出现问题，请刷新重试';
            showAction = false;
            break;
        case 'search':
            icon = '🔍';
            title = '未找到工单';
            desc = '换个关键词试试';
            showAction = false;
            break;
        default:
            icon = '📋';
            title = '暂无工单';
            desc = '还没有工单记录，点击下方按钮创建第一个工单';
            showAction = true;
    }
    
    var html = '<div class="empty-state">' +
        '<div class="empty-icon">' + icon + '</div>' +
        '<div class="empty-title">' + title + '</div>' +
        '<div class="empty-desc">' + desc + '</div>';
    
    if (showAction) {
        html += '<a href="/system/ticket/add?mobile=1" class="empty-action">+ 创建工单</a>';
    }
    
    html += '</div>';
    
    return html;
}

// 查看工单
function viewTicket(ticketId) {
    window.location.href = '/system/ticket/view/' + ticketId + '?mobile=1';
}

// 编辑工单
function editTicket(ticketId) {
    window.location.href = '/system/ticket/edit/' + ticketId + '?mobile=1';
}

// 显示删除确认弹窗
function showDeleteModal(ticketId) {
    currentDeleteTicketId = ticketId;
    document.getElementById('deleteModal').classList.add('active');
}

// 隐藏删除确认弹窗
function hideDeleteModal() {
    currentDeleteTicketId = null;
    document.getElementById('deleteModal').classList.remove('active');
}

// 确认删除工单
function confirmDeleteTicket() {
    if (!currentDeleteTicketId) return;
    
    var ticketId = currentDeleteTicketId;
    hideDeleteModal();
    
    // 显示加载状态
    showLoading('删除中...');
    
    // 使用 FormData 格式提交，与后端接口兼容
    var formData = new FormData();
    formData.append('id', ticketId);
    
    fetch('/system/ticket/delete', {
        method: 'POST',
        body: formData
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(res) {
        hideLoading();
        if (res.code === 0 || res.success) {
            showToast('删除成功', 'success');
            loadTicketList(); // 刷新列表
        } else {
            showToast(res.msg || '删除失败', 'error');
        }
    })
    .catch(function(error) {
        hideLoading();
        console.error('删除失败:', error);
        showToast('删除失败，请重试', 'error');
    });
}

// 删除工单（旧函数，保留兼容）
function deleteTicket(ticketId) {
    showDeleteModal(ticketId);
}

// 搜索历史相关
var SEARCH_HISTORY_KEY = 'ticket_search_history';
var MAX_HISTORY_ITEMS = 10;

// 获取搜索历史
function getSearchHistory() {
    var history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
}

// 保存搜索历史
function saveSearchHistory(keyword) {
    if (!keyword || !keyword.trim()) return;
    
    var history = getSearchHistory();
    keyword = keyword.trim();
    
    // 移除重复项
    var index = history.indexOf(keyword);
    if (index > -1) {
        history.splice(index, 1);
    }
    
    // 添加到开头
    history.unshift(keyword);
    
    // 限制数量
    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

// 删除单条搜索历史
function removeSearchHistory(keyword) {
    var history = getSearchHistory();
    var index = history.indexOf(keyword);
    if (index > -1) {
        history.splice(index, 1);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    }
    renderSearchHistory();
}

// 清空所有搜索历史
function clearAllHistory() {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    renderSearchHistory();
}

// 渲染搜索历史
function renderSearchHistory() {
    var history = getSearchHistory();
    var historyList = document.getElementById('historyList');
    
    if (!historyList) return;
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-history">暂无搜索历史</div>';
        return;
    }
    
    var html = '';
    history.forEach(function(keyword) {
        html += '<div class="history-item" onclick="useHistory(\'' + keyword.replace(/'/g, "\\'") + '\')">' +
            '<span class="history-icon">🕐</span>' +
            '<span class="history-text">' + escapeHtml(keyword) + '</span>' +
            '<span class="history-delete" onclick="event.stopPropagation(); removeSearchHistory(\'' + keyword.replace(/'/g, "\\'") + '\')">×</span>' +
        '</div>';
    });
    
    historyList.innerHTML = html;
}

// 使用历史记录搜索
function useHistory(keyword) {
    document.getElementById('searchInput').value = keyword;
    hideSearchHistory();
    toggleClearBtn();
    searchTickets();
}

// 显示搜索历史
function showSearchHistory() {
    renderSearchHistory();
    var historyEl = document.getElementById('searchHistory');
    if (historyEl) {
        historyEl.classList.add('show');
    }
}

// 隐藏搜索历史
function hideSearchHistory() {
    var historyEl = document.getElementById('searchHistory');
    if (historyEl) {
        historyEl.classList.remove('show');
    }
}

// 切换清除按钮显示
function toggleClearBtn() {
    var input = document.getElementById('searchInput');
    var clearBtn = document.getElementById('clearSearch');
    
    if (input && clearBtn) {
        if (input.value.length > 0) {
            clearBtn.classList.add('show');
        } else {
            clearBtn.classList.remove('show');
        }
    }
}

// 清除搜索
function clearSearch() {
    var input = document.getElementById('searchInput');
    if (input) {
        input.value = '';
        toggleClearBtn();
        input.focus();
    }
}

// HTML转义
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 筛选相关变量
var currentFilterType = null;
var filterValues = {
    status: '',
    priority: '',
    time: ''
};

// 筛选选项配置
var filterConfig = {
    status: {
        title: '选择状态',
        options: [
            { value: '', label: '全部状态' },
            { value: '创建/提交', label: '创建/提交' },
            { value: '待分配', label: '待分配' },
            { value: '处理中', label: '处理中' },
            { value: '待客户反馈', label: '待客户反馈' },
            { value: '待研发处理', label: '待研发处理' },
            { value: '已解决', label: '已解决' },
            { value: '已关闭', label: '已关闭' },
            { value: '已取消', label: '已取消' }
        ]
    },
    priority: {
        title: '选择优先级',
        options: [
            { value: '', label: '全部优先级' },
            { value: 'P1', label: 'P1 重大' },
            { value: 'P2', label: 'P2 主要' },
            { value: 'P3', label: 'P3 次要' },
            { value: 'P4', label: 'P4 咨询' }
        ]
    },
    time: {
        title: '选择时间范围',
        options: [
            { value: '', label: '全部时间' },
            { value: 'today', label: '今天' },
            { value: 'week', label: '本周' },
            { value: 'month', label: '本月' },
            { value: 'quarter', label: '本季度' }
        ]
    }
};

// 切换筛选面板
function toggleFilterPanel(type) {
    var panel = document.getElementById('filterPanel');
    var mask = document.getElementById('filterMask');
    var filterBar = document.getElementById('filterBar');
    
    // 如果点击的是当前打开的筛选类型，则关闭
    if (currentFilterType === type && panel.classList.contains('show')) {
        closeFilterPanel();
        return;
    }
    
    currentFilterType = type;
    
    // 更新筛选项样式
    document.querySelectorAll('.filter-item').forEach(function(item) {
        item.classList.remove('active');
    });
    document.getElementById('filter' + type.charAt(0).toUpperCase() + type.slice(1)).classList.add('active');
    
    // 渲染选项
    renderFilterOptions(type);
    
    // 显示面板
    panel.classList.add('show');
    mask.classList.add('show');
    
    // 隐藏搜索历史
    hideSearchHistory();
}

// 渲染筛选选项
function renderFilterOptions(type) {
    var config = filterConfig[type];
    var container = document.getElementById('filterOptions');
    var currentValue = filterValues[type];
    
    var html = '<div style="padding: 10px 0; font-size: 14px; color: #999; border-bottom: 1px solid #f5f5f5; margin-bottom: 10px;">' + config.title + '</div>';
    
    config.options.forEach(function(option) {
        var selected = option.value === currentValue ? 'selected' : '';
        html += '<div class="filter-option ' + selected + '" onclick="selectFilterOption(\'' + type + '\', \'' + option.value + '\')">' +
            '<span>' + option.label + '</span>' +
            '<span class="check-icon">✓</span>' +
        '</div>';
    });
    
    container.innerHTML = html;
}

// 选择筛选选项
function selectFilterOption(type, value) {
    filterValues[type] = value;
    renderFilterOptions(type);
}

// 关闭筛选面板
function closeFilterPanel() {
    var panel = document.getElementById('filterPanel');
    var mask = document.getElementById('filterMask');
    
    panel.classList.remove('show');
    mask.classList.remove('show');
    
    document.querySelectorAll('.filter-item').forEach(function(item) {
        item.classList.remove('active');
    });
    
    currentFilterType = null;
}

// 重置筛选
function resetFilter() {
    if (currentFilterType) {
        filterValues[currentFilterType] = '';
        renderFilterOptions(currentFilterType);
    }
}

// 确认筛选
function confirmFilter() {
    closeFilterPanel();
    applyFilters();
}

// 应用筛选
function applyFilters() {
    var $ = layui.jquery;
    
    // 显示加载中
    $('#ticketList').html('<div class="loading-hint">筛选中...</div>');
    
    // 调用接口获取数据
    $.ajax({
        url: '/system/ticket/table',
        type: 'GET',
        data: {
            page: 1,
            limit: 1000
        },
        dataType: 'json',
        success: function(res) {
            if (res.code === 0 && res.data && res.data.length > 0) {
                // 前端筛选
                var filtered = res.data.filter(function(ticket) {
                    // 状态筛选
                    if (filterValues.status && ticket.status !== filterValues.status) {
                        return false;
                    }
                    
                    // 优先级筛选
                    if (filterValues.priority && ticket.priority !== filterValues.priority) {
                        return false;
                    }
                    
                    // 时间筛选
                    if (filterValues.time && ticket.create_time) {
                        var ticketDate = new Date(ticket.create_time);
                        var now = new Date();
                        var diffDays = Math.floor((now - ticketDate) / (1000 * 60 * 60 * 24));
                        
                        switch(filterValues.time) {
                            case 'today':
                                if (diffDays > 0) return false;
                                break;
                            case 'week':
                                if (diffDays > 7) return false;
                                break;
                            case 'month':
                                if (diffDays > 30) return false;
                                break;
                            case 'quarter':
                                if (diffDays > 90) return false;
                                break;
                        }
                    }
                    
                    return true;
                });
                
                if (filtered.length > 0) {
                    allTickets = filtered;
                    currentPage = 1;
                    totalPages = Math.ceil(filtered.length / pageSize);
                    renderTicketList(filtered.slice(0, pageSize));
                    updateLoadMoreStatus();
                    $('#loadMore').show();
                } else {
                    $('#ticketList').html(renderEmptyState('search'));
                    $('#loadMore').hide();
                }
            } else {
                $('#ticketList').html(renderEmptyState());
                $('#loadMore').hide();
            }
            
            // 更新筛选按钮文字
            updateFilterLabels();
        },
        error: function() {
            $('#ticketList').html(renderEmptyState('error'));
        }
    });
}

// 更新筛选按钮文字
function updateFilterLabels() {
    var statusLabel = filterConfig.status.options.find(function(o) { return o.value === filterValues.status; });
    var priorityLabel = filterConfig.priority.options.find(function(o) { return o.value === filterValues.priority; });
    var timeLabel = filterConfig.time.options.find(function(o) { return o.value === filterValues.time; });
    
    document.querySelector('#filterStatus span:first-child').textContent = statusLabel && filterValues.status ? statusLabel.label : '状态';
    document.querySelector('#filterPriority span:first-child').textContent = priorityLabel && filterValues.priority ? priorityLabel.label : '优先级';
    document.querySelector('#filterTime span:first-child').textContent = timeLabel && filterValues.time ? timeLabel.label : '时间';
}

// 搜索工单
function searchTickets() {
    var $ = layui.jquery;
    var keyword = document.getElementById('searchInput').value.trim();
    
    // 隐藏搜索历史
    hideSearchHistory();
    
    if (!keyword) {
        loadTicketList(1);
        return;
    }
    
    // 保存搜索历史
    saveSearchHistory(keyword);
    
    // 显示加载中
    $('#ticketList').html('<div class="loading-hint">搜索中...</div>');
    
    // 调用PC端接口获取所有数据（搜索时加载全部）
    $.ajax({
        url: '/system/ticket/table',
        type: 'GET',
        data: {
            page: 1,
            limit: 1000
        },
        dataType: 'json',
        success: function(res) {
            if (res.code === 0 && res.data && res.data.length > 0) {
                // 前端过滤
                var filtered = res.data.filter(function(ticket) {
                    var keywordLower = keyword.toLowerCase();
                    // 搜索标题
                    if (ticket.title && ticket.title.toLowerCase().includes(keywordLower)) return true;
                    // 搜索客户名称
                    if (ticket.customer_agent_name && ticket.customer_agent_name.toLowerCase().includes(keywordLower)) return true;
                    // 搜索序列号
                    if (ticket.serial_number && ticket.serial_number.toLowerCase().includes(keywordLower)) return true;
                    // 搜索负责人
                    if (ticket.assignee_name && ticket.assignee_name.toLowerCase().includes(keywordLower)) return true;
                    return false;
                });
                
                if (filtered.length > 0) {
                    // 保存搜索结果并显示
                    searchResults = filtered;
                    renderTicketList(filtered);
                    // 搜索模式下隐藏加载更多
                    $('#loadMore').hide();
                } else {
                    $('#ticketList').html(renderEmptyState('search'));
                    $('#loadMore').hide();
                }
            } else {
                $('#ticketList').html(renderEmptyState('search'));
                $('#loadMore').hide();
            }
        },
        error: function() {
            $('#ticketList').html(renderEmptyState('error'));
        }
    });
}

// 搜索模式标志
var isSearchMode = false;

// 下拉刷新相关变量
var isRefreshing = false;
var startY = 0;
var currentY = 0;
var refreshThreshold = 80; // 下拉阈值

// 初始化下拉刷新
function initPullToRefresh() {
    var container = document.getElementById('pullToRefresh');
    var indicator = document.getElementById('refreshIndicator');
    var icon = document.getElementById('refreshIcon');
    var text = document.getElementById('refreshText');
    
    if (!container) return;
    
    // 触摸开始
    container.addEventListener('touchstart', function(e) {
        if (isRefreshing) return;
        // 只有在顶部时才启用下拉刷新
        if (document.documentElement.scrollTop === 0 || document.body.scrollTop === 0) {
            startY = e.touches[0].clientY;
            currentY = startY;
        }
    }, { passive: true });
    
    // 触摸移动
    container.addEventListener('touchmove', function(e) {
        if (isRefreshing || startY === 0) return;
        
        currentY = e.touches[0].clientY;
        var diff = currentY - startY;
        
        // 只有向下滚动时才触发
        if (diff > 0 && (document.documentElement.scrollTop === 0 || document.body.scrollTop === 0)) {
            e.preventDefault();
            
            // 限制最大下拉距离
            var pullDistance = Math.min(diff * 0.5, 100);
            indicator.style.transform = 'translateY(' + pullDistance + 'px)';
            
            // 旋转箭头
            var rotation = Math.min(pullDistance / refreshThreshold * 180, 180);
            icon.style.transform = 'rotate(' + rotation + 'deg)';
            
            // 更新提示文字
            if (pullDistance >= refreshThreshold) {
                text.textContent = '松开刷新';
                icon.textContent = '↑';
            } else {
                text.textContent = '下拉刷新';
                icon.textContent = '↓';
            }
        }
    }, { passive: false });
    
    // 触摸结束
    container.addEventListener('touchend', function(e) {
        if (isRefreshing || startY === 0) return;
        
        var diff = currentY - startY;
        var pullDistance = Math.min(diff * 0.5, 100);
        
        if (pullDistance >= refreshThreshold) {
            // 触发刷新
            triggerRefresh();
        } else {
            // 复位
            resetRefreshIndicator();
        }
        
        startY = 0;
        currentY = 0;
    });
}

// 触发刷新
function triggerRefresh() {
    var indicator = document.getElementById('refreshIndicator');
    var icon = document.getElementById('refreshIcon');
    var text = document.getElementById('refreshText');
    
    isRefreshing = true;
    indicator.style.transform = 'translateY(50px)';
    indicator.classList.add('refreshing');
    icon.textContent = '⟳';
    icon.classList.add('rotating');
    text.textContent = '刷新中...';
    
    // 执行刷新
    setTimeout(function() {
        // 清空搜索框
        var searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // 重新加载数据
        loadTicketList(1);
        
        // 复位
        setTimeout(function() {
            resetRefreshIndicator();
            isRefreshing = false;
        }, 500);
    }, 1000);
}

// 复位刷新指示器
function resetRefreshIndicator() {
    var indicator = document.getElementById('refreshIndicator');
    var icon = document.getElementById('refreshIcon');
    var text = document.getElementById('refreshText');
    
    indicator.style.transform = 'translateY(0)';
    indicator.classList.remove('refreshing');
    icon.textContent = '↓';
    icon.classList.remove('rotating');
    icon.style.transform = 'rotate(0deg)';
    text.textContent = '下拉刷新';
}

// 初始化（页面加载完成后自动执行）
layui.use(['jquery'], function() {
    // 如果页面有ticketList元素，自动加载
    if (document.getElementById('ticketList')) {
        loadTicketList(1);
        
        // 绑定回车搜索
        var searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchTickets();
                }
            });
        }
        
        // 点击其他地方隐藏搜索历史
        document.addEventListener('click', function(e) {
            var searchHistory = document.getElementById('searchHistory');
            var searchBar = document.querySelector('.search-bar');
            
            if (searchHistory && searchBar && !searchBar.contains(e.target)) {
                hideSearchHistory();
            }
        });
        
        // 初始化下拉刷新
        initPullToRefresh();
        
        // 初始化上拉加载
        initScrollListener();
    }
});

// 显示加载提示
function showLoading(text) {
    var loading = document.getElementById('loadingToast');
    if (loading) {
        loading.querySelector('.loading-text').textContent = text || '加载中...';
        loading.classList.add('active');
    }
}

// 隐藏加载提示
function hideLoading() {
    var loading = document.getElementById('loadingToast');
    if (loading) {
        loading.classList.remove('active');
    }
}

// 显示Toast提示
function showToast(message, type) {
    var toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = 'toast ' + (type || '');
        toast.classList.add('active');
        
        setTimeout(function() {
            toast.classList.remove('active');
        }, 2000);
    }
}

// 导航函数已移至 common.js
