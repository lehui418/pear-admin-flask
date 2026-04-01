/**
 * 移动端查看工单功能
 * 文件路径: static/js/mobile/ticket-view.js
 */

// 工单数据（由HTML页面注入）
var ticketData = window.ticketData || {};

/**
 * 解析图片数据（支持JSON数组格式和旧格式）
 * @param {string} imageStr - 图片数据字符串
 * @returns {Array} 图片数组
 */
function parseImages(imageStr) {
    if (!imageStr) return [];
    
    // 尝试解析为JSON数组（移动端格式）
    try {
        var parsed = JSON.parse(imageStr);
        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch(e) {
        // 不是JSON格式，继续尝试旧格式
    }
    
    // 尝试解析旧格式（PC端格式：@@IMAGE@@#id=xxx(base64data)）
    var images = [];
    if (imageStr.includes('@@IMAGE_SEPARATOR@@')) {
        var parts = imageStr.split('\n@@IMAGE_SEPARATOR@@\n');
        parts.forEach(function(part) {
            if (part && part.includes('@@IMAGE@@')) {
                // 提取base64数据
                var match = part.match(/\((data:image\/[^)]+)\)/);
                if (match) {
                    images.push(match[1]);
                }
            }
        });
    }
    return images;
}

/**
 * 页面加载时初始化
 */
function initViewPage() {
    // 渲染描述图片
    var descriptionImages = parseImages(ticketData.image_references_str_description);
    renderImages('descriptionImages', descriptionImages);
    
    // 渲染处理记录图片
    var relatedinfoImages = parseImages(ticketData.image_references_str_relatedinfo);
    renderImages('relatedinfoImages', relatedinfoImages);
    
    // 渲染处置方案图片
    var solutionImages = parseImages(ticketData.image_references_str_solution);
    renderImages('solutionImages', solutionImages);
}

/**
 * 渲染图片到指定容器
 * @param {string} containerId - 容器ID
 * @param {Array} images - 图片数组
 */
function renderImages(containerId, images) {
    var container = document.getElementById(containerId);
    if (!container || !images || images.length === 0) return;
    
    images.forEach(function(imgSrc) {
        var item = document.createElement('div');
        item.className = 'image-item';
        item.onclick = function() { showImage(imgSrc); };
        item.innerHTML = '<img src="' + imgSrc + '" alt="图片">';
        container.appendChild(item);
    });
}

/**
 * 显示图片预览
 * @param {string} imgSrc - 图片地址
 */
function showImage(imgSrc) {
    var modal = document.getElementById('imageModal');
    var modalImg = document.getElementById('modalImage');
    if (modal && modalImg) {
        modalImg.src = imgSrc;
        modal.classList.add('active');
    }
}

/**
 * 关闭图片预览
 */
function closeImageModal() {
    var modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * 查看流程
 */
function viewFlow() {
    alert('流程功能开发中...');
}

/**
 * 返回上一页
 */
function goBack() {
    history.back();
}

/**
 * 删除工单
 */
function deleteTicket() {
    if (!ticketData.id) return;

    if (confirm('确定删除此工单？')) {
        showLoading('删除中...');

        // 调用删除接口
        fetch('/system/ticket/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ids: [ticketData.id]})
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(res) {
            hideLoading();
            if (res.code === 0 || res.success) {
                showToast('删除成功', 'success');
                setTimeout(function() {
                    window.location.href = '/system/ticket/?mobile=1';
                }, 1500);
            } else {
                showToast(res.msg || '删除失败', 'error');
            }
        })
        .catch(function(error) {
            hideLoading();
            showToast('删除失败: ' + error.message, 'error');
        });
    }
}

/**
 * 显示加载提示
 */
function showLoading(text) {
    var loading = document.getElementById('loadingToast');
    if (loading) {
        loading.querySelector('.loading-text').textContent = text || '加载中...';
        loading.classList.add('active');
    }
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
    var loading = document.getElementById('loadingToast');
    if (loading) {
        loading.classList.remove('active');
    }
}

/**
 * 显示Toast提示
 */
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initViewPage);

// 导航函数已移至 common.js
