/**
 * 移动端产品建议列表功能
 * 文件路径: static/js/mobile/product-suggestion-main.js
 */

var currentPage = 1;
var currentStatus = '';
var isLoading = false;

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    loadSuggestions();
    initFilterButtons();
});

// 加载建议列表
function loadSuggestions(reset) {
    if (isLoading) return;
    isLoading = true;

    if (reset) {
        currentPage = 1;
        document.getElementById('suggestionList').innerHTML = '<div class="loading-hint">加载中...</div>';
    }

    var url = '/system/product_suggestion/table?page=' + currentPage + '&limit=10';
    if (currentStatus) {
        url += '&searchStatus=' + encodeURIComponent(currentStatus);
    }

    var searchTitle = document.getElementById('searchInput').value.trim();
    if (searchTitle) {
        url += '&searchTitle=' + encodeURIComponent(searchTitle);
    }

    fetch(url)
        .then(res => res.json())
        .then(data => {
            isLoading = false;
            if (data.code === 0 && data.data && data.data.length > 0) {
                renderSuggestions(data.data, !reset);
                currentPage++;

                // 判断是否还有更多数据
                if (data.data.length < 10) {
                    document.getElementById('loadMore').style.display = 'none';
                } else {
                    document.getElementById('loadMore').style.display = 'block';
                }
            } else {
                if (currentPage === 1) {
                    document.getElementById('suggestionList').innerHTML =
                        '<div class="empty-state">' +
                        '<div class="empty-icon">💡</div>' +
                        '<div>暂无产品建议</div>' +
                        '</div>';
                }
                document.getElementById('loadMore').style.display = 'none';
            }
        })
        .catch(err => {
            isLoading = false;
            console.error('加载失败:', err);
        });
}

// 渲染建议列表
function renderSuggestions(data, append) {
    var html = '';
    data.forEach(function(item) {
        html += '<div class="suggestion-card">';
        html += '<div class="suggestion-header">';
        html += '<div class="suggestion-title-wrapper">';
        html += '<span class="field-label">建议标题</span>';
        html += '<div class="suggestion-title">' + (item.title || '无标题') + '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="suggestion-meta">';
        html += '<div class="suggestion-tags">';
        html += '<span class="field-label-inline">问题状态</span>';
        html += '<span class="suggestion-status status-' + item.status + '">' + formatStatus(item.status) + '</span>';
        html += '</div>';
        html += '</div>';
        html += '<div class="suggestion-meta">';
        html += '<div class="suggestion-tags">';
        html += '<span class="field-label-inline">优先级</span>';
        html += '<span class="priority-tag priority-' + item.priority + '">' + item.priority + '</span>';
        html += '</div>';
        html += '<div class="suggestion-tags">';
        html += '<span class="field-label-inline">负责人:</span>';
        html += '<span>' + (item.creator_name || '未知') + '</span>';
        html += '</div>';
        html += '</div>';
        html += '<div class="suggestion-actions">';
        html += '<button class="action-btn view-btn" onclick="viewSuggestion(' + item.id + ')">查看</button>';
        html += '<button class="action-btn edit-btn" onclick="editSuggestion(' + item.id + ')">编辑</button>';
        html += '<button class="action-btn delete-btn" onclick="deleteSuggestion(' + item.id + ')">删除</button>';
        html += '</div>';
        html += '</div>';
    });

    var container = document.getElementById('suggestionList');
    if (append) {
        container.innerHTML += html;
    } else {
        container.innerHTML = html;
    }
}

// 编辑建议
function editSuggestion(id) {
    window.location.href = '/system/product_suggestion/edit/' + id + '?mobile=1';
}

// 当前要删除的建议ID
var currentDeleteId = null;

// 显示删除确认弹窗
function showDeleteModal(id) {
    currentDeleteId = id;
    document.getElementById('deleteModal').classList.add('active');
}

// 隐藏删除确认弹窗
function hideDeleteModal() {
    currentDeleteId = null;
    document.getElementById('deleteModal').classList.remove('active');
}

// 确认删除
function confirmDelete() {
    if (!currentDeleteId) return;

    var id = currentDeleteId;
    hideDeleteModal();

    // 显示加载状态
    showLoading('删除中...');

    var formData = new FormData();
    formData.append('id', id);

    fetch('/system/product_suggestion/delete', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        hideLoading();
        if (data.success) {
            showToast('删除成功', 'success');
            loadSuggestions(true);
        } else {
            showToast(data.msg || '删除失败', 'error');
        }
    })
    .catch(err => {
        hideLoading();
        console.error('删除失败:', err);
        showToast('删除失败，请重试', 'error');
    });
}

// 删除建议（旧函数，保留兼容）
function deleteSuggestion(id) {
    showDeleteModal(id);
}

// 格式化状态
function formatStatus(status) {
    var statusMap = {
        'Open': '新建',
        'In Review': '审核中',
        'Accepted': '已接受',
        'Rejected': '已拒绝',
        'Implemented': '已实现'
    };
    return statusMap[status] || status;
}

// 格式化日期
function formatDate(dateStr) {
    if (!dateStr) return '-';
    var date = new Date(dateStr);
    return (date.getMonth() + 1) + '/' + date.getDate();
}

// 初始化筛选按钮
function initFilterButtons() {
    var buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentStatus = this.getAttribute('data-status');
            loadSuggestions(true);
        });
    });
}

// 搜索建议
function searchSuggestions() {
    loadSuggestions(true);
}

// 加载更多
function loadMore() {
    loadSuggestions(false);
}

// 查看建议详情
function viewSuggestion(id) {
    window.location.href = '/system/product_suggestion/view/' + id + '?mobile=1';
}

// 添加建议
function addSuggestion() {
    window.location.href = '/system/product_suggestion/add?mobile=1';
}

// 跳转到产品建议（特殊：跳转到 main 页面）
function goToProductSuggestion() {
    window.location.href = '/system/product_suggestion/main?mobile=1';
}

// 其他导航函数已移至 common.js

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
